import { createClient } from '@supabase/supabase-js';
import { processEmailValidation } from '../../src/utils/processEmail.js';

export async function onRequestPost(context) {
    const { email, session, workspace_id } = await context.request.json();

    // basic 400 error handling
    if (!email || !session || !workspace_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
        });
    }

    const supabaseClient = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_KEY);

    // auth check
    const { error: authError } = await supabaseClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
    });

    if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), {
            status: 401,
        });
    }

    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    // 1. check credits
    const CREDITS_REQUIRED = 1;

    const { data: credits, error: creditsError } = await supabase
        .from('workspace_credits')
        .select('available_credits')
        .eq('workspace_id', workspace_id)
        .single();

    if (creditsError) {
        return new Response(JSON.stringify({ error: creditsError.message }), {
            status: 500,
        });
    }

    const { available_credits } = credits;
    const notEnoughCredits = CREDITS_REQUIRED > available_credits;

    if (notEnoughCredits) {
        return new Response(
            JSON.stringify({
                error: 'Not enough credits',
                error_code: 'INSUFFICIENT_CREDITS',
            }),
            { status: 403 },
        );
    } else {
        const { error } = await supabase.rpc('deduct_credits', {
            w_id: workspace_id,
            increment_value: 1,
        });

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
            });
        }

        // Process Email Validation (with Supabase)
        const result = await processEmailValidation(email, supabase);
        result.workspace_id = workspace_id;

        return new Response(JSON.stringify(result));
    }
}
