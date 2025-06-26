import DraggableList from './DraggableList.jsx';
import { Chip } from '@heroui/react';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import { useUpdateMultipleTasks } from '../../hooks/react-query/tasks/useTasks.js';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { taskCompletedMessages } from '../../utils/toast-messages/taskCompleted.js';
import { RiCheckboxCircleFill } from 'react-icons/ri';

const KanbanView = ({ items }) => {
    // Get current workspace and update function
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateMultipleTasks } = useUpdateMultipleTasks(currentWorkspace);

    // Local state for tasks in each column
    const [todoItems, setTodoItems] = useState([]);
    const [inProgressItems, setInProgressItems] = useState([]);
    const [doneItems, setDoneItems] = useState([]);

    // Update local state when todayTasks changes
    useEffect(() => {
        if (items) {
            setTodoItems(items.filter((item) => item.status === 'pending'));
            setInProgressItems(items.filter((item) => item.status === 'in progress'));
            setDoneItems(items.filter((item) => item.status === 'completed'));
        }
    }, [items]);

    const handleDragEnd = async (e, startCol) => {
        // Get the target column ID
        const endCol = e.parent.el.id;

        // Get the dragged item
        const itemId = e?.draggedNode?.data?.value?.id;
        const draggedItem = e?.draggedNode?.data?.value;

        // Map column ID to kanban_status value
        let status;

        if (endCol === 'todo') {
            status = 'pending';
        } else if (endCol === 'in-progress') {
            status = 'in progress';
        } else if (endCol === 'done') {
            status = 'completed';
        }

        // If no valid status was determined, return
        if (!status) return;

        // Optimistically update the local state
        const updatedValues = e.values.map((item, index) => ({
            ...item,
            status,
            order: index,
        }));

        // Determine which column the item was dragged from
        let sourceColumn;
        if (startCol === 'todo') {
            sourceColumn = todoItems;
            setTodoItems(todoItems.filter((item) => item.id !== draggedItem.id));
        } else if (startCol === 'in-progress') {
            sourceColumn = inProgressItems;
            setInProgressItems(inProgressItems.filter((item) => item.id !== draggedItem.id));
        } else if (startCol === 'done') {
            sourceColumn = doneItems;
            setDoneItems(doneItems.filter((item) => item.id !== draggedItem.id));
        }

        // Update the target column
        if (endCol === 'todo') {
            setTodoItems(updatedValues);
        } else if (endCol === 'in-progress') {
            setInProgressItems(updatedValues);
        } else if (endCol === 'done') {
            setDoneItems(updatedValues);
        }

        // Update all tasks in the target column to maintain order
        try {
            await updateMultipleTasks({
                tasks: updatedValues.map((item, index) => ({
                    taskId: item.id,
                    updates: {
                        status,
                        order: index,
                    },
                })),
                startCol: dayjs().startOf('day').toISOString(),
                endCol: dayjs().endOf('day').toISOString(),
            });

            // Display a toast message when an item is dragged to the "done" column
            if (endCol === 'done') {
                const randomMessage =
                    taskCompletedMessages[Math.floor(Math.random() * taskCompletedMessages.length)];
                toast.success(randomMessage.message, {
                    duration: 5000,
                    icon: randomMessage?.icon || (
                        <RiCheckboxCircleFill className="text-success" fontSize="2rem" />
                    ),
                    style: {
                        fontWeight: 500,
                    },
                });
            }
        } catch (error) {
            console.error('Error updating tasks:', error);
            // Revert to the original state if there's an error
            if (startCol === 'todo') {
                setTodoItems(sourceColumn);
            } else if (startCol === 'in-progress') {
                setInProgressItems(sourceColumn);
            } else if (startCol === 'done') {
                setDoneItems(sourceColumn);
            }
        }
    };

    return (
        <div className="flex gap-3 h-[calc(100vh-216px)]">
            <div className="basis-1/3 flex flex-col h-full bg-content2 rounded-2xl p-2 gap-2">
                <div className="py-1 mb-1">
                    <Chip variant="flat" size="sm">
                        To do
                    </Chip>
                </div>
                <DraggableList
                    id="todo"
                    group="kanban"
                    items={todoItems}
                    smallCards
                    onDragEnd={handleDragEnd}
                />
            </div>
            <div className="basis-1/3 flex flex-col h-full bg-content2 rounded-2xl p-2 gap-2">
                <div className="py-1 mb-1">
                    <Chip variant="flat" size="sm" color="primary">
                        In progress
                    </Chip>
                </div>
                <DraggableList
                    id="in-progress"
                    group="kanban"
                    items={inProgressItems}
                    smallCards
                    onDragEnd={handleDragEnd}
                />
            </div>
            <div className="basis-1/3 flex flex-col h-full bg-content2 rounded-2xl p-2 gap-2">
                <div className="py-1 mb-1">
                    <Chip variant="flat" size="sm" color="success">
                        Done
                    </Chip>
                </div>
                <DraggableList
                    id="done"
                    group="kanban"
                    items={doneItems}
                    smallCards
                    onDragEnd={handleDragEnd}
                />
            </div>
        </div>
    );
};

export default KanbanView;
