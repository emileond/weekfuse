import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

const fetchCardDetails = async ({ cardId, workspace_id }) => {
    if (!cardId || !workspace_id) {
        throw new Error('Missing required parameters: cardId or workspace_id');
    }

    const response = await ky
        .get(`/api/trello/card-details`, {
            searchParams: {
                cardId,
                workspace_id,
            },
        })
        .json();

    if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Trello card details');
    }

    return {
        card: response.card,
        board: response.board,
        list: response.list,
    };
};

export const useTrelloCardDetails = (cardId, workspace_id) => {
    return useQuery({
        queryKey: ['trello', 'card-details', cardId],
        queryFn: () =>
            fetchCardDetails({
                cardId,
                workspace_id,
            }),
        enabled: !!cardId && !!workspace_id,
        refetchOnMount: true,
    });
};