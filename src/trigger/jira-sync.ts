import { logger, schedules, AbortTaskRunError } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { toUTC, calculateExpiresAt } from '../utils/dateUtils';
import ky from 'ky';
import { tinymceToTiptap } from '../utils/editorUtils';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const jiraSync = schedules.task({
    id: 'jira-sync',
    cron: '*/10 * * * *', // Every 10 minutes
    maxDuration: 3000, // 50 minutes max duration
    run: async () => {
        logger.log('Starting Jira sync task');

        // Calculate the timestamp for 2 hours ago in UTC
        const timeRange = dayjs().utc().subtract(2, 'hours').toISOString();

        // Fetch active workspace integrations that need syncing
        const { data: integrations, error: fetchError } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('type', 'jira')
            .eq('status', 'active')
            .lt('last_sync', timeRange)
            .limit(100);

        if (fetchError) {
            logger.error(`Error fetching Jira integrations: ${fetchError.message}`);
            return { success: false, error: fetchError.message };
        }

        if (!integrations || integrations.length === 0) {
            logger.log('No Jira integrations need syncing');
            return { success: true, synced: 0 };
        }

        logger.log(`Found ${integrations.length} Jira integrations to sync`);

        let syncedCount = 0;
        let failedCount = 0;

        // Process each integration
        for (const integration of integrations) {
            try {
                // Check if token has expired
                const currentTime = dayjs().utc();
                const tokenExpired =
                    !integration.expires_at || currentTime.isAfter(dayjs(integration.expires_at));

                let access_token = integration.access_token;
                let refresh_token = integration.refresh_token;
                let expires_at = integration.expires_at;

                // Only refresh token if it has expired
                if (tokenExpired) {
                    logger.log(`Access token expired, refreshing`);
                    const res = await ky
                        .post('https://auth.atlassian.com/oauth/token', {
                            json: {
                                client_id: process.env.JIRA_CLIENT_ID,
                                client_secret: process.env.JIRA_CLIENT_SECRET,
                                refresh_token: integration.refresh_token,
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
                            .eq('id', integration.id);
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
                            .eq('id', integration.id);
                    }
                } else {
                    // Token is still valid, just update the last_sync timestamp
                    await supabase
                        .from('user_integrations')
                        .update({
                            last_sync: toUTC(),
                        })
                        .eq('id', integration.id);
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
                    continue;
                }

                let issuesData = [];

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

                    // Merge the issues from this resource into the overall issuesData array
                    issuesData = [...issuesData, ...resourceIssues];
                }

                // Process and store issues
                if (issuesData && Array.isArray(issuesData)) {
                    const upsertPromises = issuesData.map((issue) => {
                        const convertedDesc = tinymceToTiptap(issue?.fields?.description);
                        return supabase.from('tasks').upsert(
                            {
                                name: issue.fields.summary,
                                description: convertedDesc || null,
                                workspace_id: integration.workspace_id,
                                integration_source: 'jira',
                                external_id: issue.id,
                                external_data: issue,
                                // created_at: issue.fields.created,
                            },
                            {
                                onConflict: ['integration_source', 'external_id'],
                            },
                        );
                    });

                    const results = await Promise.all(upsertPromises);

                    let issueSuccessCount = 0;
                    let issueFailCount = 0;

                    results.forEach((result, index) => {
                        if (result.error) {
                            logger.error(
                                `Upsert error for issue ${issuesData[index].id}: ${result.error.message}`,
                            );
                            issueFailCount++;
                        } else {
                            issueSuccessCount++;
                        }
                    });

                    logger.log(
                        `Processed ${issuesData.length} issues for workspace ${integration.workspace_id}: ${issueSuccessCount} succeeded, ${issueFailCount} failed`,
                    );
                }

                syncedCount++;
                logger.log(
                    `Successfully synced Jira integration for workspace ${integration.workspace_id}`,
                );
            } catch (error) {
                console.log(error);
                failedCount++;
                logger.error(
                    `Error syncing Jira integration for workspace ${integration.workspace_id}: ${error.message}`,
                );
            }
        }

        return {
            success: true,
            synced: syncedCount,
            failed: failedCount,
            total: integrations.length,
        };
    },
});
