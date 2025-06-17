import { createClient } from '@supabase/supabase-js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

export async function onRequestPost(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Parse the webhook payload
        const payload = await context.request.json();

        // Extract the webhook data
        const action = payload.action;
        const model = payload.model;
        const webhook = payload.webhook;

        if (!action || !model || !webhook) {
            return Response.json(
                { success: false, error: 'Invalid webhook payload' },
                { status: 400 },
            );
        }

        // Get the card data from the action
        const card = action.data.card;
        if (!card) {
            return Response.json(
                { success: false, error: 'No card data in webhook payload' },
                { status: 400 },
            );
        }

        // Get the user integration to find the workspace_id
        // We need to find the integration that has access to the board in the webhook
        const { data: integrationData, error: integrationError } = await supabase
            .from('user_integrations')
            .select('workspace_id, user_id, access_token, config')
            .eq('type', 'trello')
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
        const boardId = model.id; // The model ID is the board ID
        let validIntegration = null;

        // Try each integration until we find one that works
        for (const integration of integrationData) {
            try {
                // Check if this integration has access to the board
                const boardResponse = await fetch(
                    `https://api.trello.com/1/boards/${boardId}?key=${context.env.TRELLO_API_KEY}&token=${integration.access_token}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (boardResponse.ok) {
                    validIntegration = integration;
                    break;
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

        // Handle different action types
        if (action.type === 'createCard' || action.type === 'updateCard') {
            // Get the full card data using the card ID
            const cardResponse = await fetch(
                `https://api.trello.com/1/cards/${card.id}?key=${context.env.TRELLO_API_KEY}&token=${access_token}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (!cardResponse.ok) {
                console.error(`Error fetching card data: ${cardResponse.statusText}`);
                return Response.json(
                    { success: false, error: 'Failed to fetch card data' },
                    { status: 500 },
                );
            }

            const cardData = await cardResponse.json();

            // Convert markdown description to Tiptap format if available
            const tiptapDescription = cardData.desc ? markdownToTipTap(cardData.desc) : null;

            // Upsert the task in the database
            const { error: upsertError } = await supabase.from('tasks').upsert(
                {
                    name: cardData.name,
                    description: tiptapDescription,
                    workspace_id,
                    integration_source: 'trello',
                    external_id: cardData.id,
                    external_data: cardData,
                    host: cardData.url,
                    assignee: user_id,
                    creator: user_id,
                    project_id: project_id,
                },
                {
                    onConflict: 'integration_source, external_id, host, workspace_id',
                },
            );

            if (upsertError) {
                console.error(`Upsert error for card ${cardData.id}:`, upsertError);
                return Response.json(
                    { success: false, error: 'Failed to update task' },
                    { status: 500 },
                );
            }

            console.log(
                `Card ${cardData.id} ${action.type === 'createCard' ? 'created' : 'updated'} successfully`,
            );
            return Response.json({ success: true });
        }

        // If we reach here, the action type is not supported
        return Response.json({ success: false, error: 'Unsupported action type' }, { status: 400 });
    } catch (error) {
        console.error('Error processing Trello webhook:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
