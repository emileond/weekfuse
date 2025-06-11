import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

const fetchJiraIssue = async ({ issueIdOrKey, user_id, workspace_id }) => {
    if (!issueIdOrKey || !user_id || !workspace_id) {
        throw new Error('Missing required parameters');
    }
    const response = await ky
        .get(`/api/jira/issue/${issueIdOrKey}`, {
            searchParams: { user_id, workspace_id },
        })
        .json();

    if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Jira issue');
    }
    return response.issue;
};

export const useJiraIssue = ({ issueIdOrKey, user_id, workspace_id }) => {
    return useQuery({
        queryKey: ['jira', 'issue', issueIdOrKey],
        queryFn: () => fetchJiraIssue({ issueIdOrKey, user_id, workspace_id }),
        enabled: !!issueIdOrKey && !!user_id && !!workspace_id,
        staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
        refetchOnWindowFocus: true, // Refetch when user comes back to the window
    });
};
