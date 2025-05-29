import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC, calculateExpiresAt } from '../../../src/utils/dateUtils.js';
import { tinymceToTiptap } from '../../../src/utils/editorUtils.js';

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
        const { error: updateError } = await supabase.from('user_integrations').upsert({
            type: 'jira',
            access_token: access_token,
            refresh_token: refresh_token,
            user_id,
            workspace_id,
            status: 'active',
            last_sync: toUTC(),
            expires_at,
            config: { resources: [] }, // Will store Jira cloud instance IDs
        });

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

        const resources = await ky
            .get('https://api.atlassian.com/oauth/token/accessible-resources', {
                headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' },
            })
            .json();

        let issuesData = [];

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

            // Merge the issues from this resource into the overall issuesData array
            issuesData = [...issuesData, ...resourceIssues];
        }

        // Process and store issues (simplified for now)
        if (issuesData && Array.isArray(issuesData)) {
            const upsertPromises = issuesData.map((issue) => {
                const convertedDesc = tinymceToTiptap(issue?.fields?.description);
                return supabase.from('tasks').upsert(
                    {
                        name: issue.fields.summary,
                        description: convertedDesc || null,
                        workspace_id,
                        integration_source: 'jira',
                        external_id: issue.id,
                        external_data: issue,
                        // created_at: issue.created_at,
                    },
                    {
                        onConflict: ['integration_source', 'external_id'],
                    },
                );
            });

            const results = await Promise.all(upsertPromises);

            results.forEach((result, index) => {
                if (result.error) {
                    console.error(`Upsert error for issue ${issuesData[index].id}:`, result.error);
                } else {
                    console.log(`Issue ${issuesData[index].id} imported successfully`);
                }
            });
        }

        // Get the current integration to update its config
        const { data: integrationData, error: fetchError } = await supabase
            .from('user_integrations')
            .select('config')
            .eq('type', 'jira')
            .eq('user_id', user_id)
            .eq('workspace_id', workspace_id)
            .single();

        if (fetchError) {
            console.error('Error fetching integration data:', fetchError);
        }

        // Initialize resourceIds array to store the IDs of resources we register webhooks for
        const resourceIds = [];

        // Register webhooks for each resource
        for (const resource of resources) {
            try {
                // Add resource ID to the array
                resourceIds.push(resource.id);

                // Check if webhook already exists
                const webhooksResponse = await ky
                    .get(`https://api.atlassian.com/ex/jira/${resource.id}/rest/api/3/webhook`, {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            Accept: 'application/json',
                        },
                    })
                    .json();

                // Check if our webhook URL is already registered
                const webhookUrl = `https://weekfuse.com/functions/webhooks/jira`;
                const existingWebhook = webhooksResponse.values.find(webhook => 
                    webhook.url === webhookUrl && 
                    webhook.events.some(event => WEBHOOK_EVENTS.includes(event))
                );

                if (!existingWebhook) {
                    // Register new webhook
                    await ky
                        .post(`https://api.atlassian.com/ex/jira/${resource.id}/rest/api/3/webhook`, {
                            json: {
                                url: webhookUrl,
                                events: WEBHOOK_EVENTS,
                                filters: {
                                    'issue-related-events-section': 'assignee = currentUser()'
                                },
                                name: 'Weekfuse Integration',
                                excludeBody: false
                            },
                            headers: {
                                Authorization: `Bearer ${access_token}`,
                                'Content-Type': 'application/json',
                            },
                        });

                    console.log(`Webhook registered successfully for resource ${resource.id}`);
                } else {
                    console.log(`Webhook already exists for resource ${resource.id}`);
                }
            } catch (webhookError) {
                console.error(`Error registering webhook for resource ${resource.id}:`, webhookError);
                // Continue with other resources even if webhook registration fails for one
            }
        }

        // Update the integration with the resource IDs
        const config = integrationData?.config || {};
        config.resources = resourceIds;

        const { error: updateConfigError } = await supabase
            .from('user_integrations')
            .update({ config })
            .eq('type', 'jira')
            .eq('user_id', user_id)
            .eq('workspace_id', workspace_id);

        if (updateConfigError) {
            console.error('Error updating integration config:', updateConfigError);
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
