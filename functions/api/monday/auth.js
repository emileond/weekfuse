import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

// Handle DELETE requests for disconnecting Monday integration
export async function onRequestDelete(context) {
    try {
        const body = await context.request.json();
        const { id } = body;

        if (!id) {
            return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
        }

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        const { data, error } = await supabase
            .from('user_integrations')
            .select('access_token, user_id, workspace_id')
            .eq('type', 'monday')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching Monday integration from database:', error);
            return Response.json(
                { success: false, error: 'Failed to delete integration data' },
                { status: 500 },
            );
        }

        const { access_token, user_id, workspace_id } = data;

        try {
            // Revoke the token with Monday's API
            // Note: Monday.com might have a different approach to revoking tokens
            await ky.delete(`https://api.monday.com/v2/oauth/revoke`, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log(`Successfully revoked Monday token: ${access_token}`);
        } catch (revokeError) {
            console.error('Error revoking Monday token:', revokeError);
            // Continue with deletion from database even if API revocation fails
        }

        // Delete the token from the database
        const { error: deleteError } = await supabase
            .from('user_integrations')
            .delete()
            .eq('type', 'monday')
            .eq('access_token', access_token);

        if (deleteError) {
            console.error('Error deleting Monday integration from database:', deleteError);
            return Response.json(
                { success: false, error: 'Failed to delete integration data' },
                { status: 500 },
            );
        }

        // Delete the backlog tasks from the database
        await supabase
            .from('tasks')
            .delete()
            .eq('integration_source', 'monday')
            .eq('status', 'pending')
            .eq('creator', user_id)
            .eq('workspace_id', workspace_id)
            .is('date', null);

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting Monday integration:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}

// Handle POST requests for initiating Monday OAuth flow
export async function onRequestPost(context) {
    const body = await context.request.json();
    const { code, user_id, workspace_id } = body;

    if (!code || !user_id || !workspace_id) {
        return Response.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Exchange the authorization code for an access token
        const tokenResponse = await ky
            .post('https://auth.monday.com/oauth2/token', {
                json: {
                    client_id: context.env.MONDAY_CLIENT_ID,
                    client_secret: context.env.MONDAY_CLIENT_SECRET,
                    code,
                    redirect_uri: 'https://weekfuse.com/integrations/oauth/callback/monday',
                    grant_type: 'authorization_code',
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .json();

        const access_token = tokenResponse.access_token;

        if (!access_token) {
            return Response.json(
                { success: false, error: 'Failed to obtain access token' },
                { status: 500 },
            );
        }

        // Save the access token in Supabase
        const { data: upsertData, error: updateError } = await supabase
            .from('user_integrations')
            .upsert({
                type: 'monday',
                access_token: access_token,
                user_id,
                workspace_id,
                status: 'active',
                last_sync: toUTC(),
                config: { syncStatus: 'prompt' },
            })
            .select('id')
            .single();

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

        const integration_id = upsertData.id;

        // Get boards the user has access to
        const boardsQuery = `
            query {
                boards {
                    id
                    name
                    description
                    items {
                        id
                        name
                        column_values {
                            id
                            title
                            text
                        }
                    }
                }
            }
        `;

        const boardsResponse = await ky
            .post('https://api.monday.com/v2', {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: boardsQuery,
                }),
            })
            .json();

        const boards = boardsResponse.data?.boards || [];

        // Process and store items from all boards
        if (boards && Array.isArray(boards)) {
            const allItems = [];

            // Collect all items from all boards
            boards.forEach((board) => {
                if (board.items && Array.isArray(board.items)) {
                    board.items.forEach((item) => {
                        // Add board info to each item for reference
                        item.board = {
                            id: board.id,
                            name: board.name,
                        };
                        allItems.push(item);
                    });
                }
            });

            // Process and store items
            const upsertPromises = allItems.map((item) => {
                // Convert description to Tiptap format if available
                const descriptionColumn = item.column_values.find(
                    (col) => col.title.toLowerCase() === 'description' || col.id === 'description',
                );
                const tiptapDescription = descriptionColumn?.text
                    ? markdownToTipTap(descriptionColumn.text)
                    : null;

                return supabase.from('tasks').upsert(
                    {
                        name: item.name,
                        description: tiptapDescription,
                        workspace_id,
                        integration_source: 'monday',
                        external_id: item.id,
                        external_data: {
                            ...item,
                            board_id: item.board.id,
                            board_name: item.board.name,
                        },
                        host: `https://monday.com/boards/${item.board.id}/pulses/${item.id}`,
                        assignee: user_id,
                        creator: user_id,
                    },
                    {
                        onConflict: 'integration_source, external_id, host, workspace_id',
                    },
                );
            });

            const results = await Promise.all(upsertPromises);

            results.forEach((result, index) => {
                if (result.error) {
                    console.error(`Upsert error for item ${allItems[index].id}:`, result.error);
                } else {
                    console.log(`Item ${allItems[index].id} imported successfully`);
                }
            });
        }

        // Set up webhooks for each board
        if (boards && Array.isArray(boards)) {
            try {
                const webhookUrl = 'https://weekfuse.com/webhooks/monday';

                // Create webhooks for each board
                const webhookPromises = boards.map(async (board) => {
                    try {
                        // Create a webhook for this board
                        const webhookMutation = `
                            mutation {
                                create_webhook(board_id: ${board.id}, url: "${webhookUrl}", event: "change_column_value") {
                                    id
                                }
                            }
                        `;

                        await ky.post('https://api.monday.com/v2', {
                            json: {
                                query: webhookMutation,
                            },
                            headers: {
                                Authorization: `Bearer ${access_token}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        console.log(
                            `Webhook created successfully for board ${board.id} (${board.name})`,
                        );
                        return { success: true, boardId: board.id };
                    } catch (webhookError) {
                        console.error(
                            `Error creating webhook for board ${board.id}:`,
                            webhookError,
                        );
                        return { success: false, boardId: board.id, error: webhookError };
                    }
                });

                await Promise.all(webhookPromises);
            } catch (webhooksError) {
                console.error('Error creating webhooks:', webhooksError);
                // Continue with the flow even if webhook creation fails
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error in Monday auth flow:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
