import { Checkbox, Spinner } from '@heroui/react';
import {
    useTrelloChecklists,
    useUpdateTrelloChecklistItem,
} from '../../../../hooks/react-query/integrations/trello/useTrelloChecklists.js';
import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';

const TrelloTaskDescription = ({ external_data }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: checklists, isLoading: isLoadingChecklists } = useTrelloChecklists(
        external_data?.id,
        currentWorkspace?.workspace_id,
    );
    const { mutate: updateChecklistItem } = useUpdateTrelloChecklistItem();

    // Handle checklist item update
    const handleChecklistItemUpdate = (cardId, checklistId, checkItemId, currentState) => {
        const newState = currentState === 'complete' ? 'incomplete' : 'complete';
        updateChecklistItem({
            cardId,
            checklistId,
            checkItemId,
            state: newState,
            workspace_id: currentWorkspace?.workspace_id,
        });
    };

    return (
        <>
            {isLoadingChecklists ? (
                <div className="flex justify-center py-4">
                    <Spinner size="sm" />
                </div>
            ) : (
                checklists?.length > 0 && (
                    <div className="flex flex-col gap-3 mt-2">
                        {checklists.map((checklist) => (
                            <div key={checklist.id} className="flex flex-col gap-2">
                                <div className="text-sm font-medium">{checklist.name}</div>
                                <div className="flex flex-col gap-1">
                                    {checklist.checkItems.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                            <Checkbox
                                                isSelected={item.state === 'complete'}
                                                onValueChange={() =>
                                                    handleChecklistItemUpdate(
                                                        external_data?.id,
                                                        checklist.id,
                                                        item.id,
                                                        item.state,
                                                    )
                                                }
                                            />
                                            <span
                                                className={
                                                    item.state === 'complete'
                                                        ? 'line-through text-gray-500'
                                                        : ''
                                                }
                                            >
                                                {item.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </>
    );
};

export default TrelloTaskDescription;
