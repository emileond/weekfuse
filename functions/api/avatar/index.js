export async function onRequestPost(context) {
    try {
        // Get the form data from the request
        const formData = await context.request.formData();
        const file = formData.get('file');
        const userEmail = formData.get('userEmail');

        if (!file || !userEmail) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Missing required fields: file or userEmail',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        // Validate file type
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid file type. Please upload PNG or JPG.',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'File size exceeds 10MB. Please choose a smaller image.',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        const customId = `avatar-${userEmail}-${Date.now()}`;
        const accountId = '606654cc2bf282f29537dc173f405984';

        // Try to delete existing image with the same custom ID
        try {
            const deleteResponse = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${customId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${context.env.CLOUDFLARE_IMAGES_API_KEY}`,
                    },
                },
            );

            const deleteResult = await deleteResponse.json();

            // Log the result for debugging, whether it succeeded or failed
            if (deleteResult.success) {
                console.log(`Successfully deleted existing image for custom ID: ${customId}`);
            } else {
                // This block will run if the image didn't exist, which is fine!
                // The API returns an error if the ID is not found.
                console.log(`No existing image found for ${customId}, proceeding to upload.`);
            }
        } catch (e) {
            console.error('An unexpected error occurred during the delete attempt:', e);
            // Even if this fails, we can still try to upload. The upload will provide the final error.
        }

        // Create a new FormData object for the Cloudflare Images API
        const cloudflareFormData = new FormData();
        cloudflareFormData.append('file', file);

        // Set the file name to the user ID
        cloudflareFormData.append('id', customId);

        // Add metadata tag
        cloudflareFormData.append(
            'metadata',
            JSON.stringify({
                tags: ['avatar'],
            }),
        );

        // Upload to Cloudflare Images
        const response = await fetch(
            'https://api.cloudflare.com/client/v4/accounts/606654cc2bf282f29537dc173f405984/images/v1',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${context.env.CLOUDFLARE_IMAGES_API_KEY}`,
                },
                body: cloudflareFormData,
            },
        );

        const result = await response.json();

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Failed to upload image to Cloudflare Images',
                    details: result.errors,
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        const cacheBuster = Date.now();

        // Return the image URL
        return new Response(
            JSON.stringify({
                success: true,
                imageUrl: result.result.variants[0],
                imageId: result.result.id,
                cacheBuster: cacheBuster,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
}
