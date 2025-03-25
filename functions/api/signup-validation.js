import { createClient } from '@supabase/supabase-js';
import { processEmailValidation } from '../../src/utils/processEmail.js';

export async function onRequestPost(context) {
    const { email } = await context.request.json();

    // basic 400 error handling
    if (!email) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
        });
    }

    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    try {
        const validationResult = await processEmailValidation(email, supabase);
        return new Response(JSON.stringify(validationResult));
    } catch (err) {
        return new Response(JSON.stringify({ error: err?.message || 'Validation error' }), {
            status: 500,
        });
    }
}
