import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

// Handle DELETE requests for disconnecting Trello integration
export async function onRequestDelete(context) {
    try {
        const body = await context.request.json();
        const { access_token } = body;

        if (!access_token) {
            return Response.json(
                { success: false, error: 'Missing access_token' },
                { status: 400 },
            );
        }

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        try {
            // Revoke the token with Trello's API
            await ky.delete(
                `https://api.trello.com/1/tokens/${access_token}/?key=${context.env.TRELLO_API_KEY}&token=${access_token}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            console.log(`Successfully revoked Trello token: ${access_token}`);
        } catch (revokeError) {
            console.error('Error revoking Trello token:', revokeError);
            // Continue with deletion from database even if API revocation fails
        }

        // Delete the token from the database
        const { error: deleteError } = await supabase
            .from('user_integrations')
            .delete()
            .eq('type', 'trello')
            .eq('access_token', access_token);

        if (deleteError) {
            console.error('Error deleting Trello integration from database:', deleteError);
            return Response.json(
                { success: false, error: 'Failed to delete integration data' },
                { status: 500 },
            );
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting Trello integration:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}

// Handle POST requests for initiating Trello OAuth flow
export async function onRequestPost(context) {
    const body = await context.request.json();
    const { access_token, user_id, workspace_id } = body;

    if (!access_token || !user_id || !workspace_id) {
        return Response.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Save the access token in Supabase
        const { error: updateError } = await supabase.from('user_integrations').upsert({
            type: 'trello',
            access_token: access_token,
            user_id,
            workspace_id,
            status: 'active',
            last_sync: toUTC(),
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

        // Get boards the member belongs to
        const boards = await ky
            .get(
                `https://api.trello.com/1/members/me/boards?key=${context.env.TRELLO_API_KEY}&token=${access_token}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            )
            .json();

        // Get all cards from boards that are visible to the member
        let allCards = [];

        // Iterate through each board and get all cards
        if (boards && Array.isArray(boards)) {
            const cardPromises = boards.map((board) => {
                const boardCardsUrl = `https://api.trello.com/1/boards/${board.id}/cards/open?key=${context.env.TRELLO_API_KEY}&token=${access_token}`;
                return ky
                    .get(boardCardsUrl, {
                        headers: {
                            Accept: 'application/json',
                        },
                    })
                    .json();
            });

            const boardCardsResults = await Promise.all(cardPromises);

            // Combine all cards from all boards
            allCards = boardCardsResults.flat();
        }

        const cardsData = allCards;

        // Process and store cards
        if (cardsData && Array.isArray(cardsData)) {
            const upsertPromises = cardsData.map((card) => {
                // Convert markdown description to Tiptap format
                const tiptapDescription = card?.desc ? markdownToTipTap(card.desc) : null;

                return supabase.from('tasks').upsert(
                    {
                        name: card.name,
                        description: tiptapDescription,
                        workspace_id,
                        integration_source: 'trello',
                        external_id: card.id,
                        external_data: card,
                        // created_at: card.dateLastActivity,
                    },
                    {
                        onConflict: ['integration_source', 'external_id'],
                    },
                );
            });

            const results = await Promise.all(upsertPromises);

            results.forEach((result, index) => {
                if (result.error) {
                    console.error(`Upsert error for card ${cardsData[index].id}:`, result.error);
                } else {
                    console.log(`Card ${cardsData[index].id} imported successfully`);
                }
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error in Trello auth flow:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
