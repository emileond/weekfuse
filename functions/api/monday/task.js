import ky from 'ky';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../../../src/utils/dateUtils.js';

export async function onRequestPatch(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the request body
        const { external_id, state, user_id } = await context.request.json();

        console.log('Updating Monday task:', { external_id, state, user_id });

        if (!external_id || !state || !user_id) {
            return Response.json(
                {
                    success: false,
                    error: 'Missing required parameters',
                },
                { status: 400 },
            );
        }

        // Validate state value
        if (state !== 'completed' && state !== 'pending') {
            return Response.json(
                {
                    success: false,
                    error: 'Invalid state value. Must be "completed" or "pending".',
                },
                { status: 400 },
            );
        }

        // Get the user integration to get the access_token
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('id, access_token')
            .eq('type', 'monday')
            .eq('user_id', user_id)
            .single();

        if (integrationError || !integration) {
            console.log(integrationError);
            return Response.json(
                {
                    success: false,
                    error: 'Monday integration not found',
                    details: integrationError,
                },
                { status: 404 },
            );
        }

        const accessToken = integration.access_token;

        // Get the task to find the board_id and status column id
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('external_data')
            .eq('integration_source', 'monday')
            .eq('external_id', external_id)
            .single();

        if (taskError || !task) {
            console.log(taskError);
            return Response.json(
                {
                    success: false,
                    error: 'Task not found',
                    details: taskError,
                },
                { status: 404 },
            );
        }

        const boardId = task.external_data.board_id;
        
        // Find the status column
        // Monday.com typically has a status column, but the ID might vary
        // First, get the board's columns to find the status column
        const columnsQuery = `
            query {
                boards(ids: ${boardId}) {
                    columns {
                        id
                        title
                        type
                    }
                }
            }
        `;

        const columnsResponse = await ky.post('https://api.monday.com/v2', {
            json: {
                query: columnsQuery,
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }).json();

        const columns = columnsResponse.data?.boards[0]?.columns || [];
        
        // Find the status column (usually of type "status")
        const statusColumn = columns.find(col => col.type === 'status' || col.title.toLowerCase().includes('status'));
        
        if (!statusColumn) {
            return Response.json(
                {
                    success: false,
                    error: 'Status column not found on the board',
                },
                { status: 400 },
            );
        }

        // Get the status column values to find the appropriate status for "completed" or "pending"
        const statusValuesQuery = `
            query {
                boards(ids: ${boardId}) {
                    columns(ids: "${statusColumn.id}") {
                        settings_str
                    }
                }
            }
        `;

        const statusValuesResponse = await ky.post('https://api.monday.com/v2', {
            json: {
                query: statusValuesQuery,
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }).json();

        const settingsStr = statusValuesResponse.data?.boards[0]?.columns[0]?.settings_str;
        let statusSettings;
        
        try {
            statusSettings = JSON.parse(settingsStr);
        } catch (e) {
            console.error('Error parsing status settings:', e);
            return Response.json(
                {
                    success: false,
                    error: 'Could not parse status column settings',
                },
                { status: 500 },
            );
        }

        // Find appropriate status label based on state
        // This is a simplification - in a real implementation, you might want to map
        // to specific status values based on the board's configuration
        const statusOptions = statusSettings.labels || [];
        let targetStatus;
        
        if (state === 'completed') {
            // Look for "Done", "Complete", "Completed", etc.
            targetStatus = statusOptions.find(
                status => ['done', 'complete', 'completed', 'finished'].includes(status.toLowerCase())
            );
        } else {
            // Look for "To Do", "Pending", "In Progress", etc.
            targetStatus = statusOptions.find(
                status => ['to do', 'todo', 'pending', 'in progress', 'not started'].includes(status.toLowerCase())
            );
        }

        if (!targetStatus) {
            // If we can't find a matching status, use the first or last status as a fallback
            targetStatus = state === 'completed' ? statusOptions[statusOptions.length - 1] : statusOptions[0];
        }

        // Update the item's status in Monday.com
        const updateMutation = `
            mutation {
                change_column_value(
                    board_id: ${boardId},
                    item_id: ${external_id},
                    column_id: "${statusColumn.id}",
                    value: "${JSON.stringify({ label: targetStatus })}"
                ) {
                    id
                }
            }
        `;

        const updateResponse = await ky.post('https://api.monday.com/v2', {
            json: {
                query: updateMutation,
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }).json();

        console.log('Monday.com update response:', updateResponse);

        return Response.json({
            success: true,
            message: `Monday.com item status updated to ${state}`,
        });
    } catch (error) {
        console.log('Error updating Monday task:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
                details: error.message,
            },
            { status: 500 },
        );
    }
}