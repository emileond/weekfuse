import { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { Button, useDisclosure, Modal, ModalContent, ModalBody, Spinner } from '@heroui/react';
import {
    RiAddLine,
    RiExpandLeftLine,
    RiContractRightLine,
    RiArrowGoBackLine,
    RiSparkling2Fill,
} from 'react-icons/ri';
import BacklogPanel from './BacklogPanel.jsx';
import { useTasks, useUpdateMultipleTasks } from '../../hooks/react-query/tasks/useTasks.js';
import DraggableList from './DraggableList.jsx';
import utc from 'dayjs/plugin/utc';
import NewTaskModal from './NewTaskModal.jsx';
import ky from 'ky';
import { useQueryClient } from '@tanstack/react-query';

// Extend dayjs with the plugins
dayjs.extend(utc);

const UpcomingTasks = () => {
    const [currentWorkspace] = useCurrentWorkspace();
    const [newTaskDate, setNewTaskDate] = useState(null);
    const [lastPlanResponse, setLastPlanResponse] = useState(null);
    const { isOpen, onOpenChange } = useDisclosure();
    const {
        isOpen: isLoadingOpen,
        onOpen: onLoadingOpen,
        onClose: onLoadingClose,
    } = useDisclosure();
    const [loadingMessage, setLoadingMessage] = useState('Optimizing plan...');
    const queryClient = useQueryClient();
    const updateMultipleTasks = useUpdateMultipleTasks(currentWorkspace);

    // Array of loading messages to display
    const loadingMessages = [
        'Optimizing plan...',
        'Finding the smartest schedule...',
        'Analyzing task priorities...',
        'Balancing your workload...',
        'Calculating optimal distribution...',
        'Applying AI scheduling algorithms...',
    ];

    // Function to cycle through loading messages
    useEffect(() => {
        let messageInterval;
        if (isLoadingOpen) {
            let index = 0;
            messageInterval = setInterval(() => {
                index = (index + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[index]);
            }, 3000); // Change message every 3 seconds
        }

        return () => {
            if (messageInterval) clearInterval(messageInterval);
        };
    }, [isLoadingOpen]);

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

    const handleRollback = async () => {
        try {
            if (!lastPlanResponse || !Array.isArray(lastPlanResponse)) {
                console.error('No plan response to rollback');
                return;
            }

            // Show loading modal
            onLoadingOpen();
            setLoadingMessage('Rolling back changes...');

            // Prepare tasks for rollback (set date to null)
            const tasksToUpdate = lastPlanResponse.map((task) => ({
                taskId: task.id,
                updates: { date: null },
            }));

            // Update tasks using the hook
            await updateMultipleTasks(tasksToUpdate);

            // Clear the last plan response
            setLastPlanResponse(null);

            console.log('Successfully rolled back AI plan changes');
        } catch (error) {
            console.error('Error rolling back changes:', error);
        } finally {
            // Hide loading modal
            onLoadingClose();
        }
    };

    const handleAutoPlan = async () => {
        try {
            // Show loading modal
            onLoadingOpen();
            setLoadingMessage('Optimizing plan...');

            // Transform tasks into a map of dates with task counts
            const scheduledTasksPerDay = {};

            if (tasks && tasks.length > 0) {
                tasks.forEach((task) => {
                    if (task.date) {
                        // Use UTC date as the key (YYYY-MM-DD format)
                        const utcDate = dayjs(task.date).startOf('day').toISOString();

                        // Increment the count for this date
                        scheduledTasksPerDay[utcDate] = (scheduledTasksPerDay[utcDate] || 0) + 1;
                    }
                });
            }

            // Generate all dates in the range
            const availableDates = [];
            const start = dayjs(startDate);
            const end = dayjs(endDate);

            // Loop through all days in the range
            let current = start;
            while (current.isBefore(end) || current.isSame(end, 'day')) {
                const currentIso = current.startOf('day').toISOString();
                const weekday = current.day();
                const weekdayName = current.format('dddd'); // Get weekday name (Monday, Tuesday, etc.)

                // Only include weekdays (Mon-Fri)
                if (weekday >= 1 && weekday <= 5) {
                    // Check if this date has fewer than 3 tasks
                    const taskCount = scheduledTasksPerDay[currentIso] || 0;
                    if (taskCount < 3) {
                        // Include both date and weekday name
                        availableDates.push({
                            date: currentIso,
                            weekday: weekdayName,
                        });
                    }
                }

                // Move to next day
                current = current.add(1, 'day');
            }

            console.log('Available dates for planning:', availableDates);

            const response = await ky
                .post('/api/ai/plan', {
                    json: {
                        startDate,
                        endDate,
                        availableDates,
                        workspace_id: currentWorkspace?.workspace_id,
                    },
                    timeout: false,
                })
                .json();

            console.log('Auto plan response:', response);

            // Store the response for potential rollback
            setLastPlanResponse(response);

            // Refetch the tasks query after successful response
            if (response) {
                await queryClient.cancelQueries({
                    queryKey: ['tasks', currentWorkspace?.workspace_id],
                });
                await queryClient.invalidateQueries({
                    queryKey: ['tasks', currentWorkspace?.workspace_id],
                });
            }
        } catch (error) {
            console.error('Error in auto plan:', error);
        } finally {
            // Hide loading modal
            onLoadingClose();
        }
    };

    return (
        <>
            <NewTaskModal isOpen={isOpen} onOpenChange={onOpenChange} defaultDate={newTaskDate} />

            {/* Loading Modal */}
            <Modal isOpen={isLoadingOpen} hideCloseButton={true} isDismissable={false}>
                <ModalContent>
                    <ModalBody className="py-8">
                        <div className="flex flex-col items-center gap-6">
                            <Spinner size="lg" color="primary" variant="wave" />
                            <p className="font-medium text-center text-default-500">
                                {loadingMessage}
                            </p>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <div className="flex justify-between mb-2">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={handleAutoPlan}
                        endContent={<RiSparkling2Fill fontSize="1.2rem" />}
                    >
                        Auto Plan
                    </Button>
                    {lastPlanResponse && (
                        <Button
                            color="danger"
                            variant="flat"
                            onPress={handleRollback}
                            startContent={<RiArrowGoBackLine fontSize="1rem" />}
                        >
                            Rollback
                        </Button>
                    )}
                </div>
                <p className="text-sm text-default-600">From start date - end date</p>
                <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setIsBacklogCollapsed(!isBacklogCollapsed)}
                    startContent={
                        isBacklogCollapsed ? (
                            <RiExpandLeftLine fontSize="1rem" />
                        ) : (
                            <RiContractRightLine fontSize="1rem" />
                        )
                    }
                    className="text-default-600 hover:text-default-700"
                >
                    {isBacklogCollapsed ? 'Show backlog' : 'Hide backlog'}
                </Button>
            </div>
            <div className="flex gap-3 h-[82vh]">
                <div className="basis-2/3 grow flex gap-4 overflow-x-auto snap-x ">
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
                                className={`flex flex-col gap-2 bg-content1 border-1 rounded-xl p-2  min-w-[250px] w-[75vw] sm:w-[50vw] md:w-[20vw] lg:w-[12vw] md flex-shrink-0 snap-center overflow-y-hidden`}
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
        </>
    );
};

export default UpcomingTasks;
