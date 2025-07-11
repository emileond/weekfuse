import { logger, task } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { toUTC, calculateExpiresAt } from '../utils/dateUtils';
import ky from 'ky';
import { convertJiraAdfToTiptap } from '../utils/editorUtils';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const jiraSync = task({
    id: 'jira-sync',
    maxDuration: 3600, // 50 minutes max duration
    run: async (payload: any) => {
        logger.log('Starting Jira sync task');

        try {
            // Get project_id from integration config if available
            const project_id = payload.config?.project_id || null;

            // Check if token has expired
            const currentTime = dayjs().utc();
            const tokenExpired =
                !payload.expires_at || currentTime.isAfter(dayjs(payload.expires_at));

            let access_token = payload.access_token;
            let refresh_token = payload.refresh_token;
            let expires_at = payload.expires_at;

            // Only refresh token if it has expired
            if (tokenExpired) {
                logger.log(`Access token expired, refreshing`);
                const res = await ky
                    .post('https://auth.atlassian.com/oauth/token', {
                        json: {
                            client_id: process.env.JIRA_CLIENT_ID,
                            client_secret: process.env.JIRA_CLIENT_SECRET,
                            refresh_token: payload.refresh_token,
                            grant_type: 'refresh_token',
                        },
                        headers: {
                            Accept: 'application/json',
                        },
                    })
                    .json();

                if (res.error) {
                    logger.error('Failed to refresh access token', res.error);
                    await supabase
                        .from('user_integrations')
                        .update({
                            status: 'error',
                        })
                        .eq('id', payload.id);
                } else {
                    // Update token information
                    access_token = res.access_token;
                    refresh_token = res.refresh_token;
                    expires_at = calculateExpiresAt(res.expires_in);

                    // Update the database with new token information
                    await supabase
                        .from('user_integrations')
                        .update({
                            access_token,
                            refresh_token,
                            expires_at,
                            last_sync: toUTC(),
                        })
                        .eq('id', payload.id);
                }
            } else {
                // Token is still valid, just update the last_sync timestamp
                await supabase
                    .from('user_integrations')
                    .update({
                        last_sync: toUTC(),
                    })
                    .eq('id', payload.id);
            }

            // Get the resources for the Jira instance
            const resources = await ky
                .get('https://api.atlassian.com/oauth/token/accessible-resources', {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        Accept: 'application/json',
                    },
                })
                .json();

            if (!resources || resources.length === 0) {
                logger.error('No accessible Jira resources found');
            }

            let allUpsertPromises = [];
            let allIssuesData = [];

            // Process each Jira resource (instance)
            for (const resource of resources) {
                const maxResults = 50; // Define the maximum number of issues per page
                let startAt = 0;
                let total = 0;
                let resourceIssues = [];

                do {
                    // Construct the URL for the current page
                    const url = `https://api.atlassian.com/ex/jira/${resource.id}/rest/api/3/search?jql=assignee=currentUser()%20AND%20statusCategory!=Done&startAt=${startAt}&maxResults=${maxResults}`;

                    try {
                        const pageData = await ky
                            .get(url, {
                                headers: {
                                    Authorization: `Bearer ${access_token}`,
                                    Accept: 'application/json',
                                },
                            })
                            .json();

                        // Destructure the issues array and total count from the response
                        const { issues: pageIssues = [], total: totalIssues = 0 } = pageData;

                        // Append the current page's issues to the resource's issue list
                        resourceIssues = [...resourceIssues, ...pageIssues];

                        // Update total and startAt for pagination
                        total = totalIssues;
                        startAt += maxResults;
                    } catch (error) {
                        logger.error(`Error fetching Jira issues: ${error.message}`);
                        break;
                    }
                } while (startAt < total);

                // Process and store issues for this resource
                if (resourceIssues && Array.isArray(resourceIssues)) {
                    const resourceUrl = resource.url;

                    const upsertPromises = resourceIssues.map((issue) => {
                        const convertedDesc = convertJiraAdfToTiptap(issue?.fields?.description);
                        return supabase.from('tasks').upsert(
                            {
                                name: issue.fields.summary,
                                description: convertedDesc || null,
                                workspace_id: payload.workspace_id,
                                integration_source: 'jira',
                                external_id: issue.id,
                                external_data: issue,
                                host: resourceUrl,
                                assignee: payload.user_id,
                                creator: payload.user_id,
                                project_id: project_id,
                            },
                            {
                                onConflict: 'integration_source, external_id, host, workspace_id',
                            },
                        );
                    });

                    // Add the promises and issues to our arrays for later processing
                    allUpsertPromises = [...allUpsertPromises, ...upsertPromises];
                    allIssuesData = [...allIssuesData, ...resourceIssues];
                }
            }

            // Wait for all upsert operations to complete
            if (allUpsertPromises.length > 0) {
                const results = await Promise.all(allUpsertPromises);

                let issueSuccessCount = 0;
                let issueFailCount = 0;

                results.forEach((result, index) => {
                    if (result.error) {
                        logger.error(
                            `Upsert error for issue ${allIssuesData[index].id}: ${result.error.message}`,
                        );
                        issueFailCount++;
                    } else {
                        issueSuccessCount++;
                    }
                });

                logger.log(
                    `Processed ${allIssuesData.length} issues for workspace ${payload.workspace_id}: ${issueSuccessCount} succeeded, ${issueFailCount} failed`,
                );
            }

            // Check and refresh webhooks
            logger.log('Checking webhooks for refresh');
            for (const resource of resources) {
                try {
                    // Fetch webhooks
                    const webhooksResponse = await ky
                        .get(
                            `https://api.atlassian.com/ex/jira/${resource.id}/rest/api/3/webhook`,
                            {
                                headers: {
                                    Authorization: `Bearer ${access_token}`,
                                    Accept: 'application/json',
                                },
                            },
                        )
                        .json();

                    if (webhooksResponse.values && webhooksResponse.values.length > 0) {
                        const now = dayjs();
                        const webhooksToRefresh = [];

                        // Check for webhooks that will expire within 7 days
                        for (const webhook of webhooksResponse.values) {
                            if (webhook.expirationDate) {
                                const expirationDate = dayjs(webhook.expirationDate);
                                const daysUntilExpiration = expirationDate.diff(now, 'day');

                                if (daysUntilExpiration <= 7) {
                                    logger.log(
                                        `Webhook ${webhook.id} will expire in ${daysUntilExpiration} days. Refreshing...`,
                                    );
                                    webhooksToRefresh.push(webhook.id);
                                }
                            }
                        }

                        // Refresh webhooks that are close to expiring
                        if (webhooksToRefresh.length > 0) {
                            const refreshResponse = await ky
                                .put(
                                    `https://api.atlassian.com/ex/jira/${resource.id}/rest/api/3/webhook/refresh`,
                                    {
                                        json: {
                                            webhookIds: webhooksToRefresh,
                                        },
                                        headers: {
                                            Authorization: `Bearer ${access_token}`,
                                            'Content-Type': 'application/json',
                                        },
                                    },
                                )
                                .json();

                            logger.log(
                                `Successfully refreshed ${webhooksToRefresh.length} webhooks for resource ${resource.id}`,
                            );
                        } else {
                            logger.log(`No webhooks need refreshing for resource ${resource.id}`);
                        }
                    } else {
                        logger.log(`No webhooks found for resource ${resource.id}`);
                    }
                } catch (webhookError) {
                    logger.error(
                        `Error checking/refreshing webhooks for resource ${resource.id}: ${webhookError.message}`,
                    );
                    // Continue with other resources even if webhook refresh fails for one
                }
            }

            logger.log(
                `Successfully synced Jira integration for workspace ${payload.workspace_id}`,
            );
        } catch (error) {
            console.log(error);
            logger.error(
                `Error syncing Jira integration for workspace ${payload.workspace_id}: ${error.message}`,
            );
        }

        return {
            success: true,
        };
    },
});
