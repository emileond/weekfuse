import { createClient } from '@supabase/supabase-js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

export async function onRequestPost(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Parse the webhook payload
        const payload = await context.request.json();

        // Extract the webhook data
        // Note: This structure will need to be adjusted based on TickTick's actual webhook format
        const { event, data, projectId } = payload;

        if (!event || !data) {
            return Response.json(
                { success: false, error: 'Invalid webhook payload' },
                { status: 400 },
            );
        }

        // Get the task data from the webhook
        const task = data;
        if (!task || !task.id) {
            return Response.json(
                { success: false, error: 'No task data in webhook payload' },
                { status: 400 },
            );
        }

        // Get the user integration to find the workspace_id
        // We need to find the integration that has access to the project in the webhook
        const { data: integrationData, error: integrationError } = await supabase
            .from('user_integrations')
            .select('workspace_id, user_id, access_token, config')
            .eq('type', 'ticktick')
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

        // Find the integration that has access to the project in the webhook
        let validIntegration = null;

        // Try each integration until we find one that works
        for (const integration of integrationData) {
            try {
                // Check if this integration has access to the project
                const projectResponse = await fetch(
                    `https://api.ticktick.com/api/v2/project/${projectId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${integration.access_token}`,
                            'Content-Type': 'application/json',
                        },
                    },
                );

                if (projectResponse.ok) {
                    validIntegration = integration;
                    break;
                }
            } catch (error) {
                console.error(
                    `Error checking project access for integration ${integration.id}:`,
                    error,
                );
                // Continue to the next integration
            }
        }

        if (!validIntegration) {
            console.error('No integration found with access to the project:', projectId);
            return Response.json(
                { success: false, error: 'No integration found with access to the project' },
                { status: 404 },
            );
        }

        // Use the valid integration data
        const workspace_id = validIntegration.workspace_id;
        const user_id = validIntegration.user_id;
        const access_token = validIntegration.access_token;

        // Get project_id from integration config if available
        const project_id = validIntegration.config?.project_id || null;

        // Handle different event types
        if (event === 'task.created' || event === 'task.updated') {
            // Get the full task data using the task ID
            const taskResponse = await fetch(
                `https://api.ticktick.com/api/v2/task/${task.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (!taskResponse.ok) {
                console.error(`Error fetching task data: ${taskResponse.statusText}`);
                return Response.json(
                    { success: false, error: 'Failed to fetch task data' },
                    { status: 500 },
                );
            }

            const taskData = await taskResponse.json();

            // Convert content to Tiptap format if available
            const tiptapDescription = taskData.content ? markdownToTipTap(taskData.content) : null;

            // Upsert the task in the database
            const { error: upsertError } = await supabase.from('tasks').upsert(
                {
                    name: taskData.title,
                    description: tiptapDescription,
                    workspace_id,
                    integration_source: 'ticktick',
                    external_id: taskData.id,
                    external_data: taskData,
                    host: `https://ticktick.com/webapp/#p/${taskData.projectId}/tasks/${taskData.id}`,
                    assignee: user_id,
                    creator: user_id,
                    project_id: project_id,
                },
                {
                    onConflict: 'integration_source, external_id, host, workspace_id',
                },
            );

            if (upsertError) {
                console.error(`Upsert error for task ${taskData.id}:`, upsertError);
                return Response.json(
                    { success: false, error: 'Failed to update task' },
                    { status: 500 },
                );
            }

            console.log(
                `Task ${taskData.id} ${event === 'task.created' ? 'created' : 'updated'} successfully`,
            );
            return Response.json({ success: true });
        }

        // If we reach here, the event type is not supported
        return Response.json({ success: false, error: 'Unsupported event type' }, { status: 400 });
    } catch (error) {
        console.error('Error processing TickTick webhook:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}