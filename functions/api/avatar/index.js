export async function onRequestPost(context) {
    try {
        // Get the form data from the request
        const formData = await context.request.formData();
        const file = formData.get('file');
        const userId = formData.get('userId');

        if (!file || !userId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Missing required fields: file or userId',
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

        // Validate file size (1MB max)
        if (file.size > 1024 * 1024) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'File size exceeds 1MB. Please choose a smaller image.',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        // Create a new FormData object for the Cloudflare Images API
        const cloudflareFormData = new FormData();
        cloudflareFormData.append('file', file);

        // Set the file name to the user ID
        cloudflareFormData.append('id', `avatar-${userId}`);

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

        // Return the image URL
        return new Response(
            JSON.stringify({
                success: true,
                imageUrl: result.result.variants[0],
                imageId: result.result.id,
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
