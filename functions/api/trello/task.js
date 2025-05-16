import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';

export async function onRequestPatch(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the request body
        const { external_id, state, user_id } = await context.request.json();

        console.log(state);

        if (!external_id || !state || !user_id) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing required parameters',
                },
                { status: 400 },
            );
        }

        // Validate state value
        if (state !== 'complete' && state !== 'incomplete') {
            return Response.json(
                {
                    success: false,
                    error: 'Invalid state value. Must be "complete" or "incomplete".',
                },
                { status: 400 },
            );
        }

        // Get the user integration to get the access_token
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('id, access_token')
            .eq('type', 'trello')
            .eq('user_id', user_id)
            .single();

        if (integrationError || !integration) {
            console.log(integrationError);
            return Response.json(
                {
                    success: false,
                    error: 'Trello integration not found',
                    details: integrationError,
                },
                { status: 404 },
            );
        }

        const accessToken = integration.access_token;

        // Update the card's closed status in Trello
        const response = await ky
            .put(
                `https://api.trello.com/1/cards/${external_id}?key=${context.env.TRELLO_API_KEY}&token=${accessToken}`,
                {
                    json: {
                        dueComplete: state === 'complete',
                    },
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .json();

        return Response.json({
            success: true,
            message: `Trello card status updated to ${state}`,
        });
    } catch (error) {
        console.log('Error updating Trello task:', error);
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
