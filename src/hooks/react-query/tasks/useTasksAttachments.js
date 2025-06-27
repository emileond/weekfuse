import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

// Fetch attachments for a specific task
const fetchTaskAttachments = async ({ task_id }) => {
    if (!task_id) {
        return [];
    }

    const { data, error } = await supabaseClient
        .from('attachments')
        .select('*')
        .eq('task_id', task_id)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error('Failed to fetch task attachments');
    }

    return data;
};

// Hook to fetch attachments for a specific task
export const useTasksAttachments = (task_id) => {
    return useQuery({
        queryKey: ['taskAttachments', task_id],
        queryFn: () => fetchTaskAttachments({ task_id }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!task_id, // Only fetch if task_id is provided
    });
};

// Function to delete an attachment
const deleteAttachment = async ({ attachmentId }) => {
    const { error } = await supabaseClient.from('attachments').delete().eq('id', attachmentId);

    if (error) {
        throw new Error('Failed to delete attachment');
    }
};

// Hook to delete an attachment
export const useDeleteTaskAttachment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAttachment,
        onError: (error) => {
            console.error('Error deleting attachment:', error);
        },
        onSuccess: (_, variables) => {
            // Get the task_id from the cache to invalidate the correct query
            const taskId = variables.task_id;
            if (taskId) {
                queryClient.invalidateQueries({
                    queryKey: ['taskAttachments', taskId],
                    refetchType: 'all',
                });
            }
        },
    });
};
