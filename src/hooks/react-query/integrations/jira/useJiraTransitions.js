import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'ky';

const fetchTransitions = async ({ issueIdOrKey, workspace_id }) => {
    if (!issueIdOrKey || !workspace_id) {
        throw new Error('Missing required parameters: issueIdOrKey or workspace_id');
    }

    const response = await ky
        .get(`/api/jira/transitions`, {
            searchParams: {
                issueIdOrKey,
                workspace_id,
            },
        })
        .json();

    if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Jira transitions');
    }

    return response.transitions;
};

export const useJiraTransitions = (issueId, workspace_id) => {
    return useQuery({
        queryKey: ['jira', 'transitions', issueId],
        queryFn: () =>
            fetchTransitions({
                issueIdOrKey: issueId,
                workspace_id,
            }),
        enabled: !!issueId && !!workspace_id,
        refetchOnMount: true,
    });
};

const transitionIssue = async ({ issueIdOrKey, transitionId, workspace_id }) => {
    if (!issueIdOrKey || !transitionId || !workspace_id) {
        throw new Error('Missing required parameters: issueIdOrKey, transitionId, or workspace_id');
    }

    const response = await ky
        .post(`/api/jira/transitions`, {
            json: {
                issueIdOrKey,
                transitionId,
                workspace_id,
            },
        })
        .json();

    if (!response.success) {
        throw new Error(response.error || 'Failed to transition Jira issue');
    }

    return response;
};

export const useJiraTransitionIssue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: transitionIssue,
        onSuccess: (_, variables) => {
            // Invalidate the transitions query for this issue
            queryClient.invalidateQueries({
                queryKey: ['jira', 'transitions', variables.issueIdOrKey],
            });

            // Also invalidate any task queries that might be affected
            queryClient.invalidateQueries({
                queryKey: ['tasks'],
                exact: false,
            });
        },
    });
};
