import { useState, useEffect } from 'react';
import WorkspaceNameStep from './WorkspaceNameStep';
import InviteTeamStep from './InviteTeamStep';
import CompletionStep from './CompletionStep';
import { Card, CardBody, Progress } from '@heroui/react';

function OnboardingSteps({ currentWorkspace, setCurrentWorkspace }) {
    // Track current step by ID instead of index
    const [currentStepId, setCurrentStepId] = useState('workspace-name');

    // Define steps and their visibility conditions
    const steps = [
        {
            id: 'workspace-name',
            title: "Let's set up your workspace",
            component: WorkspaceNameStep,
            isVisible: () => !currentWorkspace?.name || currentWorkspace.name === 'My workspace',
        },
        {
            id: 'invite-team',
            title: 'Invite your team',
            component: InviteTeamStep,
            isVisible: () => true, // Always visible
        },
        {
            id: 'completion',
            title: "You're All Set! ",
            component: CompletionStep,
            isVisible: () => true, // Always visible
        },
    ];

    // Get only the visible steps
    const visibleSteps = steps.filter((step) => step.isVisible());

    // Ensure currentStepId is always pointing to a valid step
    useEffect(() => {
        if (!visibleSteps.find((step) => step.id === currentStepId)) {
            // Find the next available step in the ordered list
            const currentStepIndex = steps.findIndex((step) => step.id === currentStepId);
            const nextVisibleStep = visibleSteps.find(
                (step) => steps.findIndex((s) => s.id === step.id) > currentStepIndex,
            );

            setCurrentStepId(nextVisibleStep ? nextVisibleStep.id : visibleSteps[0]?.id);
        }
    }, [visibleSteps.length, currentStepId]);

    // Get the current step
    const currentStep = visibleSteps.find((step) => step.id === currentStepId);

    // Move to the next step based on the original step order
    const goToNextStep = () => {
        const currentStepIndex = steps.findIndex((step) => step.id === currentStepId);
        const nextStep = visibleSteps.find(
            (step) => steps.findIndex((s) => s.id === step.id) > currentStepIndex,
        );

        if (nextStep) {
            setCurrentStepId(nextStep.id);
        }
    };

    // If no steps are visible, return null
    if (!currentStep) return null;

    const StepComponent = currentStep.component;

    return (
        <Card shadow="sm" className="p-3">
            <CardBody>
                <div className="flex gap-4 items-center py-3">
                    {steps.map((step, index) => (
                        <Progress
                            size="sm"
                            color="secondary"
                            value={
                                index >= steps.findIndex((step) => step.id === currentStepId)
                                    ? 0
                                    : 100
                            }
                        />
                    ))}
                </div>
                <div className="flex flex-col gap-6">
                    <div className="mt-6">
                        <h1 className="text-2xl font-semibold mb-3">{currentStep.title}</h1>
                        <StepComponent
                            currentWorkspace={currentWorkspace}
                            setCurrentWorkspace={setCurrentWorkspace}
                            goToNextStep={goToNextStep}
                        />
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

export default OnboardingSteps;
