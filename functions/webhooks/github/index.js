import { createClient } from '@supabase/supabase-js';
import { markdownToTipTap } from '../../../src/utils/editorUtils.js';

const validateGitHubWebhook = async (request, secret, payload) => {
    // Get the signature from the headers
    const signature = request.headers.get('X-Hub-Signature-256');

    if (!signature || !signature.startsWith('sha256=')) {
        return false;
    }

    // Extract the hash from the signature
    const receivedHash = signature.substring(7); // Remove 'sha256=' prefix

    // Convert the secret to a key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    // Calculate the expected signature
    const payloadData = encoder.encode(payload);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData);

    // Convert the signature to hex
    const signatureBytes = new Uint8Array(signatureBuffer);
    const expectedHash = Array.from(signatureBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    // Use a constant-time comparison to prevent timing attacks
    // Since we don't have crypto.timingSafeEqual in Workers, we'll implement a simple version
    if (receivedHash.length !== expectedHash.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < receivedHash.length; i++) {
        result |= receivedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }

    return result === 0;
};

export async function onRequestPost(context) {
    try {
        // Get the raw payload as text for signature validation
        const rawPayload = await context.request.text();

        // Validate the webhook signature
        const isValid = await validateGitHubWebhook(
            context.request,
            context.env.GITHUB_WEBHOOK_SECRET,
            rawPayload,
        );

        if (!isValid) {
            return Response.json(
                { success: false, error: 'Invalid webhook signature' },
                { status: 401 },
            );
        }

        // Parse the webhook payload
        const payload = JSON.parse(rawPayload);

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Extract the webhook event type and issue data
        const event = context.request.headers.get('X-GitHub-Event');
        const issue = payload.issue;

        if (!event || !issue) {
            return Response.json(
                { success: false, error: 'Invalid webhook payload' },
                { status: 400 },
            );
        }

        // Only handle issue events
        if (event === 'issues') {
            // Extract host from issue.url
            let host = null;
            if (issue.url) {
                try {
                    const url = new URL(issue.url);
                    host = `${url.protocol}//${url.hostname}`;
                } catch (e) {
                    console.error('Error extracting host from issue.url:', e);
                }
            }

            // Convert description to Tiptap format if available
            const tiptapDescription = issue.body ? markdownToTipTap(issue.body) : null;

            // Update the task in the database
            const { data: updateData, error: updateError } = await supabase
                .from('tasks')
                .update({
                    name: issue.title,
                    description: tiptapDescription ? JSON.stringify(tiptapDescription) : null,
                    external_data: issue,
                })
                .eq('integration_source', 'github')
                .eq('external_id', issue.id.toString())
                .eq('host', host)
                .select();

            if (updateError) {
                console.error(`Update error for issue ${issue.id}:`, updateError);
                return Response.json(
                    { success: false, error: 'Failed to update task' },
                    { status: 500 },
                );
            }

            if (!updateData || updateData.length === 0) {
                console.log(`No task found for GitHub issue ${issue.id}`);
                return Response.json({ success: false, error: 'Task not found' }, { status: 404 });
            }

            console.log(`Task for GitHub issue ${issue.id} updated successfully`);
            return Response.json({ success: true });
        }

        // If we reach here, the webhook event type is not supported
        return Response.json(
            { success: false, error: 'Unsupported webhook event' },
            { status: 400 },
        );
    } catch (error) {
        console.error('Error processing GitHub webhook:', error);
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
