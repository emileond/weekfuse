import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC, calculateExpiresAt } from '../../../src/utils/dateUtils.js';
import { App, Octokit } from 'octokit';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

// Handle DELETE requests for disconnecting GitHub integration
export async function onRequestDelete(context) {
    try {
        const body = await context.request.json();
        const { id, installation_id } = body;

        if (!id || !installation_id) {
            return Response.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 },
            );
        }
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        try {
            const app = new App({
                appId: context.env.GITHUB_APP_ID,
                privateKey: context.env.GITHUB_PRIVATE_KEY,
            });

            const octokit = await app.getInstallationOctokit(installation_id);

            await octokit.request(`DELETE /app/installations/${installation_id}`);

            console.log(`Successfully revoked GitHub installation: ${installation_id}`);
        } catch (revokeError) {
            console.error('Error revoking GitHub installation:', revokeError);
            return Response.error();
        }

        // Delete the token from the database
        const { error: deleteError } = await supabase
            .from('user_integrations')
            .delete()
            .eq('type', 'github')
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting Trello integration from database:', deleteError);
            return Response.json(
                { success: false, error: 'Failed to delete integration data' },
                { status: 500 },
            );
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting GitHub integration:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}

// Handle POST requests for initiating GitHub OAuth flow
export async function onRequestPost(context) {
    const body = await context.request.json();
    const { code, user_id, workspace_id, installation_id } = body;

    if (!code || !user_id || !workspace_id || !installation_id) {
        return Response.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Exchange code for access token
        const tokenResponse = await ky.post('https://github.com/login/oauth/access_token', {
            json: {
                client_id: context.env.GITHUB_CLIENT_ID,
                client_secret: context.env.GITHUB_CLIENT_SECRET,
                code: code,
                redirect_uri: 'https://weekfuse.com/integrations/oauth/callback/github',
            },
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Weekfuse',
            },
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error || !tokenData.access_token) {
            console.error('GitHub token exchange error:', tokenData);
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
        if (tokenData.expires_in) {
            expires_at = calculateExpiresAt(tokenData.expires_in - 600);
        }

        // Save the access token in Supabase
        const { error: updateError } = await supabase.from('user_integrations').upsert({
            type: 'github',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            installation_id,
            user_id,
            workspace_id,
            status: 'active',
            last_sync: toUTC(),
            expires_at,
            config: { syncStatus: 'prompt' },
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

        const octokit = new Octokit({ auth: tokenData.access_token });

        const issuesData = await octokit.paginate('GET /issues?state=open');

        // Process and store issues
        if (issuesData && Array.isArray(issuesData)) {
            const upsertPromises = issuesData.map((issue) =>
                supabase.from('tasks').upsert(
                    {
                        name: issue.title,
                        description: issue.body ? markdownToTipTap(issue.body) : null,
                        workspace_id,
                        integration_source: 'github',
                        external_id: issue.id,
                        external_data: issue,
                        host: issue.url,
                        assignee: user_id,
                    },
                    {
                        onConflict: ['integration_source', 'external_id', 'host'],
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

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error in GitHub auth flow:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
