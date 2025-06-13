import { useEffect, useState } from 'react';
import { useUser } from '../hooks/react-query/user/useUser';
import { useWorkspaces } from '../hooks/react-query/teams/useWorkspaces';
import { useNavigate } from 'react-router-dom';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace.js';
import AuthForm from '../components/auth/AuthForm';
import toast from 'react-hot-toast';

// Import the Supabase client and the query client hook
import { supabaseClient } from '../lib/supabase'; // Adjust this path if needed
import { useQueryClient } from '@tanstack/react-query';

function AuthPage({ authMode = 'login' }) {
    const { data: user } = useUser();
    const [currentWorkspace, setCurrentWorkspace] = useCurrentWorkspace();

    // Pass the isPending flag to know the query state
    const { data: workspaces, isPending: isLoadingWorkspaces } = useWorkspaces(user);

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Add a state to prevent multiple workspace creation calls
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

    useEffect(() => {
        // Wait until we have the user and the workspace query has finished
        if (!user || isLoadingWorkspaces || isCreatingWorkspace) {
            return;
        }

        const handleOnboarding = async () => {
            // --- NEW LOGIC: CHECK FOR PENDING INVITE FIRST ---
            const pendingToken = localStorage.getItem('pendingInvitationToken');
            if (pendingToken) {
                console.log('Found a pending invitation token. Accepting...');
                localStorage.removeItem('pendingInvitationToken'); // Use it once

                try {
                    const { error } = await supabaseClient.rpc('accept_workspace_invitation', {
                        invitation_id: pendingToken,
                    });
                    if (error) throw error;

                    toast.success('Invitation accepted!');
                    await queryClient.invalidateQueries({ queryKey: ['workspaces', user.id] });
                    // The effect will re-run with the new workspace data and handle navigation
                    return; // Exit here to let the component re-render with new data
                } catch (error) {
                    toast.error(`Failed to accept invitation: ${error.message}`);
                    // Continue to normal onboarding even on error
                }
            }

            // SCENARIO 1: User has one or more workspaces (they were invited or already exist)
            if (workspaces && workspaces.length > 0) {
                if (currentWorkspace) {
                    navigate(currentWorkspace.onboarded ? '/dashboard' : '/onboarding');
                } else {
                    const ownedWorkspace =
                        workspaces.find((ws) => ws.role === 'owner') || workspaces[0];
                    if (ownedWorkspace) {
                        setCurrentWorkspace(ownedWorkspace);
                    }
                }
            }
            // SCENARIO 2: User is logged in but has NO workspaces (new organic signup)
            else if (workspaces && workspaces.length === 0) {
                setIsCreatingWorkspace(true); // Lock to prevent re-runs
                console.log('User has no workspaces. Creating one now...');

                // Call the database function you created
                const { error } = await supabaseClient.rpc('create_new_workspace_and_start_trial');

                if (error) {
                    console.error('Failed to create workspace:', error);
                    // Optionally show an error to the user
                    setIsCreatingWorkspace(false); // Unlock on error
                } else {
                    console.log('Workspace created. Refetching workspaces...');
                    // Invalidate the query to force a refetch. This will cause the effect
                    // to run again, but this time with a workspace.
                    await queryClient.invalidateQueries({ queryKey: ['workspaces', user.id] });
                    setIsCreatingWorkspace(false); // Unlock after invalidation
                }
            }
        };

        handleOnboarding();
    }, [
        user,
        workspaces,
        isLoadingWorkspaces,
        currentWorkspace,
        navigate,
        setCurrentWorkspace,
        queryClient,
        isCreatingWorkspace,
    ]);

    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <AuthForm viewMode={authMode} />
        </div>
    );
}

export default AuthPage;
