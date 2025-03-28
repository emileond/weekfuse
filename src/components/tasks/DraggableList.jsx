import { useDragAndDrop } from '@formkit/drag-and-drop/react';
import TaskCard from './TaskCard.jsx';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import { useUpdateTask } from '../../hooks/react-query/tasks/useTasks.js';
import dayjs from 'dayjs'; // Import dayjs to handle date/time manipulation
import timezone from 'dayjs/plugin/timezone'; // For handling time zones
import utc from 'dayjs/plugin/utc'; // For working with UTC dates

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const DraggableList = ({ id, items, group }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateTask } = useUpdateTask(currentWorkspace);

    const [listRef, state] = useDragAndDrop(items, {
        group,
        onDragend: async (e) => {
            const taskId = e.draggedNode.data.value.id;
            const currentDate = e.draggedNode.data.value.date;
            const newDate = e.parent.el.id;

            // Compare currentDate and newDate (ignoring time)
            const currentDateFormatted = dayjs(currentDate).startOf('day').format('YYYY-MM-DD');
            const newDateFormatted = dayjs(newDate).startOf('day').format('YYYY-MM-DD');

            // Skip update if the task is moved to the same date
            if (currentDateFormatted === newDateFormatted) {
                return; // Early exit
            }

            try {
                let updatedDate;

                if (newDate === 'backlog') {
                    updatedDate = null;
                } else {
                    // Convert the new date (from target column) to UTC
                    updatedDate = dayjs(newDate)
                        .startOf('day')
                        .tz(dayjs.tz.guess(), true)
                        .toISOString();
                }

                await updateTask({
                    taskId, // ID of the task to update
                    updates: {
                        date: updatedDate, // Save the new date in UTC format
                    },
                });
            } catch (error) {
                console.error('Error updating task date:', error);
            }
        },
    });

    return (
        <ul id={id} ref={listRef} className="flex flex-col gap-2 w-full h-full">
            {state.map((item) => (
                <TaskCard key={item.id} task={item} isDnD />
            ))}
        </ul>
    );
};

export default DraggableList;
