import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';
import dayjs from 'dayjs';

// Fetch tasks for a specific workspace
const fetchTasks = async ({
    statusList,
    id,
    workspace_id,
    startDate,
    endDate,
    project_id,
    milestone_id,
}) => {
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

        if (project_id) {
            query = query.eq('project_id', project_id); // Filter by project
        }

        if (milestone_id) {
            query = query.eq('milestone_id', milestone_id); // Filter by milestone
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
                project_id: filters.project_id,
                milestone_id: filters.milestone_id,
            }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!currentWorkspace, // Only fetch if workspace is provided
    });
};

const fetchBacklogTasks = async ({
    workspace_id,
    page = 1,
    pageSize = 20,
    project_id = null,
    milestone_id = null,
    tags = null,
    integration_source = null,
    priority = null,
}) => {
    // First, fetch only the count of tasks
    let countQuery = supabaseClient
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspace_id)
        .is('date', null)
        .eq('status', 'pending');

    // Apply additional filters to count query
    if (project_id) {
        countQuery = countQuery.eq('project_id', project_id);
    }

    if (milestone_id) {
        countQuery = countQuery.eq('milestone_id', milestone_id);
    }

    if (tags && tags.length > 0) {
        // For tags, we need to check if the task's tags array contains any of the selected tags
        countQuery = countQuery.contains('tags', tags);
    }

    if (integration_source) {
        countQuery = countQuery.eq('integration_source', integration_source);
    }

    if (priority) {
        countQuery = countQuery.eq('priority', priority);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
        throw new Error('Failed to fetch task count');
    }

    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Then fetch the actual tasks data
    let dataQuery = supabaseClient
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspace_id)
        .is('date', null)
        .eq('status', 'pending')
        .order('order')
        .range(from, to);

    // Apply the same filters to data query
    if (project_id) {
        dataQuery = dataQuery.eq('project_id', project_id);
    }

    if (milestone_id) {
        dataQuery = dataQuery.eq('milestone_id', milestone_id);
    }

    if (tags && tags.length > 0) {
        dataQuery = dataQuery.contains('tags', tags);
    }

    if (integration_source) {
        dataQuery = dataQuery.eq('integration_source', integration_source);
    }

    if (priority) {
        dataQuery = dataQuery.eq('priority', priority);
    }

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
        throw new Error('Failed to fetch tasks data');
    }

    return { data, count };
};

// Hook to fetch paginated backlog tasks for a given workspace
export const useBacklogTasks = (currentWorkspace, page = 1, pageSize = 20, filters = {}) => {
    return useQuery({
        queryKey: [
            'backlogTasks',
            currentWorkspace?.workspace_id,
            page,
            pageSize,
            filters.project_id,
            filters.milestone_id,
            filters.tags,
            filters.integration_source,
            filters.priority,
        ],
        queryFn: () =>
            fetchBacklogTasks({
                workspace_id: currentWorkspace?.workspace_id,
                page,
                pageSize,
                project_id: filters.project_id,
                milestone_id: filters.milestone_id,
                tags: filters.tags,
                integration_source: filters.integration_source,
                priority: filters.priority,
            }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!currentWorkspace?.workspace_id, // Only fetch if workspace_id is provided
    });
};

// Fetch counts per day in the range
async function fetchTaskCounts({ workspace_id, startDate, endDate }) {
    // we cast timestamp → date so we group by calendar date
    const { data, error } = await supabaseClient
        .from('tasks')
        .select(`date`, { head: false, count: 'exact' })
        .eq('workspace_id', workspace_id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    if (error) {
        console.error(error);
        throw error;
    }

    console.log(data);

    // data comes back as [{ day: "2025-05-05", count: "4" }, …]
    return data.reduce((acc, { day, count }) => {
        acc[day] = Number(count);
        return acc;
    }, {});
}

export function useTasksCount(currentWorkspace, { startDate, endDate }) {
    return useQuery({
        queryKey: ['tasks-count', currentWorkspace?.workspace_id, startDate, endDate],
        queryFn: () =>
            fetchTaskCounts({
                workspace_id: currentWorkspace.workspace_id,
                startDate,
                endDate,
            }),

        enabled: !!currentWorkspace?.workspace_id && !!startDate && !!endDate,
        staleTime: 1000 * 60 * 5,
    });
}

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
            // Invalidate all task-related queries for the workspace
            queryClient.invalidateQueries({
                queryKey: ['tasks'],
                refetchType: 'all',
            });
            queryClient.invalidateQueries({
                queryKey: ['backlogTasks'],
                refetchType: 'all',
            });
        },
    });
};

