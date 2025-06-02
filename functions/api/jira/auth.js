import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC, calculateExpiresAt } from '../../../src/utils/dateUtils.js';
import { convertJiraAdfToTiptap } from '../../../src/utils/editorUtils.js';

// Webhook events to listen for
const WEBHOOK_EVENTS = ['jira:issue_created', 'jira:issue_updated'];

// Handle POST requests for initiating Jira OAuth flow
export async function onRequestPost(context) {
    const body = await context.request.json();
    const { code, user_id, workspace_id } = body;

    if (!code || !user_id || !workspace_id) {
        return Response.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Exchange code for access token
        const tokenData = await ky
            .post('https://auth.atlassian.com/oauth/token', {
                json: {
                    client_id: context.env.JIRA_CLIENT_ID,
                    client_secret: context.env.JIRA_CLIENT_SECRET,
                    code: code,
                    redirect_uri: 'https://weekfuse.com/integrations/oauth/callback/jira',
                    grant_type: 'authorization_code',
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .json();

        const { access_token, refresh_token, expires_in } = await tokenData;

        if (!access_token || !refresh_token) {
            console.error('Jira token exchange error:', tokenData);
            return Response.json(
                {
                    success: false,
                    error: tokenData.error || 'Failed to get access token',
                },
                { status: 400 },
            );
        }

        // Calculate expires_at if expires_in is available
        let expires_at = null;
        if (expires_in) {
            expires_at = calculateExpiresAt(expires_in - 600);
        }

        // Save the access token in Supabase
        const { data: upsertData, error: updateError } = await supabase
            .from('user_integrations')
            .upsert({
                type: 'jira',
                access_token: access_token,
                refresh_token: refresh_token,
                user_id,
                workspace_id,
                status: 'active',
                last_sync: toUTC(),
                expires_at,
                config: { syncStatus: 'prompt' },
            })
            .select('id')
            .single();

        const integration_id = upsertData.id;

        if (updateError) {
            console.error('Supabase update error:', updateError);
            return Response.json(
                {
                    success: false,
                    error: 'Failed to save integration data',
                },
                { status: 500 },
            );
        }

        const maxResults = 50; // Define the maximum number of issues per page

        // Fetch accessible resources
        const resources = await ky
            .get('https://api.atlassian.com/oauth/token/accessible-resources', {
                headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' },
            })
            .json();

        // Fetch user data from Jira API
        try {
            if (resources && resources.length > 0) {
                // Use the first resource to fetch user data
                const userData = await ky
                    .get(`https://api.atlassian.com/ex/jira/${resources[0].id}/rest/api/3/myself`, {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            Accept: 'application/json',
                        },
                    })
                    .json();

                // Update user_integrations with the user data
                const { error: userDataUpdateError } = await supabase
                    .from('user_integrations')
                    .update({ external_data: userData })
                    .eq('type', 'jira')
                    .eq('id', integration_id);

                if (userDataUpdateError) {
                    console.error('Error updating user data:', userDataUpdateError);
                } else {
                    console.log('User data updated successfully');
                }
            }
        } catch (userDataError) {
            console.error('Error fetching user data:', userDataError);
            // Continue with the flow even if user data fetch fails
        }

        let allUpsertPromises = [];
        let allIssuesData = [];

        for (const resource of resources) {
            let startAt = 0;
            let total = 0;
            let resourceIssues = [];

            do {
                // Construct the URL for the current page.
                const url = `https://api.atlassian.com/ex/jira/${resource.id}/rest/api/3/search?jql=assignee=currentUser()%20AND%20statusCategory!=Done&startAt=${startAt}&maxResults=${maxResults}`;

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

                // Append the current page's issues to the resource's issue list.
                resourceIssues = [...resourceIssues, ...pageIssues];

                // Update total and startAt for pagination
                total = totalIssues;
                startAt += maxResults;
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
                            workspace_id,
                            integration_source: 'jira',
                            external_id: issue.id,
                            external_data: issue,
                            host: resourceUrl,
                            assignee: user_id,
                            creator: user_id,
                        },
                        {
                            onConflict: ['integration_source', 'external_id', 'host'],
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

            results.forEach((result, index) => {
                if (result.error) {
                    console.error(
                        `Upsert error for issue ${allIssuesData[index].id}:`,
                        result.error,
                    );
                } else {
                    console.log(`Issue ${allIssuesData[index].id} imported successfully`);
                }
            });
        }

        // Register webhooks for each resource
        for (const resource of resources) {
            try {
                // Check if a webhook already exists
                const webhooksResponse = await ky
                    .get(`https://api.atlassian.com/ex/jira/${resource.id}/rest/api/3/webhook`, {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            Accept: 'application/json',
                        },
                    })
                    .json();

                // Check if our webhook URL is already registered
                const webhookUrl = `https://weekfuse.com/webhooks/jira`;
                const existingWebhook = webhooksResponse.values.find(
                    (webhook) =>
                        webhook.url === webhookUrl &&
                        webhook.webhooks?.some((wh) =>
                            wh.events?.some((event) => WEBHOOK_EVENTS.includes(event)),
                        ),
                );

                if (!existingWebhook) {
                    // Register new webhook
                    await ky.post(
                        `https://api.atlassian.com/ex/jira/${resource.id}/rest/api/3/webhook`,
                        {
                            json: {
                                url: webhookUrl,
                                webhooks: [
                                    {
                                        events: WEBHOOK_EVENTS,
                                        jqlFilter: 'assignee = currentUser()',
                                    },
                                ],
                            },
                            headers: {
                                Authorization: `Bearer ${access_token}`,
                                'Content-Type': 'application/json',
                            },
                        },
                    );

                    console.log(`Webhook registered successfully for resource ${resource.id}`);
                } else {
                    console.log(`Webhook already exists for resource ${resource.id}`);
                }
            } catch (webhookError) {
                console.error(
                    `Error registering webhook for resource ${resource.id}:`,
                    webhookError,
                );
                // Continue with other resources even if webhook registration fails for one
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error in Jira auth flow:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
