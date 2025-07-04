// src/pages/AuthPage.jsx
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

import { useUser } from '../hooks/react-query/user/useUser.js';
import { supabaseClient } from '../lib/supabase.js';
import AuthForm from '../components/auth/AuthForm'; // Your existing form
import { Spinner } from '@heroui/react'; // Or your preferred loader

// A simple component to show while the invitation is processed.
const FinalizingInvite = ({ token }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        const accept = async () => {
            try {
                // Call the exact same RPC from your AcceptInvitePage
                const { error } = await supabaseClient.rpc('accept_workspace_invitation', {
                    invitation_id: token,
                });
                if (error) throw error;

                toast.success('Welcome aboard! You have joined the workspace.');

                // Crucial cleanup and refresh
                localStorage.removeItem('pendingInvitationToken');
                await queryClient.invalidateQueries({ queryKey: ['workspaces'] });

                navigate('/dashboard');
            } catch (error) {
                toast.error(`Failed to accept invitation: ${error.message}`);
                navigate('/'); // Redirect to a safe page on error
            }
        };

        accept();
    }, [token, navigate, queryClient]);

    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <Spinner />
            <p>Finalizing your invitation...</p>
        </div>
    );
};

// This is the main controller component for the `/auth` route.
function AuthPage({ viewMode }) {
    const { data: user, isLoading: isUserLoading } = useUser();
    const [searchParams] = useSearchParams();
    const invitationToken = searchParams.get('invitation_token');

    if (isUserLoading) {
        return (
            <div className="w-screen h-screen flex justify-center items-center">
                <Spinner />
            </div>
        );
    }

    // SCENARIO 1: The invited user has just verified their email.
    // They are now logged in and have the token in the URL.
    if (user && invitationToken) {
        return <FinalizingInvite token={invitationToken} />;
    }

    // SCENARIO 2: Standard case. No user is logged in.
    // Show the form to allow login or signup.
    if (!user) {
        return (
            <div className="w-screen h-screen flex justify-center items-center">
                <AuthForm viewMode={viewMode} />
            </div>
        );
    }

    // SCENARIO 3: Fallback. A logged-in user somehow landed here.
    // The ProtectedRoute should prevent this, but as a safeguard, send them away.
    return <Navigate to="/dashboard" replace />;
}

export default AuthPage;