// Function to update a task
const updateTask = async ({ taskId, updates }) => {
    const { error } = await supabaseClient.from('tasks').update(updates).eq('id', taskId);

    if (error) {
        console.error(error);
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
            // Invalidate all task-related queries for the workspace
            queryClient.invalidateQueries({
                queryKey: ['tasks', currentWorkspace?.workspace_id],
                refetchType: 'all',
            });
            queryClient.invalidateQueries({
                queryKey: ['backlogTasks', currentWorkspace?.workspace_id],
                refetchType: 'all',
            });
        },
    });
};

// Function to update multiple tasks
const updateMultipleTasks = async ({ tasks, startCol, endCol }) => {
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

    // Return the columns that were affected for targeted invalidation
    return { startCol, endCol };
};

// Hook to update multiple tasks
export const useUpdateMultipleTasks = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateMultipleTasks,
        onError: (error) => {
            console.error('Error updating tasks:', error);
        },
        onSuccess: (result) => {
            const { startCol, endCol } = result;

            // Invalidate only the affected columns
            if (startCol === 'backlog' || endCol === 'backlog') {
                // Invalidate backlog queries if backlog is involved
                queryClient.invalidateQueries({
                    queryKey: ['backlogTasks', currentWorkspace?.workspace_id],
                    refetchType: 'all',
                });
            }

            // Invalidate start column queries if it's a date column
            if (startCol !== 'backlog' && startCol) {
                const startDate = dayjs(startCol).startOf('day').toISOString();
                const endDate = dayjs(startCol).endOf('day').toISOString();

                queryClient.invalidateQueries({
                    queryKey: ['tasks', currentWorkspace?.workspace_id, { startDate, endDate }],
                    refetchType: 'all',
                });
            }

            // Invalidate end column queries if it's a date column and different from start column
            if (endCol !== 'backlog' && endCol && endCol !== startCol) {
                const startDate = dayjs(endCol).startOf('day').toISOString();
                const endDate = dayjs(endCol).endOf('day').toISOString();

                queryClient.invalidateQueries({
                    queryKey: ['tasks', currentWorkspace?.workspace_id, { startDate, endDate }],
                    refetchType: 'all',
                });
            }
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
            // Invalidate all task-related queries for the workspace
            queryClient.invalidateQueries({
                queryKey: ['tasks', currentWorkspace?.workspace_id],
                refetchType: 'all',
            });
            queryClient.invalidateQueries({
                queryKey: ['backlogTasks', currentWorkspace?.workspace_id],
                refetchType: 'all',
            });
        },
    });
};

// Function to fuzzy search tasks
const fuzzySearchTasks = async ({ searchText, resultLimit = 20, statusFilter }) => {
    if (!searchText || searchText.trim() === '') {
        return { data: [] };
    }

    const { data, error } = await supabaseClient.rpc('fuzzy_search_tasks', {
        search_text: searchText,
        result_limit: resultLimit,
        status_filter: statusFilter,
    });

    if (error) {
        console.error('Error searching tasks:', error);
        throw new Error('Failed to search tasks');
    }

    return { data };
};

// Hook to fuzzy search tasks
export const useFuzzySearchTasks = (
    currentWorkspace,
    searchText,
    resultLimit = 20,
    statusFilter,
) => {
    return useQuery({
        queryKey: ['fuzzySearchTasks', currentWorkspace?.workspace_id, searchText, resultLimit],
        queryFn: () =>
            fuzzySearchTasks({
                searchText,
                resultLimit,
                statusFilter,
            }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!currentWorkspace?.workspace_id && !!searchText && searchText.trim() !== '', // Only fetch if workspace_id and searchText are provided
    });
};
