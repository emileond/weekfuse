import AuthForm from '../components/auth/AuthForm';
import { useEffect } from 'react';
import { useUser } from '../hooks/react-query/user/useUser';
import { useWorkspaces } from '../hooks/react-query/teams/useWorkspaces';
import { useNavigate } from 'react-router-dom';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace.js';

function AuthPage({ authMode = 'login' }) {
    const { data: user } = useUser();
    const [currentWorkspace, setCurrentWorkspace] = useCurrentWorkspace();
    const { data: workspaces } = useWorkspaces(user);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !workspaces) return; // Early return if user or workspaces are not available

        // If currentWorkspace is set
        if (currentWorkspace) {
            // Navigate based on the onboarding status
            navigate(currentWorkspace.onboarded ? '/dashboard' : '/onboarding');
            return; // Exit the effect to avoid unnecessary further execution
        }

        // If no currentWorkspace is set, find the owned workspace
        const ownedWorkspace = workspaces.find((workspace) => workspace.role === 'owner');
        if (ownedWorkspace) {
            setCurrentWorkspace(ownedWorkspace);
        }
    }, [user, workspaces, currentWorkspace, navigate]);

    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <AuthForm viewMode={authMode} />
        </div>
    );
}

export default AuthPage;
