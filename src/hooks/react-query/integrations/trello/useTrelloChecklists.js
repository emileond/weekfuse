import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'ky';

const fetchChecklists = async ({ cardId, workspace_id }) => {
    if (!cardId || !workspace_id) {
        throw new Error('Missing required parameters: cardId or workspace_id');
    }

    const response = await ky
        .get(`/api/trello/checklists`, {
            searchParams: {
                cardId,
                workspace_id,
            },
        })
        .json();

    if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Trello checklists');
    }

    return response.checklists;
};

export const useTrelloChecklists = (cardId, workspace_id) => {
    return useQuery({
        queryKey: ['trello', 'checklists', cardId],
        queryFn: () =>
            fetchChecklists({
                cardId,
                workspace_id,
            }),
        enabled: !!cardId && !!workspace_id,
        refetchOnMount: true,
    });
};

const updateChecklistItem = async ({ cardId, checklistId, checkItemId, state, workspace_id }) => {
    if (!cardId || !checklistId || !checkItemId || !state || !workspace_id) {
        throw new Error('Missing required parameters for updating checklist item');
    }

    const response = await ky
        .post(`/api/trello/checklists`, {
            json: {
                cardId,
                checklistId,
                checkItemId,
                state,
                workspace_id,
            },
        })
        .json();

    if (!response.success) {
        throw new Error(response.error || 'Failed to update Trello checklist item');
    }

    return response;
};

export const useUpdateTrelloChecklistItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateChecklistItem,
        onMutate: async (variables) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({
                queryKey: ['trello', 'checklists', variables.cardId],
            });

            // Snapshot the previous value
            const previousChecklists = queryClient.getQueryData([
                'trello',
                'checklists',
                variables.cardId,
            ]);

            // Optimistically update to the new value
            queryClient.setQueryData(
                ['trello', 'checklists', variables.cardId],
                (old) => {
                    if (!old) return old;

                    return old.map((checklist) => {
                        if (checklist.id === variables.checklistId) {
                            return {
                                ...checklist,
                                checkItems: checklist.checkItems.map((item) => {
                                    if (item.id === variables.checkItemId) {
                                        return {
                                            ...item,
                                            state: variables.state,
                                        };
                                    }
                                    return item;
                                }),
                            };
                        }
                        return checklist;
                    });
                }
            );

            // Return a context object with the snapshotted value
            return { previousChecklists };
        },
        onError: (err, variables, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousChecklists) {
                queryClient.setQueryData(
                    ['trello', 'checklists', variables.cardId],
                    context.previousChecklists
                );
            }
        },
        onSuccess: (_, variables) => {
            // Invalidate the checklists query for this card
            queryClient.invalidateQueries({
                queryKey: ['trello', 'checklists', variables.cardId],
            });

            // Also invalidate any task queries that might be affected
            queryClient.invalidateQueries({
                queryKey: ['tasks'],
                exact: false,
            });
        },
    });
};
