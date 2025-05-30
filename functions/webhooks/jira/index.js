import { createClient } from '@supabase/supabase-js';
import { convertJiraAdfToTiptap } from '../../../src/utils/editorUtils.js';

export async function onRequestPost(context) {
    try {
        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Parse the webhook payload
        const payload = await context.request.json();

        // Extract the webhook event type and issue data
        const webhookEvent = payload.webhookEvent;
        const issue = payload.issue;
        const user = payload.user;

        if (!webhookEvent || !issue || !user) {
            return Response.json(
                { success: false, error: 'Invalid webhook payload' },
                { status: 400 },
            );
        }

        // Handle different webhook events
        if (webhookEvent === 'jira:issue_created') {
            // Get the user integration to find the workspace_id
            const { data: integrationData, error: integrationError } = await supabase
                .from('user_integrations')
                .select('workspace_id, user_id')
                .eq('type', 'jira')
                .eq('status', 'active')
                .eq('external_data->>accountId', user.accountId)
                .single();

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

            // Use the first matching integration
            const workspace_id = integrationData.workspace_id;
            const user_id = integrationData.user_id;

            // Convert description to Tiptap format if available
            const convertedDesc = convertJiraAdfToTiptap(issue?.fields?.description);

            // Upsert the task in the database
            const { error: insertError } = await supabase.from('tasks').insert({
                name: issue.fields.summary,
                description: JSON.stringify(convertedDesc) || null,
                workspace_id,
                user_id,
                integration_source: 'jira',
                external_id: issue.id,
                external_data: issue,
            });

            if (insertError) {
                console.error(`Upsert error for issue ${issue.id}:`, insertError);
                return Response.json(
                    { success: false, error: 'Failed to create task' },
                    { status: 500 },
                );
            }

            console.log(`Issue ${issue.id} created successfully`);
            return Response.json({ success: true });
        }

        if (webhookEvent === 'jira:issue_updated') {
            // Convert description to Tiptap format if available
            const convertedDesc = convertJiraAdfToTiptap(issue?.fields?.description);

            console.log(convertedDesc);
            console.log(issue);

            // Upsert the task in the database
            const { data: updateData, error: updateError } = await supabase
                .from('tasks')
                .update({
                    name: issue.fields.summary,
                    description: convertedDesc ? JSON.stringify(convertedDesc) : null,
                    integration_source: 'jira',
                    external_id: issue.id,
                    external_data: issue,
                })
                .eq('integration_source', 'jira')
                .eq('external_data->>self', issue.self)
                .select('id')
                .single();

            if (updateError) {
                console.error(`Update error for issue ${issue.id}:`, updateError);
                return Response.json(
                    { success: false, error: 'Failed to update task' },
                    { status: 500 },
                );
            }

            console.log(`Task ${updateData.id} updated successfully`);
            return Response.json({ success: true });
        }

        // If we reach here, the webhook event type is not supported
        return Response.json(
            { success: false, error: 'Unsupported webhook event' },
            { status: 400 },
        );
    } catch (error) {
        console.error('Error processing Jira webhook:', error);
        return Response.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 },
        );
    }
}
