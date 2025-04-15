import { createClient } from '@supabase/supabase-js';
import { Octokit } from 'octokit';

export async function onRequestPatch(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the request body
        const { external_id, url, state, workspace_id } = await context.request.json();

        if (!external_id || !url || !state || !workspace_id) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing required parameters',
                },
                { status: 400 },
            );
        }

        // Validate state value
        if (state !== 'open' && state !== 'closed') {
            return Response.json(
                {
                    success: false,
                    error: 'Invalid state value.',
                },
                { status: 400 },
            );
        }

        // Get the workspace integration to get the access_token
        const { data: integration, error: integrationError } = await supabase
            .from('workspace_integrations')
            .select('access_token, refresh_token')
            .eq('type', 'github')
            .eq('status', 'active')
            .eq('workspace_id', workspace_id)
            .single();

        if (integrationError || !integration) {
            return Response.json(
                {
                    success: false,
                    error: 'GitHub integration not found',
                    details: integrationError,
                },
                { status: 404 },
            );
        }

        // Initialize Oktokit
        const octokit = new Octokit({ auth: integration.access_token });

        // Update the issue state in GitHub
        const response = await octokit.request(`PATCH ${url}`, { state: state });

        if (response.status !== 200) {
            return Response.json(
                {
                    success: false,
                    error: 'Failed to update GitHub issue',
                    details: response.data,
                },
                { status: response.status },
            );
        }

        // Update the task in Supabase with the new state

        const { data: task, error: selectError } = await supabase
            .from('tasks')
            .select('external_data')
            .eq('external_id', external_id)
            .single();

        const updatedExternalData = {
            ...task.external_data,
            state: state,
        };

        const { error: updateError } = await supabase
            .from('tasks')
            .update({ external_data: updatedExternalData })
            .eq('external_id', external_id)
            .eq('integration_source', 'github');

        if (updateError) {
            return Response.json(
                {
                    success: false,
                    error: 'Failed to update task in database',
                    details: updateError,
                },
                { status: 500 },
            );
        }

        return Response.json({
            success: true,
            message: `GitHub issue state updated to ${state}`,
        });
    } catch (error) {
        console.error('Error updating GitHub task:', error);
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
