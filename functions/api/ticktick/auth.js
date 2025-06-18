import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

// Handle DELETE requests for disconnecting TickTick integration
export async function onRequestDelete(context) {
    try {
        const body = await context.request.json();
        const { id } = body;

        if (!id) {
            return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
        }

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        const { data, error } = await supabase
            .from('user_integrations')
            .select('access_token, refresh_token, user_id, workspace_id')
            .eq('type', 'ticktick')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching TickTick integration from database:', error);
            return Response.json(
                { success: false, error: 'Failed to delete integration data' },
                { status: 500 },
            );
        }

        const { access_token, user_id, workspace_id } = data;

        try {
            // Revoke the token with TickTick's API if they provide such an endpoint
            // This is optional and depends on TickTick's API capabilities
            await ky.post(`https://api.ticktick.com/oauth/revoke`, {
                json: {
                    client_id: context.env.TICKTICK_CLIENT_ID,
                    client_secret: context.env.TICKTICK_CLIENT_SECRET,
                    token: access_token,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log(`Successfully revoked TickTick token: ${access_token}`);
        } catch (revokeError) {
            console.error('Error revoking TickTick token:', revokeError);
            // Continue with deletion from database even if API revocation fails
        }

        // Delete the token from the database
        const { error: deleteError } = await supabase
            .from('user_integrations')
            .delete()
            .eq('type', 'ticktick')
            .eq('access_token', access_token);

        if (deleteError) {
            console.error('Error deleting TickTick integration from database:', deleteError);
            return Response.json(
                { success: false, error: 'Failed to delete integration data' },
                { status: 500 },
            );
        }

        // Delete the backlog tasks from the database
        await supabase
            .from('tasks')
            .delete()
            .eq('integration_source', 'ticktick')
            .eq('status', 'pending')
            .eq('creator', user_id)
            .eq('workspace_id', workspace_id)
            .is('date', null);

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting TickTick integration:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}

// Handle POST requests for initiating TickTick OAuth flow
export async function onRequestPost(context) {
    const body = await context.request.json();
    const { code, user_id, workspace_id } = body;

    if (!code || !user_id || !workspace_id) {
        return Response.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        const { TICKTICK_CLIENT_ID, TICKTICK_CLIENT_SECRET } = context.env;

        // --- Step 1: Create the Basic Auth header ---
        const basicAuthHeader = `Basic ${btoa(`${TICKTICK_CLIENT_ID}:${TICKTICK_CLIENT_SECRET}`)}`;

        // --- Step 2: Create the URL-encoded body ---
        const requestBody = new URLSearchParams({
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: 'https://weekfuse.com/integrations/oauth/callback/ticktick',
            scope: 'tasks:read tasks:write', // It's good practice to include the scope
        });

        // --- Step 3: Make the corrected API call ---
        const tokenResponse = await ky
            .post('https://ticktick.com/oauth/token', {
                // Using the endpoint from the docs
                headers: {
                    Authorization: basicAuthHeader,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: requestBody, // Use the 'body' option with the URLSearchParams object
            })
            .json();

        const access_token = tokenResponse.access_token;
        const refresh_token = tokenResponse.refresh_token;
        const expires_in = tokenResponse.expires_in;

        if (!access_token) {
            throw new Error('Failed to obtain access token');
        }

        // Save the access token in Supabase
        const { data: upsertData, error: updateError } = await supabase
            .from('user_integrations')
            .upsert({
                type: 'ticktick',
                access_token: access_token,
                refresh_token: refresh_token,
                expires_in: expires_in,
                user_id,
                workspace_id,
                status: 'active',
                last_sync: toUTC(),
                config: { syncStatus: 'prompt' },
            })
            .select('id')
            .single();

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

        const integration_id = upsertData.id;

        // Get user's projects
        const projects = await ky
            .get(`https://api.ticktick.com/api/v2/projects`, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            })
            .json();

        // Get all tasks from all projects
        let allTasks = [];

        // Iterate through each project and get all tasks
        if (projects && Array.isArray(projects)) {
            const taskPromises = projects.map((project) => {
                const projectTasksUrl = `https://api.ticktick.com/api/v2/project/${project.id}/tasks`;
                return ky
                    .get(projectTasksUrl, {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            'Content-Type': 'application/json',
                        },
                    })
                    .json();
            });

            const projectTasksResults = await Promise.all(taskPromises);

            // Combine all tasks from all projects
            allTasks = projectTasksResults.flat();
        }

        // Process and store tasks
        if (allTasks && Array.isArray(allTasks)) {
            const upsertPromises = allTasks.map((task) => {
                // Convert content to Tiptap format if needed
                const tiptapDescription = task?.content ? markdownToTipTap(task.content) : null;

                return supabase.from('tasks').upsert(
                    {
                        name: task.title,
                        description: tiptapDescription,
                        workspace_id,
                        integration_source: 'ticktick',
                        external_id: task.id,
                        external_data: task,
                        host: `https://ticktick.com/webapp/#p/${task.projectId}/tasks/${task.id}`,
                        assignee: user_id,
                        creator: user_id,
                    },
                    {
                        onConflict: 'integration_source, external_id, host, workspace_id',
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
        console.error('Error in TickTick auth flow:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
