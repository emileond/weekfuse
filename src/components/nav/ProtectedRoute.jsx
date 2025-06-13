import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../hooks/react-query/user/useUser';
import { useWorkspaces } from '../../hooks/react-query/teams/useWorkspaces';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';

// A simple loading spinner component
const FullScreenLoader = () => (
    <div className="w-screen h-screen flex justify-center items-center">
        <p>Loading...</p>
    </div>
);

function ProtectedRoute({ children }) {
    const { data: user, isPending: isUserLoading } = useUser();
    const { data: workspaces, isPending: isWorkspacesLoading } = useWorkspaces(user);
    const [currentWorkspace, setCurrentWorkspace] = useCurrentWorkspace();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // 1. Wait until all data is loaded
        if (isUserLoading || isWorkspacesLoading) {
            return;
        }

        // 2. Redirect unauthenticated users
        if (!user) {
            navigate('/login');
            return;
        }

        // 3. Set a default workspace if none is set
        if (workspaces && workspaces.length > 0 && !currentWorkspace) {
            const defaultWorkspace = workspaces.find((ws) => ws.role === 'owner') || workspaces[0];
            setCurrentWorkspace(defaultWorkspace);
            return; // Allow re-render
        }

        // 4. Handle users with no workspaces
        if (workspaces && workspaces.length === 0) {
            navigate('/auth');
            return;
        }

        // --- At this point, we have a user and a currentWorkspace ---
        if (!currentWorkspace) return;

        // --- REVISED LOGIC TO FIX REDIRECT LOOP ---

        // 5. Onboarding Check (Highest Priority)
        // If a user is not onboarded, this is the only state that matters.
        const isOnboarded = currentWorkspace.onboarded;
        if (!isOnboarded) {
            // If they are not already on the onboarding page, send them there.
            if (location.pathname !== '/onboarding') {
                navigate('/onboarding');
            }
            // IMPORTANT: Return here to prevent any other checks (like the paywall) from running.
            return;
        }

        // 6. Trial Expiration Check (Second Priority)
        // This logic now ONLY runs if the user is already onboarded.
        const isTrialing = currentWorkspace.subscription_status === 'trial';
        const trialHasEnded =
            currentWorkspace.trial_ends_at && new Date(currentWorkspace.trial_ends_at) < new Date();
        const isCancelled = currentWorkspace.subscription_status === 'cancelled';

        if ((isTrialing && trialHasEnded) || isCancelled) {
            // If their trial is over, the only page they can see is the paywall.
            if (location.pathname !== '/paywall') {
                navigate('/paywall');
            }
        }
    }, [
        user,
        isUserLoading,
        workspaces,
        isWorkspacesLoading,
        currentWorkspace,
        setCurrentWorkspace,
        navigate,
        location.pathname,
    ]);

    // --- Render logic ---
    const isLoading =
        isUserLoading ||
        isWorkspacesLoading ||
        (user && workspaces && workspaces.length > 0 && !currentWorkspace);

    if (isLoading) {
        return <FullScreenLoader />;
    }

    if (user && currentWorkspace) {
        return children;
    }

    return null;
}

export default ProtectedRoute;
