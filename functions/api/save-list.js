import { createClient } from '@supabase/supabase-js';
import { configure, tasks } from '@trigger.dev/sdk/v3';

export async function onRequestPost(context) {
    const { fileName, data, emailColumn, workspace_id, session } = await context.request.json();

    // basic 400 error handling
    if (!fileName || !workspace_id || !session || !data || !emailColumn) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), {
            status: 400,
        });
    }

    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    // auth check
    const { error: authError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
    });

    if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), {
            status: 401,
        });
    }

    const creditsNeeded = data.length;

    // 1. check credits
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
    const notEnoughCredits = creditsNeeded > available_credits;

    if (notEnoughCredits) {
        return new Response(
            JSON.stringify({
                error: 'Not enough credits',
                error_code: 'INSUFFICIENT_CREDITS',
            }),
            { status: 403 },
        );
    } else {
        // 2. If enough credits, save list in db
        const { data: fileData, error: fileError } = await supabase
            .from('lists')
            .insert([
                {
                    name: fileName,
                    workspace_id: workspace_id,
                    status: 'pending',
                    size: data.length,
                    user_email: session.user.email,
                },
            ])
            .select('id')
            .single();

        if (fileError) {
            console.log(fileError);
            return new Response(JSON.stringify({ error: fileError.message }), {
                status: 500,
            });
        }
        const listId = fileData.id;

        // 4. Trigger validation task
        configure({
            secretKey: context.env.TRIGGER_SECRET_KEY,
        });

        const handle = await tasks.trigger('bulk-email-verification', {
            data,
            emailColumn,
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

        return new Response(JSON.stringify({ list_id: listId }), {
            status: 200,
        });
    }
}
