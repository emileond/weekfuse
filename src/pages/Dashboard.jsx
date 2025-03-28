import { useDisclosure } from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import { RiAddLine } from 'react-icons/ri';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useTasks } from '../hooks/react-query/tasks/useTasks.js';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Paywall from '../components/marketing/Paywall';
import NewTaskModal from '../components/tasks/NewTaskModal.jsx';
import dayjs from 'dayjs';
import DraggableList from '../components/tasks/DraggableList.jsx';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

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
    const navigate = useNavigate();

    const listDate = dayjs().startOf('day').tz(dayjs.tz.guess(), true).toISOString();

    const [listKey, setListKey] = useState();

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
                        {todayTasks && (
                            <DraggableList
                                key={listKey}
                                id={listDate}
                                items={todayTasks}
                                group="today-tasks"
                            />
                        )}
                        {/*{todayTasks?.map((task) => (*/}
                        {/*    <TaskCard key={task.id} task={task} />*/}
                        {/*))}*/}
                    </div>
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default DashboardPage;
