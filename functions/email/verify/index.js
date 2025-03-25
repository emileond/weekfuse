import { createClient } from '@supabase/supabase-js';
import { validateEmail } from '../../../src/utils/validateEmail.js';
import { verifyRecords } from '../../../src/utils/verifyRecords.js';
import { cacheDate } from '../../../src/utils/cacheDate.js';

export async function onRequestPost(context) {
    const apiKey = context.request.headers.get('x-api-key');
    const { email } = await context.request.json();

    // basic error handling
    if (!email) {
        return Response.json({ error: 'Missing required fields' }, {
            status: 400,
        });
    }

    // check if api key is valid
    if (!apiKey) {
        return Response.json({ error: 'API key is missing' }, {
            status: 401,
        });
    }

    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    // api key check
    const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key', apiKey)
        .eq('is_revoked', false)
        .single();

    if (error || !data) {
        return Response.json({ error: 'Invalid API key' }, {
            status: 401,
        });
    }

    // 1. check credits
    const { workspace_id } = data;
    const CREDITS_REQUIRED = 1;

    const { data: credits, error: creditsError } = await supabase
        .from('workspace_credits')
        .select('available_credits')
        .eq('workspace_id', workspace_id)
        .single();

    if (creditsError) {
        return Response.json({ error: creditsError.message }, {
            status: 500,
        });
    }

    const { available_credits } = credits;
    const notEnoughCredits = CREDITS_REQUIRED > available_credits;

    if (notEnoughCredits) {
        return Response.json(
            {
                error: 'Not enough credits',
                error_code: 'INSUFFICIENT_CREDITS',
            },
            { status: 403 },
        );
    }

    // 2. process request

    const { error: deductCreditsError } = await supabase.rpc('deduct_credits', {
        w_id: workspace_id,
        increment_value: 1,
    });

    if (deductCreditsError) {
        return Response.json({ error: deductCreditsError.message }, {
            status: 500,
        });
    }

    const validationResult = await validateEmail(email);
    if (validationResult.syntax_error || validationResult.disposable) {
        return Response.json({
            email,
            status: 'undeliverable',
            score: 0,
            syntax_error: validationResult.syntax_error,
            gibberish: null,
            role: null,
            did_you_mean: null,
            disposable: validationResult.disposable,
            domain_status: null,
            mx_record: null,
        });
    }

    let score = validationResult.score;

    const domain = email.split('@')[1];

    const { data: cachedData } = await supabase
        .from('domain_cache')
        .select('*')
        .eq('domain', domain)
        .gte('last_updated', cacheDate)
        .single();

    if (cachedData) {
        const { domain_status, mx_record } = cachedData;

        if (domain_status === 'active') {
            score += 20;
        } else {
            score -= 20;
        }

        if (mx_record) {
            score += 30;
        } else {
            score -= 30;
        }

        const status = score >= 75 ? 'deliverable' : score >= 60 ? 'risky' : 'undeliverable';

        return Response.json({
            email,
            status,
            score: Math.max(0, Math.min(100, score)),
            syntax_error: validationResult.syntax_error,
            gibberish: validationResult.gibberish,
            role: validationResult.role,
            did_you_mean: validationResult.did_you_mean,
            disposable: validationResult.disposable,
            domain_status,
            mx_record,
            workspace_id: workspace_id,
        });
    }

    const recordsResult = await verifyRecords(domain);
    await supabase.from('domain_cache').insert({
        domain,
        domain_status: recordsResult.domain_status,
        mx_record: recordsResult.mx_record,
    });

    score += recordsResult.score;
    const status = score >= 75 ? 'deliverable' : score >= 60 ? 'risky' : 'undeliverable';

    return Response.json({
        email,
        status,
        score: Math.max(0, Math.min(100, score)),
        syntax_error: validationResult.syntax_error,
        gibberish: validationResult.gibberish,
        role: validationResult.role,
        did_you_mean: validationResult.did_you_mean,
        disposable: validationResult.disposable,
        domain_status: recordsResult.domain_status,
        mx_record: recordsResult.mx_record,
        workspace_id: workspace_id,
    });
}
