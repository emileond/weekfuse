import { useEffect } from 'react';
import { useUser } from '../hooks/react-query/user/useUser';
import { useWorkspaces } from '../hooks/react-query/teams/useWorkspaces';
import PageLayout from '../components/layout/PageLayout';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import OnboardingSteps from '../components/onboarding/OnboardingSteps';
import Logo from '../components/Logo.jsx';

function OnboardingPage() {
    const { data: user } = useUser();
    const { data: workspaces } = useWorkspaces(user);
    const [currentWorkspace, setCurrentWorkspace] = useCurrentWorkspace();

    useEffect(() => {
        // If currentWorkspace is not set but workspaces exist, find the one where user is owner
        if (!currentWorkspace && workspaces && workspaces.length > 0) {
            const ownerWorkspace = workspaces.find((workspace) => workspace.role === 'owner');
            if (ownerWorkspace) {
                setCurrentWorkspace(ownerWorkspace);
            }
        }
    }, [workspaces, currentWorkspace, setCurrentWorkspace]);

    return (
        <div className="w-screen h-screen bg-content1 flex justify-center items-center">
            <PageLayout maxW="xl" title="">
                <div className="flex justify-center mb-10">
                    <Logo />
                </div>
                <OnboardingSteps
                    currentWorkspace={currentWorkspace}
                    setCurrentWorkspace={setCurrentWorkspace}
                />
            </PageLayout>
        </div>
    );
}

export default OnboardingPage;
