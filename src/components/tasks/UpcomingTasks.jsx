import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { Button } from '@heroui/react';
import { RiAddLine, RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri';
import BacklogPanel from './BacklogPanel.jsx';
import { useTasks } from '../../hooks/react-query/tasks/useTasks.js';
import DraggableList from './DraggableList.jsx';
import timezone from 'dayjs/plugin/timezone'; // Import the timezone plugin
import utc from 'dayjs/plugin/utc'; // Import the UTC plugin

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const UpcomingTasks = () => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: tasks } = useTasks(currentWorkspace);
    const [isBacklogCollapsed, setIsBacklogCollapsed] = useState(false);

    // Create an array of 37 days starting from today (current week + one month)
    const days = useMemo(() => {
        const result = [];
        for (let i = 0; i < 37; i++) {
            result.push(dayjs().add(i, 'day'));
        }
        return result;
    }, []);

    return (
        <div>
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
                                className={`flex flex-col gap-2 bg-content1 border-1 rounded-xl p-2 h-[80vh] min-w-[250px] flex-shrink-0 snap-center `}
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
                                >
                                    Add task
                                </Button>
                                {tasksForDay && (
                                    <DraggableList id={dateStr} items={tasksForDay} group="tasks" />
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
