import ky from 'ky';
import { createClient } from '@supabase/supabase-js';

export async function onRequestPatch(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the request body
        const { external_id, project_id, state, user_id } = await context.request.json();

        if (!external_id || !state || !user_id || !project_id) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing required parameters',
                },
                { status: 400 },
            );
        }

        // Validate state value
        if (state !== 'completed' && state !== 'pending') {
            return Response.json(
                {
                    success: false,
                    error: 'Invalid state value. Must be "completed" or "pending".',
                },
                { status: 400 },
            );
        }

        // Get the user integration to get the access_token
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('id, access_token, refresh_token')
            .eq('type', 'ticktick')
            .eq('user_id', user_id)
            .single();

        if (integrationError || !integration) {
            console.log(integrationError);
            return Response.json(
                {
                    success: false,
                    error: 'TickTick integration not found',
                    details: integrationError,
                },
                { status: 404 },
            );
        }

        const accessToken = integration.access_token;

        // // Get the task from TickTick to get its current data
        const taskResponse = await ky
            .get(`https://api.ticktick.com/open/v1/project/${project_id}/task/${external_id}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
            .json();

        // Update the task's status in TickTick
        const updatedTask = {
            ...taskResponse,
            status: state === 'completed' ? 2 : 0,
        };

        // Send the update to TickTick
        const response = await ky
            .post(`https://api.ticktick.com/open/v1/task/${external_id}`, {
                json: updatedTask,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
            .json();

        console.log(response);

        return Response.json(response);
    } catch (error) {
        console.log('Error updating TickTick task:', error);
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
