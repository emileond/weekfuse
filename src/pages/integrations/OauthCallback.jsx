import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import ky from 'ky';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import toast from 'react-hot-toast';
import { Spinner } from '@heroui/react';
import AppLayout from '../../components/layout/AppLayout.jsx';
import { useQueryClient } from '@tanstack/react-query';

const OAuthCallback = () => {
    const { data: user } = useUser();
    const [currentWorkspace] = useCurrentWorkspace();
    const { provider } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();
    const { hash } = useLocation();

    const handleGithubCallback = async ({ code, installation_id }) => {
        setLoading(true);
        try {
            await ky.post('/api/github/auth', {
                json: {
                    code,
                    installation_id,
                    user_id: user.id,
                    workspace_id: currentWorkspace.workspace_id,
                },
            });

            toast.success('GitHub Integration connected');
            await queryClient.cancelQueries({
                queryKey: ['user_integration', user?.id, 'github'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['user_integration', user?.id, 'github'],
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
                    user_id: user.id,
                    workspace_id: currentWorkspace.workspace_id,
                },
            });

            toast.success('Jira Integration connected');
            await queryClient.cancelQueries({
                queryKey: ['user_integration', user?.id, 'jira'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['user_integration', user?.id, 'jira'],
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

    const handleTrelloCallback = async ({ token }) => {
        setLoading(true);
        try {
            await ky.post('/api/trello/auth', {
                json: {
                    access_token: token,
                    user_id: user.id,
                    workspace_id: currentWorkspace.workspace_id,
                },
            });

            toast.success('Trello Integration connected');
            await queryClient.cancelQueries({
                queryKey: ['user_integration', user?.id, 'trello'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['user_integration', user?.id, 'trello'],
            });
        } catch (error) {
            let errorMessage = 'Failed to connect Trello';
            if (error.response) {
                const errorData = await error.response.json();
                errorMessage = errorData.message || errorMessage;
            }
            console.error('Error connecting to Trello:', error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
            navigate('/integrations');
        }
    };

    useEffect(() => {
        if (!user || !currentWorkspace) return;

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
            case 'trello':
                {
                    const params = new URLSearchParams(hash.slice(1));
                    const token = params.get('token');
                    handleTrelloCallback({ token });
                }
                break;
            default:
                toast.error('Unsupported OAuth provider');
        }
    }, [provider, user, currentWorkspace]);

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
