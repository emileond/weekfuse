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

        // Handle different event types
        if (event === 'taskUpdated') {
            const updatedField = history_items[0].field;
            const updatedValue = history_items[0].after;

            let updatedTask = {};

            switch (updatedField) {
                case 'name':
                    updatedTask.name = updatedValue;
                    break;
                case 'description': {
                    const convertedDescription = markdownToTipTap(updatedValue);
                    updatedTask.description = convertedDescription
                        ? JSON.stringify(convertedDescription)
                        : null;
                    break;
                }

                // if it's anything else, update it in the external_data column
                default: {
                    // Get the current external_data for the task
                    const { data: task, error: selectError } = await supabase
                        .from('tasks')
                        .select('external_data')
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

                    // Create updated external_data with the new field value
                    const updatedExternalData = {
                        ...task.external_data,
                        [updatedField]: updatedValue,
                    };

                    // Update only the external_data column
                    const { error: updateError } = await supabase
                        .from('tasks')
                        .update({ external_data: updatedExternalData })
                        .eq('integration_source', 'clickup')
                        .eq('external_id', task_id);

                    if (updateError) {
                        console.error(`Update error for task ${task_id}:`, updateError);
                        return Response.json(
                            { success: false, error: 'Failed to update task external data' },
                            { status: 500 },
                        );
                    }

                    console.log(
                        `Task ${task_id} external_data.${updatedField} updated successfully`,
                    );
                    return Response.json({ success: true });
                }
            }

            console.log(updatedTask);

            // Only proceed with this update if we're updating name or description
            // For other fields, we've already handled the update in the default case
            const { error: updateError } = await supabase
                .from('tasks')
                .update(updatedTask)
                .eq('integration_source', 'clickup')
                .eq('external_id', task_id);

            if (updateError) {
                console.error(`Update error for task ${task_id}:`, updateError);
                return Response.json(
                    { success: false, error: 'Failed to update task' },
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
