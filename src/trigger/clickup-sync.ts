import { logger, task } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../utils/dateUtils';
import ky from 'ky';
import { plainTextToTiptap } from '../utils/editorUtils';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const clickupSync = task({
    // Fetch active workspace integrations that need syncing
    id: 'clickup-sync',
    maxDuration: 3000, // 50 minutes max duration
    run: async (payload: any) => {
        logger.log('Starting Clickup sync task');

        try {
            // Update the last_sync timestamp
            await supabase
                .from('user_integrations')
                .update({
                    last_sync: toUTC(),
                })
                .eq('id', payload.id);

            const access_token = payload.access_token;

            // Get user profile
            const userData = await ky
                .get('https://api.clickup.com/api/v2/user', {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        accept: 'application/json',
                    },
                })
                .json();

            // Get user's authorized teams
            const teamsData = await ky
                .get('https://api.clickup.com/api/v2/team', {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        'Content-Type': 'application/json',
                    },
                })
                .json();

            const userID = userData.user.id;

            let allTasks = [];

            // For each team, get the user's tasks
            if (teamsData && teamsData.teams && Array.isArray(teamsData.teams)) {
                for (const team of teamsData.teams) {
                    // Get all tasks assigned to the user
                    const tasksData = await ky
                        .get(
                            `https://api.clickup.com/api/v2/team/${team.id}/task?assignees[]=${userID}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${access_token}`,
                                    'Content-Type': 'application/json',
                                },
                            },
                        )
                        .json();

                    if (tasksData && tasksData.tasks && Array.isArray(tasksData.tasks)) {
                        allTasks = [...allTasks, ...tasksData.tasks];
                    }
                }
            }

            // Process and store tasks
            if (allTasks.length > 0) {
                const upsertPromises = allTasks.map((task) => {
                    // Convert description to Tiptap format if available
                    const convertedDesc = task?.description
                        ? plainTextToTiptap(task.description)
                        : null;

                    return supabase.from('tasks').upsert(
                        {
                            name: task.name,
                            description: convertedDesc,
                            workspace_id: payload.workspace_id,
                            integration_source: 'clickup',
                            external_id: task.id,
                            external_data: task,
                            host: task.url,
                            assignee: payload.user_id,
                        },
                        {
                            onConflict: ['integration_source', 'external_id, host'],
                        },
                    );
                });

                const results = await Promise.all(upsertPromises);

                let taskSuccessCount = 0;
                let taskFailCount = 0;

                results.forEach((result, index) => {
                    if (result.error) {
                        logger.error(
                            `Upsert error for task ${allTasks[index].id}: ${result.error.message}`,
                        );
                        taskFailCount++;
                    } else {
                        taskSuccessCount++;
                    }
                });

                logger.log(
                    `Processed ${allTasks.length} tasks for workspace ${payload.workspace_id}: ${taskSuccessCount} succeeded, ${taskFailCount} failed`,
                );
            }

            logger.log(
                `Successfully synced ClickUp integration for workspace ${payload.workspace_id}`,
            );
        } catch (error) {
            console.log(error);
            logger.error(
                `Error syncing ClickUp integration for workspace ${payload.workspace_id}: ${error.message}`,
            );
        }

        return {
            success: true,
        };
    },
});
