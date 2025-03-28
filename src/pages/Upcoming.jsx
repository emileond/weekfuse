import { useDisclosure } from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import { RiAddLine } from 'react-icons/ri';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useNavigate } from 'react-router-dom';
import UpcomingTasks from '../components/tasks/UpcomingTasks.jsx';

function UpcomingPage() {
    const navigate = useNavigate();

    return (
        <AppLayout>
            <PageLayout
                maxW="screen-2xl"
                title="Upcoming"
                description="These are the tasks that are scheduled for the upcoming days."
                // primaryAction="New task"
                // icon={<RiAddLine fontSize="1.1rem" />}
                // onClick={null}
            >
                <div className="flex flex-col gap-3">
                    <UpcomingTasks />
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default UpcomingPage;
