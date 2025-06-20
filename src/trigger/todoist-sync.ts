import { logger, task } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../utils/dateUtils';
import ky from 'ky';
import { markdownToTipTap } from '../utils/editorUtils';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const todoistSync = task({
    id: 'todoist-sync',
    maxDuration: 3600, // 60 minutes max duration
    run: async (payload: any) => {
        logger.log('Starting Todoist sync task');

        try {
            // Update the last_sync timestamp
            await supabase
                .from('user_integrations')
                .update({
                    last_sync: toUTC(),
                })
                .eq('id', payload.id);

            const access_token = payload.access_token;

            // Get project_id from integration config if available
            const project_id = payload.config?.project_id || null;

            // Get all active tasks from Todoist with pagination
            let allTasks = [];
            let nextCursor = null;

            do {
                // Build query parameters for pagination
                const queryParams = nextCursor ? `?cursor=${nextCursor}` : '';

                // Make API request
                const response = await ky
                    .get(`https://api.todoist.com/api/v1/tasks${queryParams}`, {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            'Content-Type': 'application/json',
                        },
                    })
                    .json();

                // Add results to our collection
                if (response.results && Array.isArray(response.results)) {
                    allTasks = [...allTasks, ...response.results];
                }

                // Update cursor for next page
                nextCursor = response.next_cursor;

                // Log pagination progress
                if (nextCursor) {
                    logger.log(
                        `Fetched ${response.results.length} tasks, continuing with next page...`,
                    );
                }
            } while (nextCursor);

            logger.log(`Fetched a total of ${allTasks.length} tasks from Todoist`);

            // Process and store tasks
            if (allTasks.length > 0) {
                const upsertPromises = allTasks.map((task) => {
                    // Convert markdown description to Tiptap format if available
                    const tiptapDescription = task?.description
                        ? markdownToTipTap(task.description)
                        : null;

                    return supabase.from('tasks').upsert(
                        {
                            name: task.content,
                            description: tiptapDescription,
                            workspace_id: payload.workspace_id,
                            integration_source: 'todoist',
                            external_id: task.id,
                            external_data: task,
                            host: `https://todoist.com/app/task/${task.id}`,
                            assignee: payload.user_id,
                            creator: payload.user_id,
                            project_id: project_id,
                            // Set due date if available
                            due_date: task.due ? new Date(task.due.date).toISOString() : null,
                        },
                        {
                            onConflict: 'integration_source, external_id, host, workspace_id',
                        },
                    );
                });

                const results = await Promise.all(upsertPromises);

                let taskSuccessCount = 0;
                let taskFailCount = 0;

                results.forEach((result, index) => {
                    if (result.error) {
                        logger.error(
                            `Upsert error for task ${tasks[index].id}: ${result.error.message}`,
                        );
                        taskFailCount++;
                    } else {
                        taskSuccessCount++;
                    }
                });

                logger.log(
                    `Processed ${tasks.length} tasks for workspace ${payload.workspace_id}: ${taskSuccessCount} succeeded, ${taskFailCount} failed`,
                );
            }

            logger.log(
                `Successfully synced Todoist integration for workspace ${payload.workspace_id}`,
            );
        } catch (error) {
            console.log(error);
            logger.error(
                `Error syncing Todoist integration for workspace ${payload.workspace_id}: ${error.message}`,
            );
        }

        return {
            success: true,
        };
    },
});
