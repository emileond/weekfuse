import { createClient } from '@supabase/supabase-js';

// GitHub API endpoint for issues assigned to the authenticated user
const GITHUB_API_URL = 'https://api.github.com';

export async function onRequestGet(context) {
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
    
    // Get the GitHub access token for this user
    const { data: githubIntegration, error: integrationError } = await supabase
        .from('github_integrations')
        .select('access_token, token_type')
        .eq('user_id', user.id)
        .single();
    
    if (integrationError || !githubIntegration) {
        return Response.json({ error: 'GitHub integration not found' }, { status: 404 });
    }
    
    try {
        // Fetch issues assigned to the user
        const issuesResponse = await fetch(`${GITHUB_API_URL}/issues?filter=assigned&state=open`, {
            headers: {
                'Authorization': `${githubIntegration.token_type} ${githubIntegration.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'WeekFuse-App'
            }
        });
        
        if (!issuesResponse.ok) {
            const errorData = await issuesResponse.json();
            return Response.json({ 
                error: 'Failed to fetch GitHub issues',
                details: errorData
            }, { status: issuesResponse.status });
        }
        
        const issues = await issuesResponse.json();
        
        // Transform the issues into a format suitable for the application
        const tickets = issues.map(issue => ({
            id: issue.id.toString(),
            title: issue.title,
            description: issue.body,
            url: issue.html_url,
            state: issue.state,
            created_at: issue.created_at,
            updated_at: issue.updated_at,
            repository: {
                name: issue.repository?.name || extractRepoFromUrl(issue.repository_url),
                url: issue.repository?.html_url || issue.repository_url.replace('api.github.com/repos', 'github.com')
            },
            labels: issue.labels.map(label => ({
                name: label.name,
                color: label.color
            })),
            assignee: issue.assignee ? {
                login: issue.assignee.login,
                avatar_url: issue.assignee.avatar_url,
                url: issue.assignee.html_url
            } : null
        }));
        
        return Response.json({ tickets });
    } catch (error) {
        return Response.json({ 
            error: 'Failed to fetch GitHub issues',
            details: error.message
        }, { status: 500 });
    }
}

// Helper function to extract repository name from repository_url
function extractRepoFromUrl(url) {
    const parts = url.split('/');
    return parts[parts.length - 1];
}

// Handle POST requests for importing GitHub tickets as tasks
export async function onRequestPost(context) {
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
    
    // Get the request body
    const { ticketIds, workspaceId } = await context.request.json();
    
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0 || !workspaceId) {
        return Response.json({ error: 'Invalid request parameters' }, { status: 400 });
    }
    
    // Get the GitHub access token for this user
    const { data: githubIntegration, error: integrationError } = await supabase
        .from('github_integrations')
        .select('access_token, token_type')
        .eq('user_id', user.id)
        .single();
    
    if (integrationError || !githubIntegration) {
        return Response.json({ error: 'GitHub integration not found' }, { status: 404 });
    }
    
    try {
        // Fetch details for each ticket
        const ticketPromises = ticketIds.map(async (ticketId) => {
            const issueResponse = await fetch(`${GITHUB_API_URL}/issues/${ticketId}`, {
                headers: {
                    'Authorization': `${githubIntegration.token_type} ${githubIntegration.access_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'WeekFuse-App'
                }
            });
            
            if (!issueResponse.ok) {
                throw new Error(`Failed to fetch issue ${ticketId}`);
            }
            
            return issueResponse.json();
        });
        
        const issues = await Promise.all(ticketPromises);
        
        // Create tasks in the database
        const tasksToInsert = issues.map(issue => ({
            title: issue.title,
            description: issue.body || '',
            user_id: user.id,
            workspace_id: workspaceId,
            status: 'todo',
            source: 'github',
            source_id: issue.id.toString(),
            source_url: issue.html_url,
            metadata: {
                repository: extractRepoFromUrl(issue.repository_url),
                labels: issue.labels.map(label => label.name),
                state: issue.state
            }
        }));
        
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .insert(tasksToInsert)
            .select();
        
        if (tasksError) {
            return Response.json({ error: 'Failed to create tasks', details: tasksError }, { status: 500 });
        }
        
        return Response.json({ success: true, tasks });
    } catch (error) {
        return Response.json({ 
            error: 'Failed to import GitHub tickets',
            details: error.message
        }, { status: 500 });
    }
}