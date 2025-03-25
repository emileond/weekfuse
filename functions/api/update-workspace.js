import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const { workspaceId, name, session } = await context.request.json();

    // basic 400 error handling
    if (!workspaceId || !name || !session) {
        return Response.json({ error: 'Missing parameters' }, {
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
        return Response.json({ error: authError.message }, {
            status: 401,
        });
    }

    // Update workspace
    const { data, error } = await supabase
        .from('workspaces')
        .update({ name })
        .eq('id', workspaceId)
        .select()
        .single();

    if (error) {
        return Response.json({ error: error.message }, {
            status: 500,
        });
    }

    return Response.json(data, {
        status: 200,
    });
}
