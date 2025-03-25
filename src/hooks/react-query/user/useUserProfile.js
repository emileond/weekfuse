import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

const fetchUserProfile = async (userId) => {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        throw new Error('Failed to fetch user profile');
    }

    return data;
};

export const useUserProfile = (user) => {
    return useQuery({
        queryKey: ['userProfile', user?.id],
        queryFn: () => fetchUserProfile(user?.id),
        staleTime: 1000 * 60 * 120, // 120 minutes
        enabled: !!user, // Only fetch if user is provided
    });
};

const updateUserProfile = async (data, userId) => {
    console.log('updating profile:', data, userId);
    const { error } = await supabaseClient
        .from('profiles')
        .update([
            {
                ...data,
            },
        ])
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating user profiler:', error);
        throw new Error(error.message);
    }
};

// Hook to update invitation
export const useUpdateUserProfile = (user) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => updateUserProfile(data, user.id),
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries(['userProfile', user?.id]);
        },
    });
};
