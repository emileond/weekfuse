import { createClient } from '@supabase/supabase-js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

export async function onRequestPost(context) {
    // Verify the request is from Todoist
    // Todoist sends a X-Todoist-Hmac-SHA256 header with a signature
    const signature = context.request.headers.get('X-Todoist-Hmac-SHA256');

    // In a production environment, you should verify this signature
    // using the client secret and the request body
    // For now, we'll just log it
    console.log('Todoist webhook signature:', signature);

    try {
        // Parse the webhook payload
        const payload = await context.request.json();
        console.log('Todoist webhook payload:', JSON.stringify(payload));

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Handle different event types
        const eventType = payload.event_name;
        const eventData = payload.event_data;

        if (!eventType || !eventData) {
            return Response.json(
                { success: false, error: 'Invalid webhook payload' },
                { status: 400 },
            );
        }

        switch (eventType) {
            case 'item:added':
                await handleTaskAdded(supabase, eventData);
                break;
            case 'item:updated':
                await handleTaskUpdated(supabase, eventData);
                break;
            case 'item:deleted':
                await handleTaskDeleted(supabase, eventData);
                break;
            case 'item:completed':
                await handleTaskCompleted(supabase, eventData, true);
                break;
            case 'item:uncompleted':
                await handleTaskCompleted(supabase, eventData, false);
                break;
            default:
                console.log(`Unhandled Todoist event type: ${eventType}`);
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error processing Todoist webhook:', error);
        return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

async function handleTaskAdded(supabase, taskData) {
    try {
        // Find all integrations for this task's project
        const { data: integrationData, error: integrationError } = await supabase
            .from('user_integrations')
            .select('workspace_id, user_id, config')
            .eq('type', 'todoist')
            .eq('status', 'active')
            .eq('external_data->>id', taskData.user_id)
            .single();

        if (integrationError || !integrationData || integrationData.length === 0) {
            console.log('No active Todoist integrations found');
            return;
        }

        const project_id = integrationData.config?.project_id || null;

        const tiptapDescription = taskData.description
            ? markdownToTipTap(taskData.description)
            : null;

        await supabase.from('tasks').insert({
            name: taskData.content,
            description: tiptapDescription,
            workspace_id: integrationData.workspace_id,
            integration_source: 'todoist',
            external_id: taskData.id,
            external_data: taskData,
            host: `https://todoist.com/app/task/${taskData.id}`,
            assignee: integrationData.user_id,
            creator: integrationData.user_id,
            due_date: taskData.due ? new Date(taskData.due.date).toISOString() : null,
            project_id: project_id,
        });

        console.log(`Task ${taskData.id} added for user ${integrationData.user_id}`);
    } catch (error) {
        console.error('Error handling task added webhook:', error);
    }
}

async function handleTaskUpdated(supabase, taskData) {
    try {
        // Find the task in our database
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, workspace_id, creator')
            .eq('integration_source', 'todoist')
            .eq('external_id', taskData.id);

        if (!tasks || tasks.length === 0) {
            console.log(`No matching tasks found for Todoist task ${taskData.id}`);
            return;
        }

        // Update each instance of the task
        for (const task of tasks) {
            const tiptapDescription = taskData.description
                ? markdownToTipTap(taskData.description)
                : null;

            await supabase
                .from('tasks')
                .update({
                    name: taskData.content,
                    description: tiptapDescription,
                    external_data: taskData,
                    due_date: taskData.due ? new Date(taskData.due.date).toISOString() : null,
                })
                .eq('id', task.id);

            console.log(`Task ${task.id} updated for workspace ${task.workspace_id}`);
        }
    } catch (error) {
        console.error('Error handling task updated webhook:', error);
    }
}

async function handleTaskDeleted(supabase, taskData) {
    try {
        // Delete the task from our database
        const { data, error } = await supabase
            .from('tasks')
            .delete()
            .eq('integration_source', 'todoist')
            .eq('external_id', taskData.id);

        if (error) {
            console.error(`Error deleting task ${taskData.id}:`, error);
        } else {
            console.log(`Task ${taskData.id} deleted`);
        }
    } catch (error) {
        console.error('Error handling task deleted webhook:', error);
    }
}

async function handleTaskCompleted(supabase, taskData, isCompleted) {
    try {
        // Update the task status in our database
        const { data, error } = await supabase
            .from('tasks')
            .update({
                status: isCompleted ? 'completed' : 'pending',
                external_data: taskData,
            })
            .eq('integration_source', 'todoist')
            .eq('external_id', taskData.id);

        if (error) {
            console.error(`Error updating task ${taskData.id} completion status:`, error);
        } else {
            console.log(`Task ${taskData.id} ${isCompleted ? 'completed' : 'reopened'}`);
        }
    } catch (error) {
        console.error('Error handling task completion webhook:', error);
    }
}
