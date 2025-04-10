import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

// Fetch projects for a specific workspace
const fetchProjects = async ({ workspace_id }) => {
    const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('workspace_id', workspace_id);
    if (error) {
        throw new Error('Failed to fetch projects');
    }

    return data;
};

// Hook to fetch projects
export const useProjects = (currentWorkspace = {}) => {
    return useQuery({
        queryKey: ['projects', currentWorkspace?.workspace_id],
        queryFn: () =>
            fetchProjects({
                workspace_id: currentWorkspace?.workspace_id,
            }),
        staleTime: 1000 * 60 * 15, // 15 minutes
        enabled: !!currentWorkspace?.workspace_id, // Only fetch if workspace_id is provided
    });
};

const fetchTaskCountByProject = async ({ project_id }) => {
    const { data, error } = await supabaseClient.rpc('get_project_task_counts', {
        p_project_id: project_id,
    });

    if (error) {
        throw new Error('Error fetching task count:', error);
    }

    return data;
};

// Hook to fetch task count
export const useTaskCountByProject = (project_id) => {
    return useQuery({
        queryKey: ['taskCountByProject', project_id],
        queryFn: () =>
            fetchTaskCountByProject({
                project_id: project_id,
            }),
        staleTime: 1000 * 60 * 15, // 15 minutes
        enabled: !!project_id, // Only fetch if workspace_id is provided
    });
};

// Function to create a new project
const createProject = async ({ project }) => {
    const { data, error } = await supabaseClient.from('projects').insert(project).select().single();

    if (error) {
        throw new Error('Failed to create project');
    }

    return data;
};

// Hook to create a new project
export const useCreateProject = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            // Invalidate and refetch the projects query for the workspace
            queryClient.invalidateQueries(['projects', currentWorkspace?.workspace_id]);
        },
    });
};

// Function to update a project
const updateProject = async ({ projectId, updates }) => {
    const { error } = await supabaseClient.from('projects').update(updates).eq('id', projectId);

    if (error) {
        throw new Error('Failed to update project');
    }
};

// Hook to update a project
export const useUpdateProject = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProject,
        onError: (error) => {
            console.error('Error updating projects:', error);
        },
        onSuccess: () => {
            // Invalidate and refetch the projects query for the workspace
            queryClient.invalidateQueries(['projects', currentWorkspace?.workspace_id]);
        },
    });
};

// Function to delete a project
const deleteProject = async ({ projectId }) => {
    const { error } = await supabaseClient.from('projects').delete().eq('id', projectId);

    if (error) {
        throw new Error('Failed to delete project');
    }
};

// Hook to delete a project
export const useDeleteProject = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId }) => deleteProject({ projectId }),
        onError: (error) => {
            console.error('Error deleting project:', error);
        },
        onSuccess: () => {
            // Invalidate and refetch the projects query for the workspace
            queryClient.invalidateQueries(['projects', currentWorkspace?.workspace_id]);
        },
    });
};
