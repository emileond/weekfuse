import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';

// Handle POST requests for initiating Jira OAuth flow
export async function onRequestPost(context) {
    const body = await context.request.json();
    const { code, workspace_id } = body;

    if (!code || !workspace_id) {
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

        const { access_token, refresh_token } = await tokenData;

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

        // Save the access token in Supabase
        const { error: updateError } = await supabase.from('workspace_integrations').upsert({
            type: 'jira',
            access_token: access_token,
            refresh_token: refresh_token,
            workspace_id,
            status: 'active',
            last_sync: toUTC(),
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

                console.log(pageData);

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
            const upsertPromises = issuesData.map((issue) =>
                supabase.from('tasks').upsert(
                    {
                        name: issue.description,
                        // description: {
                        //     type: 'doc',
                        //     content: [
                        //         {
                        //             type: 'paragraph',
                        //             content: [{ type: 'text', text: issue.body }],
                        //         },
                        //     ],
                        // },
                        workspace_id: workspace_id,
                        integration_source: 'jira',
                        external_id: issue.id,
                        external_data: issue,
                        // created_at: issue.created_at,
                    },
                    {
                        onConflict: ['integration_source', 'external_id'],
                    },
                ),
            );

            const results = await Promise.all(upsertPromises);

            results.forEach((result, index) => {
                if (result.error) {
                    console.error(`Upsert error for issue ${issuesData[index].id}:`, result.error);
                } else {
                    console.log(`Issue ${issuesData[index].id} imported successfully`);
                }
            });
        }

        return Response.json({ success: true, issuesData });
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
