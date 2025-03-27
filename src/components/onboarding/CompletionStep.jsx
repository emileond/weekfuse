import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { PiCheckCircleDuotone } from 'react-icons/pi';
import { supabaseClient } from '../../lib/supabase.js';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../../hooks/react-query/user/useUser';
import toast from 'react-hot-toast';
import ky from 'ky';

function CompletionStep({ currentWorkspace }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();
    const { data: user } = useUser();

    // Function to update workspace onboarding status
    const updateWorkspaceOnboarding = async () => {
        if (!currentWorkspace) {
            return;
        }

        setIsLoading(true);
        try {
            // Get the current session
            const { data: sessionData } = await supabaseClient.auth.getSession();

            // Make a request to the API endpoint to update onboarding status
            await ky
                .post('/api/update-workspace', {
                    json: {
                        updateData: {
                            onboarded: true,
                        },
                        workspaceId: currentWorkspace.workspace_id,
                        session: sessionData.session,
                    },
                })
                .json();

            // Invalidate workspaces query to refresh data
            if (user?.id) {
                await queryClient.invalidateQueries(['workspaces', user.id]);
            }
        } catch (error) {
            console.error('Error updating workspace onboarding status:', error);
            toast.error('Failed to update workspace status.');
        } finally {
            setIsLoading(false);
        }
    };

    // Update workspace when component mounts
    useEffect(() => {
        updateWorkspaceOnboarding();
    }, [currentWorkspace, user, queryClient]);

    // Function to handle navigation to dashboard
    const goToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="mb-6 flex flex-col">
            <p className="mb-6">Head over to your dashboard to get started.</p>
            <div className="my-6">
                <PiCheckCircleDuotone className="text-success-500 text-8xl mx-auto" />
            </div>
            <Button color="primary" size="lg" onPress={goToDashboard} isLoading={isLoading}>
                Go to Dashboard
            </Button>
        </div>
    );
}

export default CompletionStep;
