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

async function mondayApiCall(query, token, variables = {}) {
    const response = await ky
        .post('https://api.monday.com/v2', {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            json: { query, variables },
            throwHttpErrors: false, // We'll handle HTTP errors manually
        })
        .json();

    // Check for GraphQL-specific errors in the response body
    if (response.errors) {
        console.error('GraphQL Error:', JSON.stringify(response.errors, null, 2));
        // Combine all error messages into a single, readable error
        const combinedMessage = response.errors.map((e) => e.message).join(', ');
        throw new Error(combinedMessage);
    }

    // Check for other API errors
    if (response.error_message) {
        console.error('Monday API Error:', response.error_message);
        throw new Error(response.error_message);
    }

    return response.data;
}

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

        // --- Step 1: Exchange authorization code for an access token ---
        const tokenResponse = await ky
            .post('https://auth.monday.com/oauth2/token', {
                json: {
                    client_id: context.env.MONDAY_CLIENT_ID,
                    client_secret: context.env.MONDAY_CLIENT_SECRET,
                    code,
                    redirect_uri: 'https://weekfuse.com/integrations/oauth/callback/monday',
                },
            })
            .json();

        const access_token = tokenResponse.access_token;
        if (!access_token) {
            throw new Error('Failed to obtain access token');
        }

        // --- Step 2: Get the Monday.com User ID of the person who authorized the app ---
        const meData = await mondayApiCall('query { me { id } }', access_token);
        const mondayUserId = meData.me.id;

        // --- Step 3: Get all boards the user has access to ---
        const boardsData = await mondayApiCall(
            'query { boards(limit: 1000) { id name } }',
            access_token,
        );
        const boards = boardsData.boards || [];

        let allIncompleteItems = [];

        // --- Step 4: Loop through each board and fetch items that match our filters ---
        for (const board of boards) {
            let cursor = null;
            let hasMorePages = true;

            // This inner loop handles pagination for the items on the current board
            while (hasMorePages) {
                // Simplified query that doesn't use the complex rules parameter
                const itemsQuery = `
                  query($boardId: ID!, $cursor: String) {
                    boards(ids: [$boardId]) {
                      items_page(limit: 100, cursor: $cursor) {
                        cursor
                        items {
                          id
                          name
                          board { id name }
                          column_values {
                            id
                            text
                            value
                            type
                          }
                          columns {
                            id
                            title
                            type
                          }
                        }
                      }
                    }
                  }
                `;

                const variables = {
                    boardId: board.id,
                    cursor,
                };

                const pageData = await mondayApiCall(itemsQuery, access_token, variables);

                const itemsPage = pageData.boards[0]?.items_page;
                if (itemsPage && itemsPage.items.length > 0) {
                    // Filter items to only include those assigned to the user and not completed
                    const filteredItems = itemsPage.items.filter(item => {
                        // Create a map of column id to title for easier lookup
                        const columnMap = {};
                        if (item.columns) {
                            item.columns.forEach(col => {
                                columnMap[col.id] = col.title;
                            });
                        }

                        // Find the person column to check if the item is assigned to the user
                        const personColumn = item.column_values.find(
                            col => col.id === 'person' || 
                                  (columnMap[col.id] && 
                                   (columnMap[col.id] === 'Person' || 
                                    columnMap[col.id] === 'Assignee'))
                        );

                        // Find the status column to check if the item is completed
                        const statusColumn = item.column_values.find(
                            col => col.id === 'status' || 
                                  (columnMap[col.id] && 
                                   columnMap[col.id] === 'Status')
                        );

                        // Check if the item is assigned to the user
                        let isAssignedToUser = false;
                        if (personColumn && personColumn.value) {
                            try {
                                const personValue = JSON.parse(personColumn.value);
                                isAssignedToUser = personValue.personsAndTeams && 
                                    personValue.personsAndTeams.some(person => person.id === mondayUserId);
                            } catch (e) {
                                // If parsing fails, assume it's not assigned to the user
                                isAssignedToUser = false;
                            }
                        }

                        // Check if the item is not completed
                        let isNotCompleted = true;
                        if (statusColumn && statusColumn.value) {
                            try {
                                const statusValue = JSON.parse(statusColumn.value);
                                // Check if the status is "Done" or "Completed"
                                isNotCompleted = !(statusValue.label === 'Done' || 
                                                  statusValue.label === 'Completed' || 
                                                  statusValue.label === 'Complete');
                            } catch (e) {
                                // If parsing fails, assume it's not completed
                                isNotCompleted = true;
                            }
                        }

                        return isAssignedToUser && isNotCompleted;
                    });

                    console.log(`Board ${board.name} (${board.id}): Found ${itemsPage.items.length} items, filtered to ${filteredItems.length} items assigned to user and not completed`);
                    allIncompleteItems.push(...filteredItems);
                }

                cursor = itemsPage ? itemsPage.cursor : null;
                hasMorePages = !!cursor; // Continue looping only if the API gives us a new cursor.
            }
        }

        console.log(
            `Found a total of ${allIncompleteItems.length} incomplete items across all boards.`,
        );

        // --- Step 5: Save integration status and process the fetched items ---
        await supabase.from('user_integrations').upsert({
            type: 'monday',
            access_token,
            user_id,
            workspace_id,
            status: 'active',
            last_sync: toUTC(),
            config: { syncStatus: 'complete' },
        });

        if (allIncompleteItems.length > 0) {
            const upsertPromises = allIncompleteItems.map((item) => {
                // Create a map of column id to title for easier lookup
                const columnMap = {};
                if (item.columns) {
                    item.columns.forEach(col => {
                        columnMap[col.id] = col.title;
                    });
                }

                // Find the description column
                const descriptionColumn = item.column_values.find(
                    (col) => col.id.toLowerCase() === 'description' || 
                             (columnMap[col.id] && columnMap[col.id].toLowerCase() === 'description')
                );
                const tiptapDescription = markdownToTipTap(descriptionColumn?.text);

                // Get the board ID, handling both possible structures
                const boardId = item.board?.id || item.board_id;

                return supabase.from('tasks').upsert(
                    {
                        name: item.name,
                        description: tiptapDescription,
                        workspace_id,
                        integration_source: 'monday',
                        external_id: item.id,
                        external_data: { ...item },
                        host: `https://monday.com/boards/${boardId}/pulses/${item.id}`,
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

        // --- Step 6: Set up webhooks on all relevant boards ---
        // Extract board IDs from the items, ensuring we have the correct property path
        const uniqueBoardIds = [...new Set(allIncompleteItems.map((item) => {
            // Handle both possible structures: item.board.id or item.board_id
            return item.board?.id || item.board_id;
        }))].filter(Boolean); // Filter out any undefined or null values
        if (uniqueBoardIds.length > 0) {
            const webhookUrl = 'https://weekfuse.com/webhooks/monday';
            const webhookPromises = uniqueBoardIds.map((boardId) => {
                const webhookMutation = `
                    mutation create_webhook($boardId: ID!, $url: String!, $event: WebhookEventType!) {
                        create_webhook(board_id: $boardId, url: $url, event: $event) {
                            id
                        }
                    }`;
                const variables = { boardId, url: webhookUrl, event: 'change_column_value' };
                return mondayApiCall(webhookMutation, access_token, variables).catch((err) =>
                    console.error(`Failed to create webhook for board ${boardId}:`, err),
                ); // Catch errors per-webhook
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
        console.error('An error occurred in the Monday integration flow:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal server error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}
