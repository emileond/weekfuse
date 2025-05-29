import { createClient } from '@supabase/supabase-js';
import { tinymceToTiptap } from '../../../src/utils/editorUtils.js';

export async function onRequestPost(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Parse the webhook payload
        const payload = await context.request.json();

        // Extract the webhook event type and issue data
        const webhookEvent = payload.webhookEvent;
        const issue = payload.issue;
        const cloudId = payload.cloudId || payload.resourceId;

        if (!webhookEvent || !issue || !cloudId) {
            return Response.json({ success: false, error: 'Invalid webhook payload' }, { status: 400 });
        }

        // Handle different webhook events
        if (webhookEvent === 'jira:issue_created' || webhookEvent === 'jira:issue_updated') {
            // Get the user integration to find the workspace_id
            const { data: integrationData, error: integrationError } = await supabase
                .from('user_integrations')
                .select('workspace_id, user_id')
                .eq('type', 'jira')
                .eq('status', 'active')
                .contains('config', { resources: [cloudId] });

            if (integrationError || !integrationData || integrationData.length === 0) {
                console.error('Error fetching integration data:', integrationError || 'No matching integration found');
                return Response.json({ success: false, error: 'Integration not found' }, { status: 404 });
            }

            // Use the first matching integration
            const workspace_id = integrationData[0].workspace_id;
            const user_id = integrationData[0].user_id;

            // Convert description to Tiptap format if available
            const convertedDesc = tinymceToTiptap(issue?.fields?.description);

            // Upsert the task in the database
            const { error: upsertError } = await supabase.from('tasks').upsert(
                {
                    name: issue.fields.summary,
                    description: convertedDesc || null,
                    workspace_id,
                    user_id,
                    integration_source: 'jira',
                    external_id: issue.id,
                    external_data: issue,
                    last_updated: new Date().toISOString(),
                },
                {
                    onConflict: ['integration_source', 'external_id'],
                }
            );

            if (upsertError) {
                console.error(`Upsert error for issue ${issue.id}:`, upsertError);
                return Response.json({ success: false, error: 'Failed to update task' }, { status: 500 });
            }

            console.log(`Issue ${issue.id} ${webhookEvent === 'jira:issue_created' ? 'created' : 'updated'} successfully`);
            return Response.json({ success: true });
        }

        // If we reach here, the webhook event type is not supported
        return Response.json({ success: false, error: 'Unsupported webhook event' }, { status: 400 });
    } catch (error) {
        console.error('Error processing Jira webhook:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
