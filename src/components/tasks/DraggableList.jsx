'use client';
import { animations } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/react';
import TaskCard from './TaskCard.jsx';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import { useUpdateMultipleTasks } from '../../hooks/react-query/tasks/useTasks.js';
import dayjs from 'dayjs'; // Import dayjs to handle date/time manipulation
import timezone from 'dayjs/plugin/timezone'; // For handling time zones
import utc from 'dayjs/plugin/utc';
import { useEffect } from 'react';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const DraggableList = ({ id, items, group, smallCards }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateMultipleTasks } = useUpdateMultipleTasks(currentWorkspace);

    const [listRef, listItems, updateListItems] = useDragAndDrop(items, {
        group,
        dropZoneClass: 'bg-default text-default-500 opacity-30',
        plugins: [animations()],
        onDragend: async (e) => {
            // Ensure the dragged element's z-index is reset to 10
            if (e && e.draggedNode && e.draggedNode.el) {
                e.draggedNode.el.style.zIndex = 10;
            }
            const itemIndex = e?.draggedNode?.data.index;
            const itemId = e?.draggedNode?.data?.value?.id;
            const itemDate = e?.draggedNode?.data?.value?.date
                ? dayjs(e?.draggedNode?.data?.value?.date)
                      ?.tz(dayjs.tz.guess(), true)
                      ?.toISOString()
                : null;

            const columnItems = e.values; // The items in the target column
            const newDate = e.parent.el.id; // The target list (backlog or a date)

            // If the target list is valid (a date column)
            let updatedDate = null;
            if (dayjs(newDate).isValid()) {
                updatedDate = dayjs(newDate)
                    .startOf('day')
                    .tz(dayjs.tz.guess(), true)
                    .toISOString();
            }

            // if item date and target date are the same, return
            if (itemDate === updatedDate) return;

            let tasksToUpdate = null;

            // Prepare the tasks to be updated
            if (updatedDate) {
                // only update all items in the column if is a day col
                tasksToUpdate = columnItems.map((item, index) => ({
                    taskId: item.id,
                    updates: {
                        date: updatedDate,
                        order: index,
                    },
                }));
            } else {
                // otherwise is going to the backlog, so only update the dragged item
                tasksToUpdate = [
                    {
                        taskId: itemId,
                        updates: {
                            date: null,
                            order: itemIndex,
                        },
                    },
                ];
            }
            // Call the bulk update function
            try {
                await updateMultipleTasks(tasksToUpdate);
            } catch (error) {
                console.error('Error updating tasks:', error);
            }
        },
    });

    useEffect(() => {
        // if (listItems.length === items.length) return;
        updateListItems(items);
    }, [items]);

    return (
        <ul id={id} ref={listRef} className="flex flex-col gap-2 w-full h-full overflow-y-auto">
            {listItems?.map((item) => (
                <TaskCard key={item?.id} task={item} sm={smallCards && true} />
            ))}
        </ul>
    );
};

export default DraggableList;
