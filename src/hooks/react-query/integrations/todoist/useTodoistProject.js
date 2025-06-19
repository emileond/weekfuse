import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

const fetchTodoistProject = async ({ projectId, user_id, workspace_id }) => {
    if (!projectId || !user_id || !workspace_id) {
        throw new Error('Missing required parameters');
    }
    
    const response = await ky
        .get(`/api/todoist/project/${projectId}`, {
            searchParams: { user_id, workspace_id },
        })
        .json();

    if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Todoist project');
    }
    return response.project;
};

export const useTodoistProject = ({ projectId, user_id, workspace_id }) => {
    return useQuery({
        queryKey: ['todoist', 'project', projectId],
        queryFn: () => fetchTodoistProject({ projectId, user_id, workspace_id }),
        enabled: !!projectId && !!user_id && !!workspace_id,
        staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
        refetchOnWindowFocus: true, // Refetch when user comes back to the window
    });
};