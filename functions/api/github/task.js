import { createClient } from '@supabase/supabase-js';
import { Octokit } from 'octokit';
import { toUTC } from '../../../src/utils/dateUtils.js';
import ky from 'ky';

export async function onRequestPatch(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the request body
        const { external_id, url, state, user_id } = await context.request.json();

        if (!external_id || !url || !state || !user_id) {
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
            .from('user_integrations')
            .select('id, access_token, refresh_token')
            .eq('type', 'github')
            // .eq('status', 'active')
            .eq('user_id', user_id)
            .single();

        if (integrationError || !integration) {
            console.log(integrationError);
            return Response.json(integrationError, { status: 404 });
        }

        const res = await ky
            .post('https://github.com/login/oauth/access_token', {
                searchParams: {
                    client_id: context.env.GITHUB_CLIENT_ID,
                    client_secret: context.env.GITHUB_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                    refresh_token: integration.refresh_token,
                },
                headers: {
                    Accept: 'application/json',
                },
            })
            .json();

        if (res.error) {
            console.log(res);
            await supabase
                .from('user_integrations')
                .update({
                    status: 'error',
                })
                .eq('id', integration.id);

            return Response.json(res, { status: 400 });
        }

        const { access_token, refresh_token } = res;

        // Update integration access_token and the last_sync timestamp
        await supabase
            .from('user_integrations')
            .update({
                access_token,
                refresh_token,
                last_sync: toUTC(),
            })
            .eq('id', integration.id);

        // Initialize Oktokit
        const octokit = new Octokit({ auth: access_token });

        // Update the issue state in GitHub
        const response = await octokit.request(`PATCH ${url}`, { state: state });

        if (response.status !== 200) {
            console.log(response);
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
            console.log(updateError);
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
        console.log('Error updating GitHub task:', error);
        return Response.json(error, { status: 500 });
    }
}
