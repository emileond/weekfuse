import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

// Fetch all worskpaces for a user
const fetchWorkspaces = async (user) => {
    const { data, error } = await supabaseClient
        .from('workspace_members')
        .select(
            `
      workspace_id,
      role,
      workspaces!workspace_members_workspace_id_fkey (
        name, is_ltd, ltd_plan
      )
    `,
        )
        .eq('user_id', user?.id)
        .eq('status', 'active');

    if (error) {
        console.error('Error fetching workspaces:', error);
        throw error;
    }

    const transformedData = data.map((item) => ({
        workspace_id: item.workspace_id,
        role: item.role,
        name: item.workspaces?.name,
        is_ltd: item.workspaces?.is_ltd,
        ltd_plan: item.workspaces?.ltd_plan,
    }));

    return transformedData;
};

// Hook to fetch all worskpaces
export const useWorkspaces = (user) => {
    return useQuery({
        queryKey: ['workspaces', user?.id],
        queryFn: () => fetchWorkspaces(user),
        staleTime: 1000 * 60 * 30, // 30 minutes
        enabled: !!user,
    });
};
