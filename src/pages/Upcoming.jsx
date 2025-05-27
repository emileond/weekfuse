import { useState, useRef } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import UpcomingTasks from '../components/tasks/UpcomingTasks.jsx';
import { RiSparkling2Line, RiArrowGoBackLine } from 'react-icons/ri';

function UpcomingPage() {
    const [lastPlanResponse, setLastPlanResponse] = useState(null);
    const autoPlanRef = useRef(null);
    const rollbackRef = useRef(null);

    const handleAutoPlan = async () => {
        // Call the function exposed by UpcomingTasks component
        if (autoPlanRef.current) {
            await autoPlanRef.current();
        }
    };

    const handleRollback = async () => {
        // Call the function exposed by UpcomingTasks component
        if (rollbackRef.current) {
            await rollbackRef.current();
        }
    };

    return (
        <AppLayout>
            <PageLayout
                maxW="screen-2xl"
                title="Upcoming"
                primaryAction={`${lastPlanResponse ? 'Rollback' : 'Auto Plan'}`}
                icon={
                    lastPlanResponse ? (
                        <RiArrowGoBackLine fontSize="1rem" />
                    ) : (
                        <RiSparkling2Line fontSize="1.1rem" />
                    )
                }
                onClick={lastPlanResponse ? handleRollback : handleAutoPlan}
            >
                <div className="flex flex-col gap-1">
                    <UpcomingTasks
                        onAutoPlan={autoPlanRef}
                        onRollback={rollbackRef}
                        lastPlanResponse={lastPlanResponse}
                        setLastPlanResponse={setLastPlanResponse}
                    />
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default UpcomingPage;
