import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

// Fetch all reflect sessions for a user
const fetchReflectSessions = async ({ user_id }) => {
    const { data, error } = await supabaseClient
        .from('reflect_sessions')
        .select('*')
        .eq('user_id', user_id);

    if (error) {
        throw new Error('Failed to fetch reflect sessions');
    }

    return data;
};

// Hook to fetch all reflect sessions for a user
export const useReflectSessions = (user_id) => {
    return useQuery({
        queryKey: ['reflectSessions', user_id],
        queryFn: () => fetchReflectSessions({ user_id }),
        staleTime: 1000 * 60 * 15, // 15 minutes
        enabled: !!user_id, // Only fetch if user_id is provided
    });
};

// Fetch a specific reflect session by ID
const fetchReflectSessionById = async ({ session_id }) => {
    const { data, error } = await supabaseClient
        .from('reflect_sessions')
        .select('*')
        .eq('id', session_id)
        .single();

    if (error) {
        throw new Error('Failed to fetch reflect session');
    }

    return data;
};

// Hook to fetch a specific reflect session by ID
export const useReflectSessionById = (session_id) => {
    return useQuery({
        queryKey: ['reflectSession', session_id],
        queryFn: () => fetchReflectSessionById({ session_id }),
        staleTime: 1000 * 60 * 15, // 15 minutes
        enabled: !!session_id, // Only fetch if session_id is provided
    });
};

// Function to create a new reflect session
const createReflectSession = async ({ session }) => {
    const { data, error } = await supabaseClient
        .from('reflect_sessions')
        .insert(session)
        .select()
        .single();

    if (error) {
        throw new Error('Failed to create reflect session');
    }

    return data;
};

// Hook to create a new reflect session
export const useCreateReflectSession = (user_id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createReflectSession,
        onSuccess: () => {
            // Invalidate and refetch the reflect sessions query for the user
            queryClient.invalidateQueries({
                queryKey: ['reflectSessions', user_id],
                refetchType: 'all', // Force refetch to update UI
            });
        },
    });
};

// Function to update a reflect session
const updateReflectSession = async ({ session_id, updates }) => {
    const { error } = await supabaseClient
        .from('reflect_sessions')
        .update(updates)
        .eq('id', session_id);

    if (error) {
        throw new Error('Failed to update reflect session');
    }
};

// Hook to update a reflect session
export const useUpdateReflectSession = (user_id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateReflectSession,
        onError: (error) => {
            console.error('Error updating reflect session:', error);
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch the reflect sessions query for the user
            queryClient.invalidateQueries({
                queryKey: ['reflectSessions', user_id],
                refetchType: 'all', // Force refetch to update UI
            });
            // Also invalidate the specific session query
            queryClient.invalidateQueries({
                queryKey: ['reflectSession', variables.session_id],
                refetchType: 'all', // Force refetch to update UI
            });
        },
    });
};

// Function to delete a reflect session
const deleteReflectSession = async ({ session_id }) => {
    const { error } = await supabaseClient.from('reflect_sessions').delete().eq('id', session_id);

    if (error) {
        throw new Error('Failed to delete reflect session');
    }
};

// Hook to delete a reflect session
export const useDeleteReflectSession = (user_id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ session_id }) => deleteReflectSession({ session_id }),
        onError: (error) => {
            console.error('Error deleting reflect session:', error);
        },
        onSuccess: (_, variables) => {
            // Option 1 (Recommended): Optimistically update the 'reflectSessions' cache
            queryClient.setQueryData(['reflectSessions', user_id], (oldData) => {
                if (oldData) {
                    return oldData.filter((session) => session.id !== variables.session_id);
                }
                return oldData;
            });

            queryClient.invalidateQueries({
                queryKey: ['reflectSessions', user_id],
                refetchType: 'all',
            });

            // Remove the specific session from the cache (good practice for single item queries)
            queryClient.removeQueries(['reflectSession', variables.session_id]);
        },
    });
};
