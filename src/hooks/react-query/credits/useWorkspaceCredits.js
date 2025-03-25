import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

// Fetch email lists for a specific team
const fetchWorkspaceCredits = async (workspace_id) => {
    const { data, error } = await supabaseClient
        .from('workspace_credits')
        .select('available_credits, updated_at')
        .eq('workspace_id', workspace_id)
        .single();

    if (error) {
        throw new Error('Failed to fetch workspace credits');
    }

    return data;
};

// Hook to fetch all email lists for a given team
export const useWorkspaceCredits = (currentWorkspace) => {
    return useQuery({
        queryKey: ['workspaceCredits', currentWorkspace?.workspace_id],
        queryFn: () => fetchWorkspaceCredits(currentWorkspace?.workspace_id),
        staleTime: 1000 * 60 * 15, // 5 minutes
        enabled: !!currentWorkspace?.workspace_id, // Only fetch if teamId is provided
    });
};
