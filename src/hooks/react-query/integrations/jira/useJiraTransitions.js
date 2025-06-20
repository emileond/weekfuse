import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'ky';

const fetchTransitions = async ({ issueIdOrKey, user_id, workspace_id }) => {
    if (!issueIdOrKey || !workspace_id) {
        throw new Error('Missing required parameters: issueIdOrKey or workspace_id');
    }

    const response = await ky
        .get(`/api/jira/transitions`, {
            searchParams: {
                issueIdOrKey,
                user_id,
                workspace_id,
            },
        })
        .json();

    if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Jira transitions');
    }

    return response.transitions;
};

export const useJiraTransitions = ({ issueIdOrKey, user_id, workspace_id }) => {
    return useQuery({
        queryKey: ['jira', 'transitions', issueIdOrKey],
        queryFn: () =>
            fetchTransitions({
                issueIdOrKey,
                user_id,
                workspace_id,
            }),
        enabled: !!issueIdOrKey && !!workspace_id && !!user_id,
        refetchOnMount: true,
    });
};

const transitionIssue = async ({
    task_id,
    issueIdOrKey,
    transitionId,
    user_id,
    workspace_id,
    destinationCategory,
}) => {
    if (!task_id || !issueIdOrKey || !transitionId || !workspace_id) {
        throw new Error('Missing required parameters: issueIdOrKey, transitionId, or workspace_id');
    }

    const response = await ky
        .post(`/api/jira/transitions`, {
            json: {
                task_id,
                issueIdOrKey,
                transitionId,
                user_id,
                workspace_id,
                destinationCategory,
            },
            throwHttpErrors: false,
        })
        .json();

    if (!response.success) {
        throw new Error(response.error || 'An unknown error occurred during the transition.');
    }

    return response;
};

export const useJiraTransitionIssue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: transitionIssue,
        onSuccess: (_, variables) => {
            // Invalidate the transition query for this issue
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
