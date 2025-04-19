import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';

// Handle GET requests to fetch checklists for a Trello card
export async function onRequestGet(context) {
    try {
        // Get the card ID from the URL
        const url = new URL(context.request.url);
        const cardId = url.searchParams.get('cardId');

        if (!cardId) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing cardId parameter',
                },
                { status: 400 },
            );
        }

        const workspace_id = url.searchParams.get('workspace_id');
        if (!workspace_id) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing workspace_id parameter',
                },
                { status: 400 },
            );
        }

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the workspace integration to get the access_token
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('access_token')
            .eq('type', 'trello')
            .eq('status', 'active')
            .eq('workspace_id', workspace_id)
            .single();

        if (integrationError || !integration) {
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

        // Fetch checklists for the card
        const checklists = await ky
            .get(
                `https://api.trello.com/1/cards/${cardId}/checklists?key=${context.env.TRELLO_API_KEY}&token=${accessToken}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .json();

        return Response.json({
            success: true,
            checklists,
        });
    } catch (error) {
        console.error('Error fetching Trello checklists:', error);
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

// Handle POST requests to update a checklist item
export async function onRequestPost(context) {
    try {
        // Get the request body
        const { cardId, checklistId, checkItemId, state, workspace_id } = await context.request.json();

        if (!cardId || !checklistId || !checkItemId || !state || !workspace_id) {
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
            .select('access_token')
            .eq('type', 'trello')
            .eq('status', 'active')
            .eq('workspace_id', workspace_id)
            .single();

        if (integrationError || !integration) {
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

        // Update the checklist item
        await ky.put(
            `https://api.trello.com/1/cards/${cardId}/checkItem/${checkItemId}?key=${context.env.TRELLO_API_KEY}&token=${accessToken}&state=${state}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            },
        );

        // Update the task in Supabase if needed
        const { data: task, error: selectError } = await supabase
            .from('tasks')
            .select('external_data')
            .eq('external_id', cardId)
            .eq('integration_source', 'trello')
            .single();

        if (!selectError && task) {
            // Fetch the updated card to get the new checklist status
            const updatedCard = await ky
                .get(
                    `https://api.trello.com/1/cards/${cardId}?key=${context.env.TRELLO_API_KEY}&token=${accessToken}&fields=all&checklists=all`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                )
                .json();

            // Update the external_data with the new card data
            await supabase
                .from('tasks')
                .update({ external_data: updatedCard })
                .eq('external_id', cardId)
                .eq('integration_source', 'trello');
        }

        return Response.json({
            success: true,
            message: 'Checklist item updated successfully',
        });
    } catch (error) {
        console.error('Error updating Trello checklist item:', error);
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