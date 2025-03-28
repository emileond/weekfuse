import { useDisclosure } from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import { RiAddLine } from 'react-icons/ri';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useTodayTasks } from '../hooks/react-query/tasks/useTasks.js';
import { useNavigate } from 'react-router-dom';
import NewTaskModal from '../components/tasks/NewTaskModal.jsx';
import UpcomingTasks from '../components/tasks/UpcomingTasks.jsx';

function UpcomingPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: tasks } = useTodayTasks(currentWorkspace);
    const { isOpen, onOpenChange } = useDisclosure();
    const navigate = useNavigate();

    return (
        <AppLayout>
            <NewTaskModal isOpen={isOpen} onOpenChange={onOpenChange} />
            <PageLayout
                maxW="screen-2xl"
                title="Upcoming"
                description="These are the tasks that are scheduled for the upcoming days."
                primaryAction="New task"
                icon={<RiAddLine fontSize="1.1rem" />}
                onClick={onOpenChange}
            >
                <div className="flex flex-col gap-3">
                    {tasks && <UpcomingTasks tasks={tasks} />}
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default UpcomingPage;
