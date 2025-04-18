import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';
import ky from 'ky';

// Fetch integration for a specific workspace / integration type
const fetchIntegration = async ({ user_id, type }) => {
    const { data, error } = await supabaseClient
        .from('user_integrations')
        .select('id, status, installation_id')
        .eq('user_id', user_id)
        .eq('type', type)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        } else {
            throw new Error('Failed to fetch integration');
        }
    }

    return data;
};

// Hook to fetch projects
export const useUserIntegration = (user_id, type) => {
    return useQuery({
        queryKey: ['user_integration', user_id, type],
        queryFn: () =>
            fetchIntegration({
                user_id,
                type,
            }),
        staleTime: 1000 * 60 * 60, // 60 minutes
        enabled: !!user_id, // Only fetch if workspace_id is provided
    });
};

// Delete integration
const deleteIntegration = async ({ id, installation_id, type }) => {
    if (type === 'github' && installation_id) {
        // First, make a DELETE request to the API
        await ky.delete('/api/github/auth', {
            json: { installation_id },
        });
    }

    // Then delete from the database
    const { error } = await supabaseClient.from('user_integrations').delete().eq('id', id);

    if (error) {
        throw new Error('Failed to delete integration');
    }

    return { success: true };
};

// Hook to delete an integration
export const useDeleteIntegration = (user_id, type) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteIntegration,
        onSuccess: () => {
            // Invalidate the relevant query
            queryClient.invalidateQueries({
                queryKey: ['user_integration', user_id, type],
                exact: true,
            });
        },
    });
};
