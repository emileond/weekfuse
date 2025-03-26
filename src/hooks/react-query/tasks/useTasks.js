import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseClient } from '../../../lib/supabase'

// Fetch tasks for a specific workspace
const fetchTasks = async (statusList, id, workspace_id) => {

    let query = supabaseClient.from('tasks').select('*').eq('workspace_id', workspace_id)

    if (id) {
        query = query.eq('id', id).single(); // Fetch single item
    } else if (statusList) {
        query = query.in('status', statusList); // Fetch multiple items
    }

    const { data, error } = await query;

    if (error) {
        throw new Error('Failed to fetch tasks')
    }

    return data
}

// Hook to fetch all tasks for a given workspace
export const useTasks = (currentWorkspace) => {
    return useQuery({
        queryKey: ['tasks', currentWorkspace?.workspace_id],
        queryFn: () => fetchTasks(currentWorkspace?.workspace_id),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!currentWorkspace?.workspace_id, // Only fetch if teamId is provided
    })
}

// Function to create a new task
const createTask = async ({ task }) => {
    const { error } = await supabaseClient.from('tasks').insert(task)

    if (error) {
        throw new Error('Failed to create task')
    }

}

// Hook to create a new task
export const useCreateTask = (currentWorkspace) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            // Invalidate and refetch the tasks query for the workspace
            queryClient.invalidateQueries([
                'tasks',
                currentWorkspace?.workspace_id,
            ])
        },
    })
}

// Function to update a task
const updateTask = async ({ taskId, updates }) => {
    const { error } = await supabaseClient
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

    if (error) {
        throw new Error('Failed to update task')
    }
}

// Hook to update a task
export const useUpdateTask = (currentWorkspace) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateTask,
        onError: (error) => {
            console.error('Error updating task:', error)
        },
        onSuccess: () => {
            // Invalidate and refetch the tasks query for the workspace
            queryClient.invalidateQueries([
                'tasks',
                currentWorkspace?.workspace_id,
            ])
        },
    })
}

// Function to delete a task
const deleteTask = async ({ taskId }) => {
    const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId)

    if (error) {
        throw new Error('Failed to delete task')
    }
}

// Hook to delete a task
export const useDeleteTask = (currentWorkspace) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ taskId }) => deleteTask({ taskId }),
        onError: (error) => {
            console.error('Error deleting task:', error)
        },
        onSuccess: () => {
            // Invalidate and refetch the tasks query for the workspace
            queryClient.invalidateQueries([
                'tasks',
                currentWorkspace?.workspace_id,
            ])
        },
    })
}
