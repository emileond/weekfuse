import { createClient } from '@supabase/supabase-js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

export async function onRequestPost(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Parse the webhook payload
        const payload = await context.request.json();

        // Extract the webhook data
        const event = payload.event;
        const webhook_id = payload.webhook_id;

        if (!event || !webhook_id) {
            return Response.json(
                { success: false, error: 'Invalid webhook payload' },
                { status: 400 },
            );
        }

        // Only process taskUpdated and taskDeleted events
        if (event !== 'taskUpdated' && event !== 'taskDeleted') {
            // Ignore other events (including taskCreated)
            return Response.json({ success: true, message: 'Event ignored' });
        }

        // Get the history items from the payload
        const history_items = payload.history_items;
        if (!history_items || !Array.isArray(history_items) || history_items.length === 0) {
            return Response.json(
                { success: false, error: 'No history items in webhook payload' },
                { status: 400 },
            );
        }

        // Get the task ID from the payload
        const task_id = payload.task_id;
        if (!task_id) {
            return Response.json(
                { success: false, error: 'No task ID in webhook payload' },
                { status: 400 },
            );
        }

        // Get the user integration to find the workspace_id
        const { data: integrationData, error: integrationError } = await supabase
            .from('user_integrations')
            .select('workspace_id, user_id, access_token')
            .eq('type', 'clickup')
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

        // Find the integration that has access to the task
        let validIntegration = null;

        // Try each integration until we find one that works
        for (const integration of integrationData) {
            try {
                // Check if this integration has access to the task
                const taskResponse = await fetch(`https://api.clickup.com/api/v2/task/${task_id}`, {
                    headers: {
                        Authorization: `Bearer ${integration.access_token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (taskResponse.ok) {
                    validIntegration = integration;
                    break;
                }
            } catch (error) {
                console.error(
                    `Error checking task access for integration ${integration.id}:`,
                    error,
                );
                // Continue to the next integration
            }
        }

        if (!validIntegration) {
            console.error('No integration found with access to the task:', task_id);
            return Response.json(
                { success: false, error: 'No integration found with access to the task' },
                { status: 404 },
            );
        }

        // Use the valid integration data
        const workspace_id = validIntegration.workspace_id;
        const access_token = validIntegration.access_token;

        // Handle different event types
        if (event === 'taskUpdated') {
            // Get the full task data using the task ID
            const taskResponse = await fetch(`https://api.clickup.com/api/v2/task/${task_id}`, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!taskResponse.ok) {
                console.error(`Error fetching task data: ${taskResponse.statusText}`);
                return Response.json(
                    { success: false, error: 'Failed to fetch task data' },
                    { status: 500 },
                );
            }

            const taskData = await taskResponse.json();

            // Convert description to Tiptap format if available
            const convertedDesc = taskData.description
                ? markdownToTipTap(taskData.description)
                : null;

            // Upsert the task in the database
            const { error: upsertError } = await supabase.from('tasks').upsert(
                {
                    name: taskData.name,
                    description: convertedDesc || null,
                    workspace_id,
                    integration_source: 'clickup',
                    external_id: taskData.id,
                    external_data: taskData,
                    host: taskData.url,
                },
                {
                    onConflict: ['integration_source', 'external_id', 'host'],
                },
            );

            if (upsertError) {
                console.error(`Upsert error for task ${taskData.id}:`, upsertError);
                return Response.json(
                    { success: false, error: 'Failed to update task' },
                    { status: 500 },
                );
            }

            console.log(`Task ${taskData.id} updated successfully`);
            return Response.json({ success: true });
        } else if (event === 'taskDeleted') {
            // Delete the task from the database
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .eq('integration_source', 'clickup')
                .eq('external_id', task_id);

            if (deleteError) {
                console.error(`Delete error for task ${task_id}:`, deleteError);
                return Response.json(
                    { success: false, error: 'Failed to delete task' },
                    { status: 500 },
                );
            }

            console.log(`Task ${task_id} deleted successfully`);
            return Response.json({ success: true });
        }

        // If we reach here, the event type is not supported
        return Response.json({ success: false, error: 'Unsupported event type' }, { status: 400 });
    } catch (error) {
        console.error('Error processing ClickUp webhook:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
