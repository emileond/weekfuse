import { createClient } from '@supabase/supabase-js';

function arrayBufferToHex(buffer) {
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * This is the API endpoint for handling file downloads.
 * It retrieves a file from Cloudflare R2 and returns it to the client.
 */
export async function onRequestGet(context) {
    try {
        const { request, env } = context;

        // --- 1. Validate the R2 Bucket Binding ---
        if (!env.ATTACHMENTS_BUCKET) {
            throw new Error("R2 bucket binding 'ATTACHMENTS_BUCKET' not found.");
        }

        // --- 2. Parse the URL to get the filename ---
        const url = new URL(request.url);
        const filename = url.searchParams.get('filename');

        if (!filename) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing required parameter: filename is required.",
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // --- 3. Get the file from R2 ---
        console.log(`Attempting to fetch '${filename}' from R2 bucket...`);

        const object = await env.ATTACHMENTS_BUCKET.get(filename);

        if (!object) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "File not found.",
                }),
                { status: 404, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // --- 4. Return the file to the client ---
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
            headers,
        });
    } catch (error) {
        console.error('--- DOWNLOAD FAILED ---');
        console.error(error);

        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to download file.',
                message: errorMessage,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}

/**
 * This is the API endpoint for handling file deletions.
 * It deletes a file from Cloudflare R2 and then removes the record from Supabase.
 */
export async function onRequestDelete(context) {
    try {
        const { request, env } = context;

        // --- 1. Validate the R2 Bucket Binding ---
        if (!env.ATTACHMENTS_BUCKET) {
            throw new Error("R2 bucket binding 'ATTACHMENTS_BUCKET' not found.");
        }

        // --- 2. Parse the URL to get the parameters ---
        const url = new URL(request.url);
        const filename = url.searchParams.get('filename');
        const attachmentId = url.searchParams.get('id');

        if (!filename || !attachmentId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing required parameters: filename and id are required.",
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // --- 3. Delete the file from R2 ---
        console.log(`Attempting to delete '${filename}' from R2 bucket...`);

        await env.ATTACHMENTS_BUCKET.delete(filename);

        // --- 4. Delete the record from Supabase ---
        console.log(`Deleting attachment record with ID: ${attachmentId} from Supabase...`);

        const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

        const { error } = await supabaseClient
            .from('attachments')
            .delete()
            .eq('id', attachmentId);

        if (error) {
            console.error('Error deleting attachment from database:', error);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Failed to delete attachment record from database.',
                    message: error.message,
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } },
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Attachment deleted successfully.',
            }),
            { headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        console.error('--- DELETE FAILED ---');
        console.error(error);

        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to delete attachment.',
                message: errorMessage,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}

/**
 * This is the API endpoint for handling file uploads.
 * It receives a `multipart/form-data` request with a single 'file' field.
 */
export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        // --- 1. Validate the R2 Bucket Binding ---
        // This is a crucial check. If this fails, your `wrangler.toml` is wrong.
        if (!env.ATTACHMENTS_BUCKET) {
            throw new Error("R2 bucket binding 'ATTACHMENTS_BUCKET' not found.");
        }

        // --- 2. Parse the Incoming File and Parameters ---
        const formData = await request.formData();
        const file = formData.get('file');
        const task_id = formData.get('task_id');
        const workspace_id = formData.get('workspace_id');

        if (!file || !(file instanceof File)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No file uploaded or the uploaded item wasn't a file.",
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        if (!task_id || !workspace_id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing required parameters: task_id and workspace_id are required.",
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // --- 3. Generate a Unique Filename ---
        const timestamp = Date.now();
        const fileBuffer = await file.arrayBuffer(); // Read file into memory
        const hashBuffer = await crypto.subtle.digest('MD5', fileBuffer); // Hash the file contents
        const hash = arrayBufferToHex(hashBuffer);
        const fileExtension = file.name.split('.').pop() || 'bin';
        const uniqueFilename = `${timestamp}-${hash}.${fileExtension}`;

        // --- 4. Upload the File to R2 ---
        // This is the core operation.
        console.log(`Attempting to upload '${uniqueFilename}' to R2 bucket...`);

        const uploadedObject = await env.ATTACHMENTS_BUCKET.put(uniqueFilename, fileBuffer, {
            httpMetadata: {
                contentType: file.type,
                // Add a 'contentDisposition' to suggest a filename when the user downloads it.
                contentDisposition: `inline; filename="${file.name}"`,
            },
            // You can add custom metadata for your application's logic
            customMetadata: {
                originalFilename: file.name,
                uploadedBy: 'user-id-placeholder', // Replace with actual user info if available
            },
        });

        console.log('R2 put operation completed.');

        // Sanity check to ensure the object was created successfully.
        if (uploadedObject.key !== uniqueFilename) {
            throw new Error(
                'R2 upload failed: the returned key does not match the generated filename.',
            );
        }

        // --- 5. Return the Publicly Accessible URL ---
        // IMPORTANT: This URL will only work if you have a custom domain
        // connected to your R2 bucket.
        const fileUrl = `https://attachments.weekfuse.com/${uniqueFilename}`;

        console.log(`Successfully uploaded. File available at: ${fileUrl}`);

        // --- 6. Save attachment details to the database ---
        try {
            const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

            const attachmentData = {
                task_id,
                url: fileUrl,
                name: file.name,
                type: file.type,
                size: file.size,
                workspace_id
            };

            const { data, error } = await supabaseClient
                .from('attachments')
                .insert(attachmentData)
                .select();

            if (error) {
                console.error('Error saving attachment to database:', error);
                // We continue even if there's a database error, as the file was uploaded successfully
            } else {
                console.log('Attachment saved to database:', data);
            }
        } catch (dbError) {
            console.error('Database operation failed:', dbError);
            // We continue even if there's a database error, as the file was uploaded successfully
        }

        return new Response(
            JSON.stringify({
                success: true,
                url: fileUrl,
                name: file.name,
                type: file.type,
                size: file.size,
            }),
            { headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        // --- 6. Robust Error Handling ---
        console.error('--- UPLOAD FAILED ---');
        // Log the entire error object for maximum detail.
        console.error(error);

        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to upload file.',
                message: errorMessage,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}
