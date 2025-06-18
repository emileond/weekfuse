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

export const ticktickSync = task({
    id: 'ticktick-sync',
    maxDuration: 3600, // 60 minutes max duration
    run: async (payload: any) => {
        logger.log('Starting TickTick sync task');

        try {
            // Update the last_sync timestamp
            await supabase
                .from('user_integrations')
                .update({
                    last_sync: toUTC(),
                })
                .eq('id', payload.id);

            const access_token = payload.access_token;

            // Check if token needs refresh
            if (payload.refresh_token && payload.expires_in) {
                // Implement token refresh logic if needed
                // This would depend on TickTick's OAuth implementation
            }

            // Get project_id from integration config if available
            const project_id = payload.config?.project_id || null;

            // Get user's projects
            const projects = await ky
                .get(
                    `https://api.ticktick.com/open/v1/project`,
                    {
                        headers: {
                            'Authorization': `Bearer ${access_token}`,
                            'Content-Type': 'application/json',
                        },
                    },
                )
                .json();

            // Get all tasks from all projects
            let allTasks = [];

            // Iterate through each project and get all tasks
            if (projects && Array.isArray(projects)) {
                const updatedProjects = [{id: 'inbox'}, ...projects];
                const taskPromises = updatedProjects.map((project) => {
                    const projectTasksUrl = `https://api.ticktick.com/open/v1/project/${project.id}/data`;
                    return ky
                        .get(projectTasksUrl, {
                            headers: {
                                'Authorization': `Bearer ${access_token}`,
                                'Content-Type': 'application/json',
                            },
                        })
                        .json();
                });

                const projectTasksResults = await Promise.all(taskPromises);

                // Combine all tasks from all projects
                allTasks = projectTasksResults.map((result) => result.tasks || []).flat();
            }

            const tasksData = allTasks;

            // Process and store tasks
            if (tasksData && Array.isArray(tasksData)) {
                const upsertPromises = tasksData.map((task) => {
                    // Convert content to Tiptap format if needed
                    const tiptapDescription = task?.content ? markdownToTipTap(task.content) : null;

                    return supabase.from('tasks').upsert(
                        {
                            name: task.title,
                            description: tiptapDescription,
                            workspace_id: payload.workspace_id,
                            integration_source: 'ticktick',
                            external_id: task.id,
                            external_data: task,
                            host: `https://ticktick.com/webapp/#p/${task.projectId}/tasks/${task.id}`,
                            assignee: payload.user_id,
                            creator: payload.user_id,
                            project_id: project_id,
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
                            `Upsert error for task ${tasksData[index].id}: ${result.error.message}`,
                        );
                        taskFailCount++;
                    } else {
                        taskSuccessCount++;
                    }
                });

                logger.log(
                    `Processed ${tasksData.length} tasks for workspace ${payload.workspace_id}: ${taskSuccessCount} succeeded, ${taskFailCount} failed`,
                );
            }

            logger.log(
                `Successfully synced TickTick integration for workspace ${payload.workspace_id}`,
            );
        } catch (error) {
            console.log(error);
            logger.error(
                `Error syncing TickTick integration for workspace ${payload.workspace_id}: ${error.message}`,
            );
        }

        return {
            success: true,
        };
    },
});
