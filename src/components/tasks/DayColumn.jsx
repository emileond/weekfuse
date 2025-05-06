import { Button, useDisclosure } from '@heroui/react';
import { RiAddLine } from 'react-icons/ri';
import DraggableList from './DraggableList.jsx';
import dayjs from 'dayjs';
import { useState } from 'react';
import NewTaskModal from './NewTaskModal.jsx';
import { useTasks } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';

const DayColumn = ({ day }) => {
    const [currentWorkspace] = useCurrentWorkspace();

    const startDate = dayjs(day)?.startOf('day').toISOString();
    const endDate = dayjs(day)?.endOf('day').toISOString();

    const { data: tasks } = useTasks(currentWorkspace, {
        startDate,
        endDate,
    });

    const [newTaskDate, setNewTaskDate] = useState(null);
    const { isOpen, onOpenChange } = useDisclosure();

    const handleNewTask = (dateStr) => {
        setNewTaskDate(dayjs(dateStr));
        onOpenChange();
    };

    const dateStr = day.format('YYYY-MM-DD');
    const isToday = day.isSame(dayjs(), 'day');

    return (
        <>
            <NewTaskModal isOpen={isOpen} onOpenChange={onOpenChange} defaultDate={newTaskDate} />
            <div
                key={dateStr}
                className={`flex flex-col gap-2 bg-content1 border-1 rounded-xl p-2  min-w-[250px] w-[75vw] sm:w-[50vw] md:w-[20vw] lg:w-[12vw] md flex-shrink-0 snap-center overflow-y-hidden`}
            >
                <div
                    className={`p-2 border-b-2 ${isToday ? 'border-secondary' : 'border-default'}`}
                >
                    <div className="font-semibold">{day.format('dddd')}</div>
                    <div className="text-sm text-default-500">{day.format('MMM D')}</div>
                </div>
                <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    startContent={<RiAddLine />}
                    className="justify-start"
                    onPress={() => handleNewTask(dateStr)}
                >
                    Add task
                </Button>
                {tasks && <DraggableList id={dateStr} items={tasks} group="tasks" smallCards />}
            </div>
        </>
    );
};

export default DayColumn;
