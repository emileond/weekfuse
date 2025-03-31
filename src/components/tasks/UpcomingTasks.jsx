import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { Button, useDisclosure } from '@heroui/react';
import { RiAddLine, RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri';
import BacklogPanel from './BacklogPanel.jsx';
import { useTasks } from '../../hooks/react-query/tasks/useTasks.js';
import DraggableList from './DraggableList.jsx';
import timezone from 'dayjs/plugin/timezone'; // Import the timezone plugin
import utc from 'dayjs/plugin/utc';
import NewTaskModal from './NewTaskModal.jsx'; // Import the UTC plugin

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const UpcomingTasks = () => {
    const [currentWorkspace] = useCurrentWorkspace();
    const [newTaskDate, setNewTaskDate] = useState(null);
    const { isOpen, onOpenChange } = useDisclosure();

    // Create an array of 37 days starting from today (current week + one month)
    const days = useMemo(() => {
        const result = [];
        for (let i = 0; i < 21; i++) {
            result.push(dayjs().add(i, 'day'));
        }
        return result;
    }, []);

    const startDate = days[0]?.startOf('day').toISOString();
    const endDate = days[days.length - 1]?.endOf('day').toISOString();

    const { data: tasks } = useTasks(currentWorkspace, {
        startDate,
        endDate,
    });

    const [isBacklogCollapsed, setIsBacklogCollapsed] = useState(false);

    const handleNewTask = (dateStr) => {
        setNewTaskDate(dayjs(dateStr));
        onOpenChange();
    };

    const [listKey, setListKey] = useState(null);

    useEffect(() => {
        setListKey(dayjs().toISOString());
    }, [tasks]);

    return (
        <div>
            <NewTaskModal isOpen={isOpen} onOpenChange={onOpenChange} defaultDate={newTaskDate} />
            <div className="flex justify-between mb-2">
                <p className="text-sm text-default-600">From Mar 12 - Apr 12</p>
                <Button
                    size="sm"
                    variant="faded"
                    onPress={() => setIsBacklogCollapsed(!isBacklogCollapsed)}
                    startContent={isBacklogCollapsed ? <RiArrowDownSLine /> : <RiArrowUpSLine />}
                >
                    {isBacklogCollapsed ? 'Show backlog' : 'Hide backlog'}
                </Button>
            </div>
            <div className="flex gap-3">
                <div className="basis-3/4 grow flex gap-4 pb-4 overflow-x-auto snap-x">
                    {days.map((day) => {
                        const dateStr = day.format('YYYY-MM-DD'); // Column date
                        const isToday = day.isSame(dayjs(), 'day');

                        // Filter tasks where the date (ignoring time) matches the column date
                        const tasksForDay = tasks?.filter((task) =>
                            // Convert task date to the user's local time zone and compare it to the column date
                            dayjs(task?.date)
                                .tz(dayjs.tz.guess())
                                .startOf('day')
                                .isSame(day.startOf('day'), 'day'),
                        );

                        return (
                            <div
                                key={dateStr}
                                className={`flex flex-col gap-2 bg-content1 border-1 rounded-xl p-2 h-[80vh] min-w-[250px] w-[75vw] sm:w-[50vw] md:w-[20vw] lg:w-[12vw] md flex-shrink-0 snap-center `}
                            >
                                <div
                                    className={`p-2 border-b-2 ${isToday ? 'border-secondary' : 'border-default'}`}
                                >
                                    <div className="font-semibold">{day.format('dddd')}</div>
                                    <div className="text-sm text-default-500">
                                        {day.format('MMM D')}
                                    </div>
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
                                {tasksForDay && (
                                    <DraggableList
                                        key={listKey}
                                        id={dateStr}
                                        items={tasksForDay}
                                        group="tasks"
                                        smallCards
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                <BacklogPanel isBacklogCollapsed={isBacklogCollapsed} />
            </div>
        </div>
    );
};

export default UpcomingTasks;
