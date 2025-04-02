import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

// Fetch tasks for a specific workspace
const fetchTasks = async ({ statusList, id, workspace_id, startDate, endDate }) => {
    let query = supabaseClient.from('tasks').select('*').eq('workspace_id', workspace_id);

    if (id) {
        query = query.eq('id', id).single(); // Fetch single item
    } else {
        if (statusList) {
            query = query.in('status', statusList); // Filter by status
        }

        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate); // Filter by date range
        }

        if (!startDate && endDate) {
            query = query.lte('date', endDate); // Filter by date range
        }
        query = query.order('order');
    }

    const { data, error } = await query;

    if (error) {
        throw new Error('Failed to fetch tasks');
    }

    return data;
};

// Hook to fetch tasks with optional filters
export const useTasks = (currentWorkspace, filters = {}) => {
    return useQuery({
        queryKey: ['tasks', currentWorkspace?.workspace_id, filters],
        queryFn: () =>
            fetchTasks({
                workspace_id: currentWorkspace?.workspace_id,
                statusList: filters.statusList,
                startDate: filters.startDate,
                endDate: filters.endDate,
            }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!currentWorkspace?.workspace_id, // Only fetch if workspace_id is provided
    });
};

const fetchBacklogTasks = async ({ workspace_id }) => {
    let query = supabaseClient
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspace_id)
        .is('date', null)
        .eq('status', 'pending')
        .order('order');

    const { data, error } = await query;

    if (error) {
        throw new Error('Failed to fetch tasks');
    }

    return data;
};

// Hook to fetch all tasks for a given workspace
export const useBacklogTasks = (currentWorkspace) => {
    return useQuery({
        queryKey: ['backlogTasks', currentWorkspace?.workspace_id],
        queryFn: () =>
            fetchBacklogTasks({
                workspace_id: currentWorkspace?.workspace_id,
            }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!currentWorkspace?.workspace_id, // Only fetch if workspace_id is provided
    });
};

// Function to create a new task
const createTask = async ({ task }) => {
    const { error } = await supabaseClient.from('tasks').insert(task);

    if (error) {
        throw new Error('Failed to create task');
    }
};

// Hook to create a new task
export const useCreateTask = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            // Invalidate and refetch the tasks query for the workspace
            queryClient.invalidateQueries(['tasks', currentWorkspace?.workspace_id]);
            queryClient.invalidateQueries(['backlogTasks', currentWorkspace?.workspace_id]);
        },
    });
};

// Function to update a task
const updateTask = async ({ taskId, updates }) => {
    const { error } = await supabaseClient.from('tasks').update(updates).eq('id', taskId);

    if (error) {
        throw new Error('Failed to update task');
    }
};

// Hook to update a task
export const useUpdateTask = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateTask,
        onError: (error) => {
            console.error('Error updating task:', error);
        },
        onSuccess: () => {
            // Invalidate and refetch the tasks query for the workspace
            queryClient.invalidateQueries(['tasks', currentWorkspace?.workspace_id]);
            queryClient.invalidateQueries(['backlogTasks', currentWorkspace?.workspace_id]);
        },
    });
};

// Function to update multiple tasks
const updateMultipleTasks = async (tasks) => {
    const updates = tasks.map((task) =>
        supabaseClient.from('tasks').update(task.updates).eq('id', task.taskId),
    );

    // Execute all updates concurrently
    const results = await Promise.all(updates);

    // Handle errors if any
    results.forEach((result, index) => {
        if (result.error) {
            console.error(`Failed to update task ${tasks[index].taskId}`, result.error);
        }
    });
};

// Hook to update multiple tasks
export const useUpdateMultipleTasks = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateMultipleTasks,
        onError: (error) => {
            console.error('Error updating tasks:', error);
        },
        onSuccess: () => {
            // Invalidate and refetch the tasks query for the workspace
            queryClient.invalidateQueries(['tasks', currentWorkspace?.workspace_id]);
            queryClient.invalidateQueries(['backlogTasks', currentWorkspace?.workspace_id]);
        },
    });
};

// Function to delete a task
const deleteTask = async ({ taskId }) => {
    const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);

    if (error) {
        throw new Error('Failed to delete task');
    }
};

// Hook to delete a task
export const useDeleteTask = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId }) => deleteTask({ taskId }),
        onError: (error) => {
            console.error('Error deleting task:', error);
        },
        onSuccess: () => {
            // Invalidate and refetch the tasks query for the workspace
            queryClient.invalidateQueries(['tasks', currentWorkspace?.workspace_id]);
            queryClient.invalidateQueries(['backlogTasks', currentWorkspace?.workspace_id]);
        },
    });
};
