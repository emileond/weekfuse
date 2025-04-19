import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Chip, Link } from '@heroui/react';
import { RiExternalLinkLine, RiKanbanView2, RiListUnordered } from 'react-icons/ri';
import { colorContrast } from '../../../../utils/colorContrast.js';
import { useTrelloCardDetails } from '../../../../hooks/react-query/integrations/trello/useTrelloCardDetails';
import { formatDate } from '../../../../utils/dateUtils.js';

const TrelloTaskDetails = ({ external_data }) => {
    // Check if due date has passed
    const isDueDatePassed = (dueDate) => {
        if (!dueDate) return false;
        const now = new Date();
        const due = new Date(dueDate);
        return due < now;
    };
    const [currentWorkspace] = useCurrentWorkspace();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    // Fetch card details (board, list)
    const { data: cardDetails, isLoading: isLoadingCardDetails } = useTrelloCardDetails(
        external_data?.id,
        currentWorkspace?.workspace_id,
    );

    function trelloColorToTailwind(color) {
        switch (color?.toLowerCase()) {
            case 'yellow':
                return '#fcc800';
            case 'purple':
                return '#9353D3';
            case 'blue':
                return '#338EF7';
            case 'red':
                return '#F54180';
            case 'green':
                return '#45D483';
            case 'orange':
                return '#ff8904';
            case 'black':
                return '#99a1af'; // Tailwind doesn't have 'black-100'; using 'gray-100' as an alternative
            case 'sky':
                return '#00bcff';
            case 'pink':
                return '#FF71D7';
            case 'lime':
                return '#9ae600';
            default:
                return '#90a1b9'; // Fallback for undefined or unexpected colors
        }
    }

    const handleTransition = async (transitionId) => {
        setIsLoading(true);
        try {
            // await transitionIssue({
            //     issueIdOrKey: external_data?.id,
            //     transitionId,
            //     workspace_id: currentWorkspace?.workspace_id,
            // });
            toast.success('Jira status updated');
            await queryClient.cancelQueries({
                queryKey: ['tasks'],
            });

            await queryClient.invalidateQueries({
                queryKey: ['tasks'],
                refetchType: 'all',
            });
            await queryClient.invalidateQueries({
                queryKey: ['backlogTasks'],
                refetchType: 'all',
            });
        } catch (error) {
            toast.error(error.message || 'Failed to update jira status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {cardDetails?.board && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Board</label>
                    <Chip
                        color="default"
                        className="text-default-700"
                        size="sm"
                        variant="bordered"
                        startContent={<RiKanbanView2 fontSize=".9rem" />}
                        endContent={<RiExternalLinkLine fontSize=".9rem" />}
                    >
                        <Link
                            className="text-sm text-default-700"
                            isExternal
                            href={cardDetails.board.url}
                        >
                            {cardDetails.board.name}
                        </Link>
                    </Chip>
                </div>
            )}

            {cardDetails?.list && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">List</label>
                    <Chip
                        color="default"
                        className="text-default-700"
                        size="sm"
                        variant="bordered"
                        startContent={<RiListUnordered fontSize=".9rem" />}
                    >
                        {cardDetails.list.name}
                    </Chip>
                </div>
            )}
            {!!external_data?.labels?.length && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Labels</label>
                    <div className="flex flex-wrap gap-1">
                        {external_data?.labels?.map((label) => (
                            <Chip
                                key={label.id}
                                size="sm"
                                style={
                                    label?.color && {
                                        background: trelloColorToTailwind(label.color),
                                        color: colorContrast(
                                            trelloColorToTailwind(label.color),
                                            'y',
                                        ),
                                    }
                                }
                            >
                                {label.name}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}
            {!!external_data?.due && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Due date</label>
                    <div className="flex flex-wrap gap-1 items-center">
                        {formatDate(external_data?.due, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        })}
                        {isDueDatePassed(external_data?.due) && (
                            <Chip color="danger" size="sm" className="ml-2" variant="flat">
                                overdue
                            </Chip>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default TrelloTaskDetails;
