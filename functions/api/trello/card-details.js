import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { toUTC } from '../../../src/utils/dateUtils.js';

// Handle GET requests to fetch details for a Trello card
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

        // Fetch card details
        const cardDetails = await ky
            .get(
                `https://api.trello.com/1/cards/${cardId}?key=${context.env.TRELLO_API_KEY}&token=${accessToken}&fields=all`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .json();

        // Fetch board details
        const boardDetails = await ky
            .get(
                `https://api.trello.com/1/boards/${cardDetails.idBoard}?key=${context.env.TRELLO_API_KEY}&token=${accessToken}&fields=name,url,shortUrl`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .json();

        // Fetch list details
        const listDetails = await ky
            .get(
                `https://api.trello.com/1/lists/${cardDetails.idList}?key=${context.env.TRELLO_API_KEY}&token=${accessToken}&fields=name`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .json();

        return Response.json({
            success: true,
            card: cardDetails,
            board: boardDetails,
            list: listDetails,
        });
    } catch (error) {
        console.error('Error fetching Trello card details:', error);
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