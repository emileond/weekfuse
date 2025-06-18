import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

const fetchTickTickProject = async ({ projectId, user_id, workspace_id }) => {
    if (!projectId || !user_id || !workspace_id) {
        throw new Error('Missing required parameters');
    }
    console.log(projectId);
    if (projectId?.includes('inbox')) {
        return {
            name: 'inbox',
        };
    } else {
        const response = await ky
            .get(`/api/ticktick/project/${projectId}`, {
                searchParams: { user_id, workspace_id },
            })
            .json();

        if (!response.success) {
            throw new Error(response.error || 'Failed to fetch TickTick project');
        }
        return response.project;
    }
};

export const useTickTickProject = ({ projectId, user_id, workspace_id }) => {
    return useQuery({
        queryKey: ['ticktick', 'project', projectId],
        queryFn: () => fetchTickTickProject({ projectId, user_id, workspace_id }),
        enabled: !!projectId && !!user_id && !!workspace_id,
        staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
        refetchOnWindowFocus: true, // Refetch when user comes back to the window
    });
};
