import { Button, Input, useDisclosure } from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import { RiAddLine, RiCalendarScheduleLine } from 'react-icons/ri';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useTasks, useUpdateMultipleTasks } from '../hooks/react-query/tasks/useTasks.js';
import { useEffect, useState } from 'react';
import Paywall from '../components/marketing/Paywall';
import NewTaskModal from '../components/tasks/NewTaskModal.jsx';
import dayjs from 'dayjs';
import DraggableList from '../components/tasks/DraggableList.jsx';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { Accordion, AccordionItem } from '@heroui/accordion';
import TaskCard from '../components/tasks/TaskCard.jsx';
import DatePicker from '../components/form/DatePicker.jsx';
import toast from 'react-hot-toast';

dayjs.extend(utc);
dayjs.extend(timezone);

function DashboardPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const { isOpen, onOpenChange } = useDisclosure();
    const [insufficientCredits, setInsufficientCredits] = useState(false);
    const { data: todayTasks } = useTasks(currentWorkspace, {
        startDate: dayjs().startOf('day').toISOString(),
        endDate: dayjs().endOf('day').toISOString(),
    });
    const { data: overdueTasks } = useTasks(currentWorkspace, {
        statusList: ['pending'],
        endDate: dayjs().startOf('day').subtract(1, 'day').toISOString(),
    });
    const { mutateAsync: updateMultipleTasks } = useUpdateMultipleTasks(currentWorkspace);
    const listDate = dayjs().startOf('day').tz(dayjs.tz.guess(), true).toISOString();
    const [listKey, setListKey] = useState();

    const hasOVerdueTasks = overdueTasks?.length > 0;

    const rescheduleOverdueTasks = async (newDate) => {
        if (!newDate) return;
        const tasksToUpdate = overdueTasks?.map((item) => ({
            taskId: item.id,
            updates: {
                date: dayjs(newDate).toISOString(),
            },
        }));

        try {
            await updateMultipleTasks(tasksToUpdate);
            toast.success('Tasks rescheduled');
        } catch (error) {
            console.error('Error updating tasks:', error);
        }
    };

    useEffect(() => {
        setListKey(dayjs().toISOString());
    }, [todayTasks]);

    return (
        <AppLayout>
            <Paywall
                isOpen={insufficientCredits}
                onOpenChange={(open) => {
                    if (!open) {
                        setInsufficientCredits(false);
                    }
                }}
                feature="more credits"
            />
            <NewTaskModal isOpen={isOpen} onOpenChange={onOpenChange} defaultDate={new Date()} />
            <PageLayout
                maxW="3xl"
                title="Today"
                description="your tasks for the day"
                primaryAction="New task"
                icon={<RiAddLine fontSize="1.1rem" />}
                onClick={onOpenChange}
            >
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        {hasOVerdueTasks && (
                            <Accordion>
                                <AccordionItem
                                    key="overdue-tasks"
                                    textValue="overdue tasks"
                                    title={
                                        <div className="w-full flex items-center gap-3 justify-between">
                                            <span className="text-sm font-medium">
                                                Overdue ({overdueTasks?.length})
                                            </span>
                                            <DatePicker
                                                onChange={rescheduleOverdueTasks}
                                                trigger={
                                                    <div className="flex gap-2 text-xs text-primary rounded-md border-2 border-default bg-primary-50 hover:text-primary-500 py-1.5 px-3">
                                                        <RiCalendarScheduleLine fontSize="1rem" />
                                                        Reschedule
                                                    </div>
                                                }
                                            />
                                        </div>
                                    }
                                >
                                    <div className="flex flex-col gap-2">
                                        {overdueTasks?.map((task) => (
                                            <TaskCard key={task.id} task={task} sm />
                                        ))}
                                    </div>
                                </AccordionItem>
                            </Accordion>
                        )}
                        {todayTasks && (
                            <DraggableList
                                key={listKey}
                                id={listDate}
                                items={todayTasks}
                                group="today-tasks"
                            />
                        )}
                    </div>
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default DashboardPage;
