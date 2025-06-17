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
            // Get the user integration to find the workspace_id and config
            const { data: integrationData, error: integrationError } = await supabase
                .from('user_integrations')
                .select('workspace_id, user_id, config')
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

            // Get project_id from integration config if available
            const project_id = integrationData.config?.project_id || null;

            // Convert description to Tiptap format if available
            const convertedDesc = convertJiraAdfToTiptap(issue?.fields?.description);

            // Extract host from issue.self URL
            let host = null;
            if (issue.self) {
                try {
                    const url = new URL(issue.self);
                    host = `${url.protocol}//${url.hostname}`;
                } catch (e) {
                    console.error('Error extracting host from issue.self:', e);
                }
            }

            // Upsert the task in the database
            const { error: insertError } = await supabase.from('tasks').insert({
                name: issue.fields.summary,
                description: JSON.stringify(convertedDesc) || null,
                workspace_id,
                integration_source: 'jira',
                external_id: issue.id,
                external_data: issue,
                host: host,
                assignee: user_id,
                creator: user_id,
                project_id: project_id,
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
            // Extract host from issue.self URL
            let host = null;
            if (issue.self) {
                try {
                    const url = new URL(issue.self);
                    host = `${url.protocol}//${url.hostname}`;
                } catch (e) {
                    console.error('Error extracting host from issue.self:', e);
                }
            }

            // Get the integration config to find the project_id
            // Get the user integration to find the workspace_id and config
            const { data: integration, error: integrationError } = await supabase
                .from('user_integrations')
                .select('workspace_id, user_id, config')
                .eq('type', 'jira')
                .eq('status', 'active')
                .eq('external_data->>accountId', user.accountId)
                .single();

            if (integrationError) {
                console.error(
                    `Error fetching integration for Jira issue ${issue.id}:`,
                    integrationError,
                );
                // Continue without project_id if integration not found
            }

            // Get project_id from integration config if available
            const project_id = integration?.config?.project_id || null;

            // Convert description to Tiptap format if available
            const convertedDesc = convertJiraAdfToTiptap(issue?.fields?.description);

            // Update the task in the database
            const { data: updateData, error: updateError } = await supabase
                .from('tasks')
                .update({
                    name: issue.fields.summary,
                    description: convertedDesc ? JSON.stringify(convertedDesc) : null,
                    integration_source: 'jira',
                    external_id: issue.id,
                    external_data: issue,
                    project_id: project_id,
                })
                .eq('integration_source', 'jira')
                .eq('external_id', issue.id)
                .eq('host', host)
                .select();

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
