import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

const fetchUserInvitations = async (user_email) => {
    const { data, error } = await supabaseClient
        .from('workspace_members')
        .select('*')
        .eq('invite_email', user_email)
        .eq('status', 'pending');

    if (error) {
        throw new Error('Failed to fetch invitations');
    }

    return data;
};

export const useUserInvitations = (user) => {
    return useQuery({
        queryKey: ['userInvitations', user?.id],
        queryFn: () => fetchUserInvitations(user?.email),
        staleTime: 1000 * 60 * 120, // 120 minutes
        enabled: !!user, // Only fetch if user is provided
    });
};

// Function to update invitation
const VALID_STATUSES = ['active', 'declined', 'pending'];

const updateUserInvitation = async ({ id, status, user_id }) => {
    if (!VALID_STATUSES.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const { error } = await supabaseClient
        .from('workspace_members')
        .update([
            {
                status,
                user_id,
                updated_at: 'now()', // Use database timestamp
            },
        ])
        .eq('id', id);
    if (error) {
        console.error('Error updating workspace member:', error);
        throw new Error(error.message);
    }
};

// Hook to update invitation
export const useUpdateUserInvitation = (user) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUserInvitation,
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries(['userInvitations', user?.id]);
            queryClient.invalidateQueries(['workspaces', user?.id]);
        },
    });
};
