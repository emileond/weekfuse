import { createClient } from '@supabase/supabase-js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';
import ky from 'ky';

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

        // Handle different event types
        if (event === 'taskUpdated') {
            // Get the current external_data for the task
            const { data: task, error: selectError } = await supabase
                .from('tasks')
                .select('user_id')
                .eq('external_id', task_id)
                .eq('integration_source', 'clickup')
                .single();

            if (selectError) {
                console.error(`Error fetching task ${task_id}:`, selectError);
                return Response.json(
                    { success: false, error: 'Failed to fetch task data' },
                    { status: 500 },
                );
            }

            const { data: integration, error: integrationError } = await supabase
                .from('user_integrations')
                .select('workspace_id, user_id, access_token')
                .eq('type', 'clickup')
                .eq('user_id', task.user_id)
                .single();

            // Check if we have integration data
            if (integrationError || !integration) {
                console.error(`Error fetching integration for task ${task_id}:`, integrationError);
                return Response.json(
                    { success: false, error: 'Failed to fetch integration data' },
                    { status: 500 },
                );
            }

            // Get task from clickup api
            try {
                const taskData = await ky
                    .get(
                        `https://api.clickup.com/api/v2/task/${task_id}?include_markdown_description=true`,
                        {
                            headers: {
                                Authorization: `Bearer ${integration.access_token}`,
                                'Content-Type': 'application/json',
                            },
                        },
                    )
                    .json();

                // Convert description to Tiptap format if available
                const convertedDesc = taskData?.markdown_description
                    ? markdownToTipTap(taskData.description)
                    : null;

                // Update the task in supabase
                const { error: updateError } = await supabase.from('tasks').upsert(
                    {
                        name: taskData.name,
                        description: JSON.stringify(convertedDesc) || null,
                        external_id: taskData.id,
                        external_data: taskData,
                        host: taskData.url,
                    },
                    {
                        onConflict: ['integration_source', 'external_id', 'host'],
                    },
                );

                if (updateError) {
                    console.error(`Update error for task ${task_id}:`, updateError);
                    return Response.json(
                        { success: false, error: 'Failed to update task' },
                        { status: 500 },
                    );
                }
            } catch (apiError) {
                console.error(`Error fetching task ${task_id} from ClickUp API:`, apiError);
                return Response.json(
                    { success: false, error: 'Failed to fetch task from ClickUp API' },
                    { status: 500 },
                );
            }

            console.log(`Task ${task_id} updated successfully`);
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
