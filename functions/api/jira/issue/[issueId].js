import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { calculateExpiresAt } from '../../../../src/utils/dateUtils.js';

// This function will handle GET requests for a single Jira issue
export async function onRequestGet(context) {
    try {
        const { issueId } = context.params;
        const url = new URL(context.request.url);
        const workspace_id = url.searchParams.get('workspace_id');
        const user_id = url.searchParams.get('user_id');

        if (!issueId || !workspace_id || !user_id) {
            return Response.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 },
            );
        }

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the workspace integration to get the access_token
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('access_token, refresh_token, expires_at')
            .eq('type', 'jira')
            .eq('status', 'active')
            .eq('workspace_id', workspace_id)
            .eq('user_id', user_id)
            .single();

        if (integrationError || !integration) {
            return Response.json(
                { success: false, error: 'Jira integration not found' },
                { status: 404 },
            );
        }

        // --- Token Refresh Logic (identical to your other endpoint) ---
        const currentTime = dayjs().utc();
        const tokenExpired =
            !integration.expires_at || currentTime.isAfter(dayjs(integration.expires_at));
        let accessToken = integration.access_token;

        if (tokenExpired) {
            const newToken = await ky
                .post('https://auth.atlassian.com/oauth/token', {
                    json: {
                        grant_type: 'refresh_token',
                        client_id: context.env.JIRA_CLIENT_ID,
                        client_secret: context.env.JIRA_CLIENT_SECRET,
                        refresh_token: integration.refresh_token,
                    },
                })
                .json();
            accessToken = newToken.access_token;
            await supabase
                .from('user_integrations')
                .update({
                    access_token: newToken.access_token,
                    refresh_token: newToken.refresh_token,
                    expires_at: calculateExpiresAt(newToken.expires_in),
                })
                .match({ user_id, workspace_id, type: 'jira' });
        }
        // --- End Token Refresh Logic ---

        // Get accessible Jira resources
        const resources = await ky
            .get('https://api.atlassian.com/oauth/token/accessible-resources', {
                headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
            })
            .json();
        if (!resources || resources.length === 0) {
            return Response.json(
                { success: false, error: 'No accessible Jira resources found' },
                { status: 404 },
            );
        }
        const resource = resources[0];

        // Fetch the issue details from Jira
        const issueDetails = await ky
            .get(`https://api.atlassian.com/ex/jira/${resource.id}/rest/api/2/issue/${issueId}`, {
                headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
            })
            .json();

        return Response.json({
            success: true,
            issue: issueDetails,
        });
    } catch (error) {
        console.error('Error fetching Jira issue:', error);
        return Response.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 },
        );
    }
}
