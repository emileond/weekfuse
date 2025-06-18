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
        return new Response(JSON.stringify({ success: false, error: 'Missing data' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // --- Step 1: Exchange code for access token (your existing code is fine) ---
        const tokenResponse = await ky
            .post('https://auth.monday.com/oauth2/token', {
                json: {
                    client_id: context.env.MONDAY_CLIENT_ID,
                    client_secret: context.env.MONDAY_CLIENT_SECRET,
                    code,
                    redirect_uri: 'https://weekfuse.com/integrations/oauth/callback/monday',
                    grant_type: 'authorization_code',
                },
            })
            .json();

        const access_token = tokenResponse.access_token;
        if (!access_token) {
            throw new Error('Failed to obtain access token');
        }

        // --- Step 2: Get the Monday User ID of the person who authorized the app ---
        const meQuery = 'query { me { id name } }';
        const meResponse = await ky
            .post('https://api.monday.com/v2', {
                headers: { Authorization: `Bearer ${access_token}` },
                json: { query: meQuery },
            })
            .json();

        const mondayUserId = meResponse.data.me.id;
        if (!mondayUserId) {
            throw new Error('Could not retrieve Monday.com user ID.');
        }

        // --- Step 3: Fetch all relevant items in a loop to handle pagination ---
        let allIncompleteItems = [];
        let cursor = null;

        do {
            // This query finds items assigned to the user that are NOT marked as "Done".
            // NOTE: This assumes your "Done" status is literally named "Done".
            // A more robust solution would first query boards for their specific "done" status labels.
            const itemsQuery = `
              query($cursor: String) {
                items_page_by_column_values(
                  limit: 100,
                  cursor: $cursor,
                  columns: [
                    { column_id: "person", column_values: ["${mondayUserId}"] },
                    { column_id: "status", column_values: ["Done"], negate: true }
                  ]
                ) {
                  cursor
                  items {
                    id
                    name
                    board {
                      id
                      name
                    }
                    column_values {
                      id
                      title
                      text
                      value
                    }
                  }
                }
              }
            `;

            const itemsResponse = await ky
                .post('https://api.monday.com/v2', {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        'Content-Type': 'application/json',
                    },
                    json: {
                        query: itemsQuery,
                        variables: { cursor },
                    },
                })
                .json();

            if (itemsResponse.errors) {
                console.error('GraphQL Errors:', JSON.stringify(itemsResponse.errors, null, 2));
                throw new Error('Failed to fetch items from Monday.com');
            }

            const pageData = itemsResponse.data.items_page_by_column_values;
            if (pageData && pageData.items.length > 0) {
                allIncompleteItems.push(...pageData.items);
            }
            cursor = pageData.cursor;
        } while (cursor);

        console.log(`Found ${allIncompleteItems.length} incomplete items assigned to the user.`);

        // --- Step 4: Save the integration and process the fetched items ---
        const { error: updateError } = await supabase.from('user_integrations').upsert({
            type: 'monday',
            access_token,
            user_id,
            workspace_id,
            status: 'active',
            last_sync: toUTC(),
            config: { syncStatus: 'complete' },
        });

        if (updateError) throw updateError;

        if (allIncompleteItems.length > 0) {
            const upsertPromises = allIncompleteItems.map((item) => {
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
            await Promise.all(upsertPromises);
        }

        // --- Step 5: Set up webhooks (optional but good to have) ---
        const uniqueBoardIds = [...new Set(allIncompleteItems.map((item) => item.board.id))];
        if (uniqueBoardIds.length > 0) {
            const webhookUrl = 'https://weekfuse.com/webhooks/monday';
            const webhookPromises = uniqueBoardIds.map((boardId) => {
                const webhookMutation = `
                    mutation {
                        create_webhook(board_id: ${boardId}, url: "${webhookUrl}", event: change_column_value) {
                            id
                        }
                    }`;
                return ky
                    .post('https://api.monday.com/v2', {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            'Content-Type': 'application/json',
                        },
                        json: { query: webhookMutation },
                    })
                    .json()
                    .catch((err) =>
                        console.error(`Failed to create webhook for board ${boardId}:`, err),
                    );
            });
            await Promise.all(webhookPromises);
        }

        return new Response(
            JSON.stringify({
                success: true,
                items_imported: allIncompleteItems.length,
            }),
            { headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        console.error('Error in Monday auth flow:', error);
        if (error.response) {
            const errorBody = await error.response.text();
            console.error('API Error Body:', errorBody);
        }
        return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
