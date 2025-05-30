import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';
import { tinymceToTiptap } from '../../../src/utils/editorUtils.js';

// Handle POST requests for initiating ClickUp OAuth flow
export async function onRequestPost(context) {
    const body = await context.request.json();
    const { code, user_id, workspace_id } = body;

    if (!code || !user_id || !workspace_id) {
        return Response.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Exchange code for access token
        const tokenData = await ky
            .post('https://api.clickup.com/api/v2/oauth/token', {
                json: {
                    client_id: context.env.CLICKUP_CLIENT_ID,
                    client_secret: context.env.CLICKUP_CLIENT_SECRET,
                    code: code,
                    redirect_uri: 'https://weekfuse.com/integrations/oauth/callback/clickup',
                    grant_type: 'authorization_code',
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .json();

        const { access_token } = await tokenData;

        if (!access_token) {
            console.error('ClickUp token exchange error:', tokenData);
            return Response.json(
                {
                    success: false,
                    error: tokenData.error || 'Failed to get access token',
                },
                { status: 400 },
            );
        }

        // Save the access token in Supabase
        const { error: updateError } = await supabase.from('user_integrations').upsert({
            type: 'clickup',
            access_token: access_token,
            user_id,
            workspace_id,
            status: 'active',
            last_sync: toUTC(),
            config: { syncStatus: 'prompt' },
        });

        if (updateError) {
            console.error('Supabase update error:', updateError);
            return Response.json(
                {
                    success: false,
                    error: 'Failed to save integration data',
                },
                { status: 500 },
            );
        }

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
                // Get all tasks assigned to the user that are not completed
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

        // Create webhooks for each team
        if (teamsData && teamsData.teams && Array.isArray(teamsData.teams)) {
            try {
                const webhookUrl = 'https://weekfuse.com/webhooks/clickup';

                // Create webhooks for each team
                const webhookPromises = teamsData.teams.map(async (team) => {
                    try {
                        // Create a webhook for this team
                        await ky.post(
                            `https://api.clickup.com/api/v2/team/${team.id}/webhook`,
                            {
                                json: {
                                    endpoint: webhookUrl,
                                    events: ['taskUpdated', 'taskDeleted'],
                                },
                                headers: {
                                    Authorization: `Bearer ${access_token}`,
                                    'Content-Type': 'application/json',
                                },
                            },
                        );
                        console.log(
                            `Webhook created successfully for team ${team.id} (${team.name})`,
                        );
                        return { success: true, teamId: team.id };
                    } catch (webhookError) {
                        console.error(
                            `Error creating webhook for team ${team.id}:`,
                            webhookError,
                        );
                        return { success: false, teamId: team.id, error: webhookError };
                    }
                });

                await Promise.all(webhookPromises);
            } catch (webhooksError) {
                console.error('Error creating webhooks:', webhooksError);
                // Continue with the flow even if webhook creation fails
            }
        }

        // Process and store tasks
        if (allTasks.length > 0) {
            const upsertPromises = allTasks.map((task) => {
                // Convert description to Tiptap format if available
                const convertedDesc = task?.description ? tinymceToTiptap(task.description) : null;

                return supabase.from('tasks').upsert(
                    {
                        name: task.name,
                        description: convertedDesc || null,
                        workspace_id,
                        integration_source: 'clickup',
                        external_id: task.id,
                        external_data: task,
                        host: task.url,
                    },
                    {
                        onConflict: ['integration_source', 'external_id', 'host'],
                    },
                );
            });

            const results = await Promise.all(upsertPromises);

            results.forEach((result, index) => {
                if (result.error) {
                    console.error(`Upsert error for task ${allTasks[index].id}:`, result.error);
                } else {
                    console.log(`Task ${allTasks[index].id} imported successfully`);
                }
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error in ClickUp auth flow:', error);
        return Response.json(
            {
                success: false,
                error: error,
            },
            { status: 500 },
        );
    }
}

// Handle DELETE requests for disconnecting ClickUp integration
export async function onRequestDelete(context) {
    try {
        const body = await context.request.json();
        const { id } = body;

        if (!id) {
            return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
        }

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Delete the token from the database
        const { error: deleteError } = await supabase
            .from('user_integrations')
            .delete()
            .eq('type', 'clickup')
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting ClickUp integration from database:', deleteError);
            return Response.json(
                { success: false, error: 'Failed to delete integration data' },
                { status: 500 },
            );
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting ClickUp integration:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
