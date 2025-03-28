import { animations } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/react';
import TaskCard from './TaskCard.jsx';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import { useUpdateMultipleTasks } from '../../hooks/react-query/tasks/useTasks.js';
import dayjs from 'dayjs'; // Import dayjs to handle date/time manipulation
import timezone from 'dayjs/plugin/timezone'; // For handling time zones
import utc from 'dayjs/plugin/utc'; // For working with UTC dates

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const DraggableList = ({ id, items, group, smallCards }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateMultipleTasks } = useUpdateMultipleTasks(currentWorkspace);

    const [listRef, state] = useDragAndDrop(items, {
        group,
        plugins: [animations()],
        onDragend: async (e) => {
            const columnItems = e.values; // The items in the target column
            const newDate = e.parent.el.id; // The target list (backlog or a date)

            // If the target list is valid (a date column)
            let updatedDate = null;
            if (dayjs(newDate).isValid()) {
                updatedDate = dayjs(newDate)
                    .startOf('day')
                    .tz(dayjs.tz.guess(), true)
                    .toISOString(); // Set the new date in UTC
            }

            // Prepare the tasks to be updated
            const tasksToUpdate = columnItems.map((item, index) => ({
                taskId: item.id,
                updates: {
                    date: updatedDate, // The new date for the task
                    order: index, // The unique order value based on its position in the column
                },
            }));

            // Call the bulk update function
            try {
                await updateMultipleTasks(tasksToUpdate);
                console.log('All tasks updated successfully');
            } catch (error) {
                console.error('Error updating tasks:', error);
            }
        },
    });

    return (
        <ul id={id} ref={listRef} className="flex flex-col gap-2 w-full h-full">
            {state.map((item) => (
                <TaskCard key={item.id} task={item} isDnD={smallCards && true} />
            ))}
        </ul>
    );
};

export default DraggableList;
