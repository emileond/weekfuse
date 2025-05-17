import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';

export async function onRequestPatch(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the request body
        const { external_id, status, user_id } = await context.request.json();

        if (!external_id || !user_id || !status) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing required parameters',
                },
                { status: 400 },
            );
        }

        // Get the user integration to get the access_token
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('id, access_token')
            .eq('type', 'clickup')
            .eq('user_id', user_id)
            .single();

        if (integrationError || !integration) {
            console.log(integrationError);
            return Response.json(
                {
                    success: false,
                    error: 'ClickUp integration not found',
                    details: integrationError,
                },
                { status: 404 },
            );
        }

        const accessToken = integration.access_token;

        // Update the task's status in ClickUp
        // For ClickUp, we need to set the status to the specified value
        // The status field in ClickUp is more complex than Trello's dueComplete
        const response = await ky
            .put(`https://api.clickup.com/api/v2/task/${external_id}`, {
                json: {
                    status: status,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
            .json();

        return Response.json({
            success: true,
            message: `ClickUp task status updated to ${status}`,
        });
    } catch (error) {
        console.log('Error updating ClickUp task:', error);
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
