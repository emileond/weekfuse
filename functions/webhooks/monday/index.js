import { createClient } from '@supabase/supabase-js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

export async function onRequestPost(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Parse the webhook payload
        const payload = await context.request.json();

        console.log('Received Monday.com webhook:', payload);

        // Monday.com webhook structure
        // {
        //   "event": { "type": "change_column_value", "boardId": 123, "pulseId": 456, "columnId": "status" },
        //   "challengeId": "some-challenge-id"
        // }

        // Extract the webhook data
        const event = payload.event;

        if (!event || !event.boardId || !event.pulseId) {
            return Response.json(
                { success: false, error: 'Invalid webhook payload' },
                { status: 400 },
            );
        }

        // Monday.com sends a challenge when setting up webhooks
        // We need to respond with the challenge to verify the webhook
        if (payload.challengeId) {
            return Response.json({ challengeId: payload.challengeId });
        }

        const boardId = event.boardId;
        const itemId = event.pulseId;

        // Get the user integration to find the workspace_id and access token
        const { data: integrationData, error: integrationError } = await supabase
            .from('user_integrations')
            .select('workspace_id, user_id, access_token, config')
            .eq('type', 'monday')
            .eq('status', 'active');

        if (integrationError || !integrationData || integrationData.length === 0) {
            console.error(
                'Error fetching integration data:',
                integrationError || 'No matching integration found',
            );
            return Response.json(
                { success: false, error: 'Integration not found' },
                { status: 404 },
            );
        }

        // Find the integration that has access to the board in the webhook
        let validIntegration = null;

        // Try each integration until we find one that works
        for (const integration of integrationData) {
            try {
                // Check if this integration has access to the board
                const boardQuery = `
                    query {
                        boards(ids: ${boardId}) {
                            id
                            name
                        }
                    }
                `;

                const boardResponse = await fetch('https://api.monday.com/v2', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${integration.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: boardQuery }),
                });

                if (boardResponse.ok) {
                    const boardData = await boardResponse.json();
                    if (boardData.data?.boards?.length > 0) {
                        validIntegration = integration;
                        break;
                    }
                }
            } catch (error) {
                console.error(
                    `Error checking board access for integration ${integration.id}:`,
                    error,
                );
                // Continue to the next integration
            }
        }

        if (!validIntegration) {
            console.error('No integration found with access to the board:', boardId);
            return Response.json(
                { success: false, error: 'No integration found with access to the board' },
                { status: 404 },
            );
        }

        // Use the valid integration data
        const workspace_id = validIntegration.workspace_id;
        const user_id = validIntegration.user_id;
        const access_token = validIntegration.access_token;

        // Get project_id from integration config if available
        const project_id = validIntegration.config?.project_id || null;

        // Get the full item data using the item ID
        const itemQuery = `
            query {
                items(ids: [${itemId}]) {
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
        `;

        const itemResponse = await fetch('https://api.monday.com/v2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: itemQuery }),
        });

        if (!itemResponse.ok) {
            console.error(`Error fetching item data: ${itemResponse.statusText}`);
            return Response.json(
                { success: false, error: 'Failed to fetch item data' },
                { status: 500 },
            );
        }

        const itemData = await itemResponse.json();
        const item = itemData.data?.items?.[0];

        if (!item) {
            console.error('Item not found in Monday.com response');
            return Response.json(
                { success: false, error: 'Item not found' },
                { status: 404 },
            );
        }

        // Convert description to Tiptap format if available
        const descriptionColumn = item.column_values.find(
            col => col.title.toLowerCase() === 'description' || col.id === 'description'
        );
        const tiptapDescription = descriptionColumn?.text ? markdownToTipTap(descriptionColumn.text) : null;

        // Upsert the task in the database
        const { error: upsertError } = await supabase.from('tasks').upsert(
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
                project_id: project_id,
            },
            {
                onConflict: 'integration_source, external_id, host, workspace_id',
            },
        );

        if (upsertError) {
            console.error(`Upsert error for item ${item.id}:`, upsertError);
            return Response.json(
                { success: false, error: 'Failed to update task' },
                { status: 500 },
            );
        }

        console.log(`Item ${item.id} updated successfully`);
        return Response.json({ success: true });
    } catch (error) {
        console.error('Error processing Monday.com webhook:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}