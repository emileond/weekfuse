import { useState, useRef } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import UpcomingTasks from '../components/tasks/UpcomingTasks.jsx';
import {RiSparkling2Line} from 'react-icons/ri';

function UpcomingPage() {
    const [lastPlanResponse, setLastPlanResponse] = useState(null);
    const autoPlanRef = useRef(null);

    const handleAutoPlan = async () => {
        // Call the function exposed by UpcomingTasks component
        if (autoPlanRef.current) {
            await autoPlanRef.current();
        }
    }

    return (
        <AppLayout>
            <PageLayout
                maxW="screen-2xl"
                title="Upcoming"
                primaryAction="Auto Plan"
                icon={<RiSparkling2Line fontSize="1.1rem" />}
                onClick={handleAutoPlan}
            >
                <div className="flex flex-col gap-1">
                    <UpcomingTasks onAutoPlan={autoPlanRef} lastPlanResponse={lastPlanResponse} setLastPlanResponse={setLastPlanResponse} />
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default UpcomingPage;
