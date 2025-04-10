import { createClient } from '@supabase/supabase-js';

// GitHub OAuth endpoints
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

// Handle GET requests for initiating GitHub OAuth flow
export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    // Initialize Supabase client
    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);
    
    // If code is present, this is a callback from GitHub
    if (code) {
        return handleCallback(context, code, state, supabase);
    }
    
    // Otherwise, initiate the OAuth flow
    return initiateOAuth(context, supabase);
}

// Initiate the OAuth flow by redirecting to GitHub
async function initiateOAuth(context, supabase) {
    // Generate a random state value for security
    const state = crypto.randomUUID();
    
    // Get the user ID from the session
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Store the state in the database for verification later
    const { error: stateError } = await supabase
        .from('github_oauth_states')
        .insert([{ state, user_id: user.id }]);
    
    if (stateError) {
        return Response.json({ error: 'Failed to store OAuth state' }, { status: 500 });
    }
    
    // Redirect to GitHub OAuth page
    const redirectUrl = new URL(GITHUB_AUTH_URL);
    redirectUrl.searchParams.append('client_id', context.env.GITHUB_CLIENT_ID);
    redirectUrl.searchParams.append('redirect_uri', `${context.env.BASE_URL}/api/github/auth`);
    redirectUrl.searchParams.append('state', state);
    redirectUrl.searchParams.append('scope', 'repo');
    
    return Response.redirect(redirectUrl.toString(), 302);
}

// Handle the callback from GitHub after user authorization
async function handleCallback(context, code, state, supabase) {
    // Verify the state parameter to prevent CSRF attacks
    const { data: stateData, error: stateError } = await supabase
        .from('github_oauth_states')
        .select('user_id')
        .eq('state', state)
        .single();
    
    if (stateError || !stateData) {
        return Response.json({ error: 'Invalid OAuth state' }, { status: 400 });
    }
    
    // Exchange the code for an access token
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: context.env.GITHUB_CLIENT_ID,
            client_secret: context.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: `${context.env.BASE_URL}/api/github/auth`
        })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
        return Response.json({ error: 'Failed to obtain access token' }, { status: 500 });
    }
    
    // Store the access token in the database
    const { error: tokenError } = await supabase
        .from('github_integrations')
        .upsert([{
            user_id: stateData.user_id,
            access_token: tokenData.access_token,
            token_type: tokenData.token_type,
            scope: tokenData.scope
        }], { onConflict: 'user_id' });
    
    if (tokenError) {
        return Response.json({ error: 'Failed to store access token' }, { status: 500 });
    }
    
    // Clean up the state entry
    await supabase
        .from('github_oauth_states')
        .delete()
        .eq('state', state);
    
    // Redirect back to the integrations page
    return Response.redirect(`${context.env.BASE_URL}/integrations?github_connected=true`, 302);
}

// Handle POST requests for disconnecting GitHub integration
export async function onRequestPost(context) {
    const { action } = await context.request.json();
    
    if (action !== 'disconnect') {
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);
    
    // Get the user ID from the session
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete the GitHub integration for this user
    const { error: deleteError } = await supabase
        .from('github_integrations')
        .delete()
        .eq('user_id', user.id);
    
    if (deleteError) {
        return Response.json({ error: 'Failed to disconnect GitHub integration' }, { status: 500 });
    }
    
    return Response.json({ success: true });
}