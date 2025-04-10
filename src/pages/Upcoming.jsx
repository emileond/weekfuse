import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import UpcomingTasks from '../components/tasks/UpcomingTasks.jsx';

function UpcomingPage() {
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
