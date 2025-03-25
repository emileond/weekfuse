import { createClient } from '@supabase/supabase-js';
import { configure, tasks } from '@trigger.dev/sdk/v3';

async function validateApiKey(apiKey, context, supabase) {
    if (!apiKey) {
        return {
            isValid: false,
            response: Response.json({ error: 'API key is missing' }, {
                status: 401,
            }),
        };
    }

    const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key', apiKey)
        .eq('is_revoked', false)
        .single();

    if (error || !data) {
        return {
            isValid: false,
            response: Response.json({ error: 'Invalid API key' }, {
                status: 401,
            }),
        };
    }

    return {
        isValid: true,
        apiKeyData: data,
    };
}

export async function onRequestPost(context) {
    const apiKey = context.request.headers.get('x-api-key');
    const { emails } = await context.request.json();

    // basic error handling
    if (!emails) {
        return Response.json({ error: 'Missing required fields' }, {
            status: 400,
        });
    }

    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    // check if api key is valid
    const validation = await validateApiKey(apiKey, context, supabase);
    if (!validation.isValid) {
        return validation.response;
    }

    const { workspace_id, name } = validation.apiKeyData;

    const creditsNeeded = emails.length;

    // 1. check credits
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
    const notEnoughCredits = creditsNeeded > available_credits;

    if (notEnoughCredits) {
        return Response.json(
            {
                error: 'Not enough credits',
                error_code: 'INSUFFICIENT_CREDITS',
            },
            { status: 403 },
        );
    } else {
        // 2. If enough credits, save list in db
        const { data: fileData, error: fileError } = await supabase
            .from('lists')
            .insert([
                {
                    name: `${name || 'Unnamed list'} - ${new Date().toISOString()}`,
                    workspace_id: workspace_id,
                    status: 'pending',
                    size: emails.length,
                },
            ])
            .select('id')
            .single();

        if (fileError) {
            console.log(fileError);
            return Response.json({ error: fileError.message }, {
                status: 500,
            });
        }
        const listId = fileData.id;

        // 4. Trigger validation task
        configure({
            secretKey: context.env.TRIGGER_SECRET_KEY,
        });

        // map emails to have an email col
        const dataMapped = emails.map((email) => ({ email }));

        const handle = await tasks.trigger('bulk-email-verification', {
            data: dataMapped,
            emailColumn: 'email',
            listId,
            workspace_id,
        });

        // 4. Update list with task id
        await supabase
            .from('lists')
            .update({
                task_id: handle?.id,
                status: 'processing',
            })
            .eq('id', listId);

        return Response.json({ list_id: listId }, {
            status: 200,
        });
    }
}

export async function onRequestGet(context) {
    const apiKey = context.request.headers.get('x-api-key');

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    // basic error handling
    if (!id) {
        return Response.json({ error: 'Missing required fields' }, {
            status: 400,
        });
    }

    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    // check if api key is valid
    const validation = await validateApiKey(apiKey, context, supabase);
    if (!validation.isValid) {
        return validation.response;
    }

    const { workspace_id } = validation.apiKeyData;

    const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', id)
        .eq('workspace_id', workspace_id)
        .single();

    if (error) {
        return Response.json({ error: error.message }, {
            status: 500,
        });
    }

    return Response.json({ status: data.status, summary: data.summary });
}
