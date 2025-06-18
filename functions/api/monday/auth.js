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

// Helper function to make API calls to Monday.com
async function mondayApiCall(query, token, variables = {}) {
    const response = await ky.post('https://api.monday.com/v2', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        json: { query, variables },
        throwHttpErrors: false // Prevent ky from throwing on non-2xx responses
    }).json();

    if (response.errors) {
        console.error("GraphQL Error:", JSON.stringify(response.errors, null, 2));
        // Throw an error with the detailed message from the API
        throw new Error(response.errors.map(e => e.message).join(', '));
    }

    if (response.error_message) {
        console.error("Monday API Error:", response.error_message);
        throw new Error(response.error_message);
    }

    return response.data;
}

// Handle POST requests for initiating Monday OAuth flow
export async function onRequestPost(context) {
    const body = await context.request.json();
    const { code, user_id, workspace_id } = body;

    if (!code || !user_id || !workspace_id) {
        return new Response(JSON.stringify({ success: false, error: 'Missing data' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // --- Step 1: Exchange code for access token ---
        const tokenResponse = await ky.post('https://auth.monday.com/oauth2/token', {
            json: {
                client_id: context.env.MONDAY_CLIENT_ID,
                client_secret: context.env.MONDAY_CLIENT_SECRET,
                code,
                redirect_uri: 'https://weekfuse.com/integrations/oauth/callback/monday',
            },
        }).json();

        const access_token = tokenResponse.access_token;
        if (!access_token) {
            throw new Error('Failed to obtain access token');
        }

        // --- Step 2: Get the Monday User ID of the authenticated user ---
        const meData = await mondayApiCall('query { me { id } }', access_token);
        const mondayUserId = meData.me.id;

        // --- Step 3: Get all boards the user has access to ---
        const boardsData = await mondayApiCall('query { boards(limit: 1000) { id name } }', access_token);
        const boards = boardsData.boards;

        let allIncompleteItems = [];

        // --- Step 4: Loop through each board and fetch filtered items ---
        for (const board of boards) {
            let cursor = null;
            let hasMorePages = true;

            while (hasMorePages) {
                // This is the new, correct query for filtering items within a single board
                const itemsQuery = `
                  query($boardId: ID!, $userId: ID!, $cursor: String) {
                    boards(ids: [$boardId]) {
                      items_page(
                        limit: 100,
                        cursor: $cursor,
                        query_params: {
                          rules: [
                            { column_id: "person", compare_value: [$userId] },
                            { column_id: "status", compare_value: [1], compare_method: "is_not" }
                          ]
                        }
                      ) {
                        cursor
                        items {
                          id
                          name
                          board { id name }
                          column_values {
                            id
                            text
                            value
                            column { title }
                          }
                        }
                      }
                    }
                  }
                `;

                const variables = { boardId: board.id, userId: mondayUserId, cursor };
                const pageData = await mondayApiCall(itemsQuery, access_token, variables);

                const itemsPage = pageData.boards[0]?.items_page;
                if (itemsPage && itemsPage.items.length > 0) {
                    allIncompleteItems.push(...itemsPage.items);
                }

                cursor = itemsPage ? itemsPage.cursor : null;
                hasMorePages = !!cursor; // Continue if the API returns a cursor
            }
        }

        console.log(`Found a total of ${allIncompleteItems.length} incomplete items.`);

        // --- Step 5: Save integration and process items (your logic is good here) ---
        if (allIncompleteItems.length > 0) {
            const upsertPromises = allIncompleteItems.map(item => {
                const descriptionColumn = item.column_values.find(
                    (col) => col.column.title.toLowerCase() === 'description'
                );
                const tiptapDescription = markdownToTipTap(descriptionColumn?.text);

                return supabase.from('tasks').upsert({
                    name: item.name,
                    description: tiptapDescription,
                    workspace_id,
                    integration_source: 'monday',
                    external_id: item.id,
                    external_data: { ...item },
                    host: `https://monday.com/boards/${item.board.id}/pulses/${item.id}`,
                    assignee: user_id,
                    creator: user_id,
                }, {
                    onConflict: 'integration_source, external_id, host, workspace_id',
                });
            });
            await Promise.all(upsertPromises);
        }

        // The rest of your logic for saving the integration and setting up webhooks can follow...

        return new Response(JSON.stringify({ success: true, items_imported: allIncompleteItems.length }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error in Monday auth flow:', error);
        return new Response(JSON.stringify({ success: false, error: error.message || 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}