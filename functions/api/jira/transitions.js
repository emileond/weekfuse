import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { calculateExpiresAt } from '../../../src/utils/dateUtils.js';

// Handle GET requests to fetch transitions for a Jira issue
export async function onRequestGet(context) {
    try {
        // Get the issue ID or key from the URL
        const url = new URL(context.request.url);
        const issueIdOrKey = url.searchParams.get('issueIdOrKey');

        if (!issueIdOrKey) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing issueIdOrKey parameter',
                },
                { status: 400 },
            );
        }

        const workspace_id = url.searchParams.get('workspace_id');
        const user_id = url.searchParams.get('user_id');

        if (!workspace_id || !user_id) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing parameters',
                },
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
                {
                    success: false,
                    error: 'Jira integration not found',
                    details: integrationError,
                },
                { status: 404 },
            );
        }

        // Check if token has expired
        const currentTime = dayjs().utc();
        const tokenExpired =
            !integration.expires_at || currentTime.isAfter(dayjs(integration.expires_at));

        let accessToken = integration.access_token;
        let refreshToken = integration.refresh_token;

        // Only refresh token if it has expired
        if (tokenExpired) {
            console.log('Access token expired, refreshing');

            // Refresh token
            const newToken = await ky
                .post('https://auth.atlassian.com/oauth/token', {
                    json: {
                        client_id: context.env.JIRA_CLIENT_ID,
                        client_secret: context.env.JIRA_CLIENT_SECRET,
                        refresh_token: integration.refresh_token,
                        grant_type: 'refresh_token',
                    },
                    headers: {
                        Authorization: `Bearer ${integration.access_token}`,
                        Accept: 'application/json',
                    },
                })
                .json();

            console.log(newToken);

            if (!newToken) {
                return Response.json(
                    {
                        success: false,
                        error: 'Unable to refresh token',
                    },
                    { status: 401 },
                );
            }

            // Update token information
            accessToken = newToken.access_token;
            refreshToken = newToken.refresh_token;
            const expiresAt = calculateExpiresAt(newToken.expires_in);

            // Update the database with new token information
            await supabase
                .from('user_integrations')
                .update({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_at: expiresAt,
                })
                .eq('type', 'jira')
                .eq('status', 'active')
                .eq('user_id', user_id)
                .eq('workspace_id', workspace_id);
        }

        // Get the resources for the Jira instance
        const resources = await ky
            .get('https://api.atlassian.com/oauth/token/accessible-resources', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json',
                },
            })
            .json();

        if (!resources || resources.length === 0) {
            return Response.json(
                {
                    success: false,
                    error: 'No accessible Jira resources found',
                },
                { status: 404 },
            );
        }

        // Use the first resource (Jira instance)
        const resource = resources[0];

        // Fetch transitions for the issue
        const transitionsResponse = await ky
            .get(
                `https://api.atlassian.com/ex/jira/${resource.id}/rest/api/2/issue/${issueIdOrKey}/transitions`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/json',
                    },
                },
            )
            .json();

        return Response.json({
            success: true,
            transitions: transitionsResponse.transitions || [],
        });
    } catch (error) {
        console.error('Error fetching Jira transitions:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
                details: error.message,
            },
            { status: 500 },
        );
    }
}

// Handle POST requests to transition a Jira issue
export async function onRequestPost(context) {
    try {
        // Get the request body
        const { task_id, issueIdOrKey, transitionId, user_id, workspace_id } =
            await context.request.json();

        if (!task_id || !issueIdOrKey || !transitionId || !user_id || !workspace_id) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing required parameters',
                },
                { status: 400 },
            );
        }

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the workspace integration to get the access_token
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('access_token, refresh_token, expires_at, external_data')
            .eq('type', 'jira')
            .eq('status', 'active')
            .eq('user_id', user_id)
            .eq('workspace_id', workspace_id)
            .single();

        if (integrationError || !integration) {
            return Response.json(
                {
                    success: false,
                    error: 'Jira integration not found',
                    details: integrationError,
                },
                { status: 404 },
            );
        }

        // Check if token has expired
        const currentTime = dayjs().utc();
        const tokenExpired =
            !integration.expires_at || currentTime.isAfter(dayjs(integration.expires_at));

        let accessToken = integration.access_token;
        let refreshToken = integration.refresh_token;

        // Only refresh token if it has expired
        if (tokenExpired) {
            console.log('Access token expired, refreshing');

            // Refresh token
            const newToken = await ky
                .post('https://auth.atlassian.com/oauth/token', {
                    json: {
                        client_id: context.env.JIRA_CLIENT_ID,
                        client_secret: context.env.JIRA_CLIENT_SECRET,
                        refresh_token: integration.refresh_token,
                        grant_type: 'refresh_token',
                    },
                    headers: {
                        Authorization: `Bearer ${integration.access_token}`,
                        Accept: 'application/json',
                    },
                })
                .json();

            if (!newToken) {
                return Response.json(
                    {
                        success: false,
                        error: 'Unable to refresh token',
                    },
                    { status: 401 },
                );
            }

            // Update token information
            accessToken = newToken.access_token;
            refreshToken = newToken.refresh_token;
            const expiresAt = calculateExpiresAt(newToken.expires_in);

            // Update the database with new token information
            await supabase
                .from('user_integrations')
                .update({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_at: expiresAt,
                })
                .eq('type', 'jira')
                .eq('status', 'active')
                .eq('user_id', user_id)
                .eq('workspace_id', workspace_id);
        }

        // Get the resources for the Jira instance
        const resources = await ky
            .get('https://api.atlassian.com/oauth/token/accessible-resources', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json',
                },
            })
            .json();

        if (!resources || resources.length === 0) {
            return Response.json(
                {
                    success: false,
                    error: 'No accessible Jira resources found',
                },
                { status: 404 },
            );
        }

        // Use the first resource (Jira instance)
        const resource = resources[0];

        // Transition the issue
        await ky.post(
            `https://api.atlassian.com/ex/jira/${resource.id}/rest/api/2/issue/${issueIdOrKey}/transitions`,
            {
                json: {
                    transition: {
                        id: transitionId,
                    },
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            },
        );

        // Update the task in Supabase if needed
        const { data: task, error: selectError } = await supabase
            .from('tasks')
            .select('external_data')
            .eq('id', task_id)
            .single();

        if (!selectError && task) {
            // Fetch the updated issue to get the new status
            const updatedIssue = await ky
                .get(
                    `https://api.atlassian.com/ex/jira/${resource.id}/rest/api/2/issue/${issueIdOrKey}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: 'application/json',
                        },
                    },
                )
                .json();

            const updatedExternalData = {
                ...task.external_data,
                fields: {
                    ...task.external_data.fields,
                    status: updatedIssue.fields.status,
                },
            };

            await supabase
                .from('tasks')
                .update({ external_data: updatedExternalData })
                .eq('id', task_id)
                .eq('integration_source', 'jira');
        }

        return Response.json({
            success: true,
            message: `Jira issue transitioned successfully`,
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
                details: error.message,
            },
            { status: 500 },
        );
    }
}
