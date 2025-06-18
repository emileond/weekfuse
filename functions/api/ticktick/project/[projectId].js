import ky from 'ky';
import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
    // Get the project ID from the URL (this will be "inbox" or a numeric ID)
    const url = new URL(context.request.url);
    const projectId = url.pathname.split('/').pop();

    const { user_id, workspace_id } = Object.fromEntries(url.searchParams);

    console.log(projectId, user_id, workspace_id);

    // A single check for all required parameters
    if (!projectId || !user_id || !workspace_id) {
        return Response.json(
            {
                success: false,
                error: 'Missing required parameters',
            },
            { status: 400 },
        );
    }
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Get the user integration to get the access_token
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('id, access_token')
            .eq('type', 'ticktick')
            .eq('user_id', user_id)
            .eq('workspace_id', workspace_id)
            .single();

        if (integrationError || !integration) {
            console.log(integrationError);
            return Response.json(
                {
                    success: false,
                    error: 'TickTick integration not found',
                    details: integrationError,
                },
                { status: 404 },
            );
        }

        const accessToken = integration.access_token;

        // Get the project from TickTick using the variable from the URL
        const projectResponse = await ky
            .get(`https://api.ticktick.com/open/v1/project/${projectId}`, {
                // <-- CORRECTED
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
            .json();

        return Response.json({
            success: true,
            project: projectResponse,
        });
    } catch (error) {
        console.log('Error fetching TickTick project:', error);
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
