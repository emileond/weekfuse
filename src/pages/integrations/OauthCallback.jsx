import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ky from 'ky';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import toast from 'react-hot-toast';
import { Spinner } from '@heroui/react';
import AppLayout from '../../components/layout/AppLayout.jsx';
import { useQueryClient } from '@tanstack/react-query';

const OAuthCallback = () => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { provider } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    const handleGithubCallback = async ({ code, installation_id }) => {
        setLoading(true);
        try {
            await ky.post('/api/github/auth', {
                json: {
                    code,
                    installation_id,
                    workspace_id: currentWorkspace.workspace_id,
                },
            });

            toast.success('GitHub Integration connected');
            await queryClient.cancelQueries({
                queryKey: ['workspace_integration', currentWorkspace?.workspace_id, 'github'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['workspace_integration', currentWorkspace?.workspace_id, 'github'],
            });
        } catch (error) {
            let errorMessage = 'Failed to connect GitHub Integration';
            if (error.response) {
                const errorData = await error.response.json();
                errorMessage = errorData.message || errorMessage;
            }
            console.error('Error connecting to GitHub:', error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
            navigate('/integrations');
        }
    };

    const handleJiraCallback = async ({ code }) => {
        setLoading(true);
        try {
            await ky.post('/api/jira/auth', {
                json: {
                    code,
                    workspace_id: currentWorkspace.workspace_id,
                },
            });

            toast.success('Jira Integration connected');
            await queryClient.cancelQueries({
                queryKey: ['workspace_integration', currentWorkspace?.workspace_id, 'jira'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['workspace_integration', currentWorkspace?.workspace_id, 'jira'],
            });
        } catch (error) {
            let errorMessage = 'Failed to connect Jira Integration';
            if (error.response) {
                const errorData = await error.response.json();
                errorMessage = errorData.message || errorMessage;
            }
            console.error('Error connecting to Jira:', error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
            navigate('/integrations');
        }
    };

    useEffect(() => {
        if (!currentWorkspace) return;

        const code = searchParams.get('code');

        switch (provider) {
            case 'github': {
                const installation_id = searchParams.get('installation_id');
                handleGithubCallback({ code, installation_id });

                break;
            }
            case 'jira':
                handleJiraCallback({ code });
                break;
            default:
                toast.error('Unsupported OAuth provider');
        }
    }, [provider, currentWorkspace]);

    if (loading)
        return (
            <AppLayout>
                <div className="fixed top-0 w-full h-full flex justify-center items-center bg-content3">
                    <Spinner size="lg" label="Working on it..." />
                </div>
            </AppLayout>
        );
};

export default OAuthCallback;
