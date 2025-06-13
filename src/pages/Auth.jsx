import { useEffect, useState } from 'react';
import { useUser } from '../hooks/react-query/user/useUser';
import { useWorkspaces } from '../hooks/react-query/teams/useWorkspaces';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace.js';
import AuthForm from '../components/auth/AuthForm';
import toast from 'react-hot-toast';
import { supabaseClient } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

function AuthPage({ authMode = 'login' }) {
    const { data: user } = useUser();
    const [currentWorkspace, setCurrentWorkspace] = useCurrentWorkspace();
    const { data: workspaces, isPending: isLoadingWorkspaces } = useWorkspaces(user);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!user || isLoadingWorkspaces || isProcessing) {
            return;
        }

        const handlePostLogin = async () => {
            setIsProcessing(true);

            // --- Step 1: Handle any pending invitation from the URL ---
            const pendingToken =
                searchParams.get('token') || localStorage.getItem('pendingInvitationToken');
            if (pendingToken) {
                localStorage.removeItem('pendingInvitationToken');
                if (searchParams.get('token')) navigate('/auth', { replace: true });

                try {
                    await supabaseClient.rpc('accept_workspace_invitation', {
                        invitation_id: pendingToken,
                    });
                    toast.success('Invitation accepted!');
                    await queryClient.invalidateQueries({ queryKey: ['workspaces', user.id] });
                    // Let the effect re-run with the new data
                    setIsProcessing(false);
                    return;
                } catch (error) {
                    toast.error(`Failed to accept invitation: ${error.message}`);
                }
            }

            // --- Step 2: If there are workspaces, set the current one and navigate ---
            if (workspaces && workspaces.length > 0) {
                navigate('/dashboard');
                return;
            }

            // --- Step 3: If no workspaces, create one for the new user ---
            if (workspaces && workspaces.length === 0) {
                try {
                    await supabaseClient.rpc('create_new_workspace_and_start_trial');
                    await queryClient.invalidateQueries({ queryKey: ['workspaces', user.id] });
                } catch (error) {
                    console.error('Failed to create workspace:', error);
                }
            }

            setIsProcessing(false);
        };

        handlePostLogin();
    }, [
        user,
        workspaces,
        isLoadingWorkspaces,
        currentWorkspace,
        navigate,
        setCurrentWorkspace,
        queryClient,
        searchParams,
        isProcessing,
    ]);

    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <AuthForm viewMode={authMode} />
        </div>
    );
}

export default AuthPage;
