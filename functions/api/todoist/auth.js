import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

// Handle DELETE requests for disconnecting Todoist integration
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
            .select('access_token, user_id, workspace_id')
            .eq('type', 'todoist')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching Todoist integration from database:', error);
            return Response.json(
                { success: false, error: 'Failed to delete integration data' },
                { status: 500 },
            );
        }

        const { access_token, user_id, workspace_id } = data;

        await ky.delete(
            `https://api.todoist.com/api/v1/access_tokens?client_id=${context.env.TODOIST_CLIENT_ID}&client_secret=${context.env.TODOIST_CLIENT_SECRET}&access_token=${access_token}`,
        );

        // Delete the token from the database
        const { error: deleteError } = await supabase
            .from('user_integrations')
            .delete()
            .eq('type', 'todoist')
            .eq('access_token', access_token);

        if (deleteError) {
            console.error('Error deleting Todoist integration from database:', deleteError);
            return Response.json(
                { success: false, error: 'Failed to delete integration data' },
                { status: 500 },
            );
        }

        // Delete the backlog tasks from the database
        await supabase
            .from('tasks')
            .delete()
            .eq('integration_source', 'todoist')
            .eq('status', 'pending')
            .eq('creator', user_id)
            .eq('workspace_id', workspace_id)
            .is('date', null);

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting Todoist integration:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}

// Handle POST requests for initiating Todoist OAuth flow
export async function onRequestPost(context) {
    const body = await context.request.json();
    const { code, user_id, workspace_id } = body;

    if (!code || !user_id || !workspace_id) {
        return Response.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Exchange the authorization code for an access token
        const tokenResponse = await ky
            .post('https://todoist.com/oauth/access_token', {
                json: {
                    client_id: context.env.TODOIST_CLIENT_ID,
                    client_secret: context.env.TODOIST_CLIENT_SECRET,
                    code: code,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .json();

        const access_token = tokenResponse.access_token;

        if (!access_token) {
            return Response.json(
                { success: false, error: 'Failed to get access token' },
                { status: 500 },
            );
        }

        // Get user info from Todoist API
        const userInfo = await ky
            .get('https://api.todoist.com/api/v1/user', {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            })
            .json();

        console.log('Todoist user info:', userInfo);

        // Save the access token in Supabase
        const { data: upsertData, error: updateError } = await supabase
            .from('user_integrations')
            .upsert({
                type: 'todoist',
                access_token: access_token,
                user_id,
                workspace_id,
                status: 'active',
                last_sync: toUTC(),
                external_data: userInfo, // Save user info in external_data
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
                console.log(
                    `Fetched ${response.results.length} tasks, continuing with next page...`,
                );
            }
        } while (nextCursor);

        console.log(`Fetched a total of ${allTasks.length} tasks from Todoist`);

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
                        workspace_id,
                        integration_source: 'todoist',
                        external_id: task.id,
                        external_data: task,
                        host: `https://todoist.com/app/task/${task.id}`,
                        assignee: user_id,
                        creator: user_id,
                        // Set due date if available
                        due_date: task.due ? new Date(task.due.date).toISOString() : null,
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

        // Schedule a sync job to keep tasks updated
        try {
            await ky.post('https://api.trigger.dev/api/v1/runs', {
                json: {
                    id: 'todoist-sync',
                    payload: {
                        id: integration_id,
                        access_token,
                        user_id,
                        workspace_id,
                    },
                },
                headers: {
                    Authorization: `Bearer ${context.env.TRIGGER_API_KEY}`,
                },
            });
        } catch (triggerError) {
            console.error('Error scheduling Todoist sync job:', triggerError);
            // Continue even if job scheduling fails
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error in Todoist auth flow:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
