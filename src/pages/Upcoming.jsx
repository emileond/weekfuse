import { useState, useRef } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import UpcomingTasks from '../components/tasks/UpcomingTasks.jsx';
import PlanningActions from '../components/planning/PlanningActions';

function UpcomingPage() {
    const [lastPlanResponse, setLastPlanResponse] = useState(null);
    const autoPlanRef = useRef(null);
    const rollbackRef = useRef(null);

    return (
        <AppLayout>
            <PageLayout
                maxW="full"
                title="Upcoming"
                customElements={
                    <PlanningActions 
                        lastPlanResponse={lastPlanResponse} 
                        onAutoPlan={autoPlanRef} 
                        onRollback={rollbackRef} 
                    />
                }
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
