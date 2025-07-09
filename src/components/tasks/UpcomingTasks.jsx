import { useMemo, useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { supabaseClient } from '../../lib/supabase.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { Button, useDisclosure, Modal, ModalContent, ModalBody, Spinner } from '@heroui/react';
import { RiExpandLeftLine, RiContractRightLine } from 'react-icons/ri';
import BacklogPanel from './BacklogPanel.jsx';
import { useUpdateMultipleTasks } from '../../hooks/react-query/tasks/useTasks.js';
import utc from 'dayjs/plugin/utc';
import ky from 'ky';
import DayColumn from './DayColumn.jsx';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Extend dayjs with the plugins
dayjs.extend(utc);

const UpcomingTasks = ({ onAutoPlan, onRollback, lastPlanResponse, setLastPlanResponse }) => {
    const queryClient = useQueryClient();
    const [currentWorkspace] = useCurrentWorkspace();
    const {
        isOpen: isLoadingOpen,
        onOpen: onLoadingOpen,
        onClose: onLoadingClose,
    } = useDisclosure();
    const [loadingMessage, setLoadingMessage] = useState('Optimizing plan...');

    const { mutateAsync: updateMultipleTasks } = useUpdateMultipleTasks(currentWorkspace);

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
    }, [isLoadingOpen, loadingMessages]);

    // Calculate the date range to display
    const days = useMemo(() => {
        const today = dayjs();
        const dayOfWeek = today.day(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
        const daysToAddForCurrentWeek = dayOfWeek === 0 ? 6 : 6 - dayOfWeek; // Days remaining in the current week (ends on Saturday)
        const totalDays = daysToAddForCurrentWeek + 14; // Remaining days in current week + 2 full weeks

        const result = [];
        for (let i = 0; i < totalDays; i++) {
            result.push(today.add(i, 'day'));
        }
        return result;
    }, []);

    const startDate = days[0]?.startOf('day').toISOString();
    const endDate = days[days.length - 1]?.endOf('day').toISOString();

    const [isBacklogCollapsed, setIsBacklogCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('isBacklogCollapsed') === 'true';
        }
        return false;
    });

    // This effect persists the collapsed state to localStorage whenever it changes.
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('isBacklogCollapsed', String(isBacklogCollapsed));
        }
    }, [isBacklogCollapsed]);

    // This callback is passed to the child components to toggle the state.
    const handleToggleCollapse = useCallback(() => {
        setIsBacklogCollapsed((prevState) => !prevState);
    }, []);

    const handleRollback = useCallback(async () => {
        if (!lastPlanResponse || !Array.isArray(lastPlanResponse)) {
            console.error('No plan response to rollback');
            return;
        }

        onLoadingOpen();
        setLoadingMessage('Rolling back changes...');

        const tasksToUpdate = lastPlanResponse.map((task) => ({
            taskId: task.id,
            updates: { date: null },
        }));

        try {
            await updateMultipleTasks({ tasks: tasksToUpdate });
            setLastPlanResponse(null);
            toast.success('Changes reverted');

            await queryClient.cancelQueries({
                queryKey: ['tasks', currentWorkspace?.workspace_id],
            });
            await queryClient.invalidateQueries({
                queryKey: ['tasks', currentWorkspace?.workspace_id],
            });
        } catch (error) {
            console.error('Error rolling back changes:', error);
            toast.error('Error rolling back changes');
        } finally {
            onLoadingClose();
        }
    }, [
        lastPlanResponse,
        updateMultipleTasks,
        setLastPlanResponse,
        queryClient,
        currentWorkspace,
        onLoadingOpen,
        onLoadingClose,
    ]);

    const autoPlan = useCallback(async () => {
        setIsBacklogCollapsed(true);
        onLoadingOpen();
        setLoadingMessage('Optimizing plan...');

        const availableDates = [];
        const start = dayjs(startDate);
        const end = dayjs(endDate);

        const { data } = await supabaseClient.rpc('get_tasks_count_per_day', {
            p_workspace_id: currentWorkspace?.workspace_id,
            p_start_date: dayjs(startDate).startOf('day').toISOString(),
            p_end_date: dayjs(endDate).endOf('day').toISOString(),
        });

        const countsByDay = data.reduce((map, { day, count }) => {
            const key = dayjs.utc(day).format('YYYY-MM-DD');
            map[key] = count;
            return map;
        }, {});

        let current = start;
        while (current.isBefore(end) || current.isSame(end, 'day')) {
            const key = current.format('YYYY-MM-DD');
            const weekday = current.day();
            const weekdayName = current.format('dddd');

            if (weekday >= 1 && weekday <= 5) {
                const taskCount = countsByDay[key] || 0;
                if (taskCount < 2) {
                    availableDates.push({
                        date: current.startOf('day').toISOString(),
                        weekday: weekdayName,
                    });
                }
            }
            current = current.add(1, 'day');
        }

        try {
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

            setLastPlanResponse(response);

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
            onLoadingClose();
        }
    }, [
        startDate,
        endDate,
        currentWorkspace,
        setLastPlanResponse,
        queryClient,
        onLoadingOpen,
        onLoadingClose,
    ]);

    // ✅ CORRECTED: This effect now correctly depends on the memoized
    // `autoPlan` and `handleRollback` functions.
    useEffect(() => {
        if (onAutoPlan && currentWorkspace) {
            onAutoPlan.current = autoPlan;
        }
        if (onRollback && currentWorkspace) {
            onRollback.current = handleRollback;
        }
    }, [onAutoPlan, onRollback, currentWorkspace, autoPlan, handleRollback]);

    return (
        <>
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
                <p className="text-sm text-default-600">
                    {dayjs(startDate).format('MMM D')} - {dayjs(endDate).format('MMM D')}
                </p>
                <Button
                    size="sm"
                    variant="light"
                    onPress={handleToggleCollapse}
                    startContent={
                        isBacklogCollapsed ? (
                            <RiExpandLeftLine fontSize="1.1rem" />
                        ) : (
                            <RiContractRightLine fontSize="1.1rem" />
                        )
                    }
                    className="text-default-600 hover:text-default-700"
                >
                    {isBacklogCollapsed ? 'Show backlog' : 'Hide backlog'}
                </Button>
            </div>
            <div className="flex gap-3 h-[calc(100vh-140px)]">
                <div className="basis-2/3 grow flex gap-4 overflow-x-auto snap-x">
                    {days.map((day) => {
                        const dateStr = day.format('YYYY-MM-DD');
                        return <DayColumn key={dateStr} day={day} />;
                    })}
                </div>
                <BacklogPanel isBacklogCollapsed={isBacklogCollapsed} />
            </div>
        </>
    );
};

export default UpcomingTasks;
