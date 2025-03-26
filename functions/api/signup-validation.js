import { createClient } from '@supabase/supabase-js';
import ky from 'ky';

export async function onRequestPost(context) {
    const { email } = await context.request.json();

    // basic 400 error handling
    if (!email) {
        return Response.json({ error: 'Missing required fields' }, {
            status: 400,
        });
    }

    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    try {
        // Call Mailerfuse API for email verification
        const mailerfuseResponse = await ky.post('https://api.mailerfuse.com/email/verify', {
            json: { email },
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': context.env.MAILERFUSE_API_KEY
            }
        }).json();


        return Response.json(mailerfuseResponse);
    } catch (err) {
        if (err.response) {
            // Return the error from Mailerfuse
            const errorText = await err.response.text();
            try {
                // Try to parse the error as JSON
                const errorJson = JSON.parse(errorText);
                return Response.json(errorJson, { status: err.response.status });
            } catch (parseError) {
                // If parsing fails, return the raw error text
                return Response.json({ error: errorText }, { status: err.response.status });
            }
        } else {
            // Handle network or other errors
            return Response.json({ error: err?.message || 'Validation error' }, {
                status: 500,
            });
        }
    }
}
