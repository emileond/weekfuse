import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';
import ky from 'ky';

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
const deleteAttachment = async ({ attachmentId, url, taskId }) => {
    if (!attachmentId || !url) {
        throw new Error('Attachment ID and Task ID are required for deletion.');
    }
    try {
        // Extract filename from URL
        const filename = url ? url.split('/').pop() : null;

        // Use the API endpoint to delete the file from R2 and Supabase
        await ky.delete(`/api/task/attachments?filename=${filename}&id=${attachmentId}`, {
            timeout: 30000, // 30 seconds timeout
        });
    } catch (error) {
        console.error('Error in deleteAttachment API call:', error);
        throw new Error('Failed to delete attachment from the server.');
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
            const taskId = variables.taskId;

            queryClient.invalidateQueries({
                queryKey: ['taskAttachments', taskId],
                refetchType: 'all',
            });
        },
    });
};
