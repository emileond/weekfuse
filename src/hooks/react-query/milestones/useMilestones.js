import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

// Fetch milestones for a specific workspace and optionally a specific project
const fetchMilestones = async ({ workspace_id, project_id }) => {
    let query = supabaseClient.from('milestones').select('*').eq('workspace_id', workspace_id);

    // If project_id is provided, filter by project_id as well
    if (project_id) {
        query = query.eq('project_id', project_id);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error('Failed to fetch milestones');
    }

    return data;
};

// Hook to fetch milestones
export const useMilestones = (currentWorkspace = {}, project_id = null) => {
    return useQuery({
        queryKey: ['milestones', currentWorkspace?.workspace_id, project_id],
        queryFn: () =>
            fetchMilestones({
                workspace_id: currentWorkspace?.workspace_id,
                project_id: project_id,
            }),
        staleTime: 1000 * 60 * 30, // 30 minutes
        enabled: !!currentWorkspace?.workspace_id, // Only fetch if workspace_id is provided
    });
};

// Function to create a new milestone
const createMilestone = async ({ milestone }) => {
    const { data, error } = await supabaseClient
        .from('milestones')
        .insert(milestone)
        .select()
        .single();

    if (error) {
        throw new Error('Failed to create milestone');
    }

    return data;
};

// Hook to create a new milestone
export const useCreateMilestone = (currentWorkspace, project_id = null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createMilestone,
        onSuccess: (data) => {
            // Invalidate and refetch the milestone query for the workspace
            queryClient.invalidateQueries(['milestones', currentWorkspace?.workspace_id]);

            // If project_id is provided, also invalidate the specific project query
            if (project_id) {
                queryClient.invalidateQueries([
                    'milestones',
                    currentWorkspace?.workspace_id,
                    project_id,
                ]);
            }

            // If the created milestone has a project_id, invalidate that specific project query too
            const createdMilestone = data?.[0];
            if (createdMilestone?.project_id && createdMilestone.project_id !== project_id) {
                queryClient.invalidateQueries([
                    'milestones',
                    currentWorkspace?.workspace_id,
                    createdMilestone.project_id,
                ]);
            }
        },
    });
};

// Function to update a milestone
const updateMilestone = async ({ milestoneId, updates }) => {
    const { error } = await supabaseClient.from('milestones').update(updates).eq('id', milestoneId);

    if (error) {
        throw new Error('Failed to update milestone');
    }
};

// Hook to update a milestone
export const useUpdateMilestone = (currentWorkspace, project_id = null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateMilestone,
        onError: (error) => {
            console.error('Error updating milestones:', error);
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch the milestones query for the workspace
            queryClient.invalidateQueries(['milestones', currentWorkspace?.workspace_id]);

            // If project_id is provided, also invalidate the specific project query
            if (project_id) {
                queryClient.invalidateQueries([
                    'milestones',
                    currentWorkspace?.workspace_id,
                    project_id,
                ]);
            }

            // If the updated milestone has updates.project_id, invalidate that specific project query too
            if (variables?.updates?.project_id && variables.updates.project_id !== project_id) {
                queryClient.invalidateQueries([
                    'milestones',
                    currentWorkspace?.workspace_id,
                    variables.updates.project_id,
                ]);
            }
        },
    });
};

// Function to delete a milestone
const deleteMilestone = async ({ milestoneId }) => {
    const { error } = await supabaseClient.from('milestones').delete().eq('id', milestoneId);

    if (error) {
        throw new Error('Failed to delete milestone');
    }
};

// Hook to delete a milestone
export const useDeleteMilestone = (currentWorkspace, project_id = null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ milestoneId }) => deleteMilestone({ milestoneId }),
        onError: (error) => {
            console.error('Error deleting milestone:', error);
        },
        onSuccess: () => {
            // Invalidate and refetch the milestones query for the workspace
            queryClient.invalidateQueries(['milestones', currentWorkspace?.workspace_id]);

            // If project_id is provided, also invalidate the specific project query
            if (project_id) {
                queryClient.invalidateQueries([
                    'milestones',
                    currentWorkspace?.workspace_id,
                    project_id,
                ]);
            }
        },
    });
};
