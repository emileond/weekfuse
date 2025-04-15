import IntegrationCard from '../IntegrationCard.jsx';
import { RiGithubFill } from 'react-icons/ri';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ky from 'ky';
import toast from 'react-hot-toast';
import useCurrentWorkspace from '../../../hooks/useCurrentWorkspace.js';
import {
    useWorkspaceIntegration,
    useDeleteIntegration,
} from '../../../hooks/react-query/integrations/useWorkspaceIntegrations.js';

const GithubIntegrationCard = () => {
    const [currentWorkspace] = useCurrentWorkspace();
    const {
        data: integration,
        isLoading,
        isPending,
    } = useWorkspaceIntegration(currentWorkspace, 'github');
    const deleteIntegration = useDeleteIntegration();
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState('inactive');
    const [loading, setLoading] = useState(false);
    const processedCodeRef = useRef(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const installation_id = searchParams.get('installation_id');

        if (code && !loading && currentWorkspace && processedCodeRef.current !== code) {
            setLoading(true);
            // Store the code we're processing to prevent duplicate processing
            processedCodeRef.current = code;

            // Clear the URL parameters before making the API call
            setSearchParams('');

            // Exchange code for access token
            ky.post('/api/github/auth', {
                json: {
                    code,
                    installation_id,
                    workspace_id: currentWorkspace.workspace_id,
                },
            })
                .json()
                .then((response) => {
                    if (response.success) {
                        setStatus('active');
                        toast.success('Github Integration connected');
                    } else {
                        toast.error('Failed to connect Github Integration');
                    }
                })
                .catch((error) => {
                    console.error('Error connecting to Github:', error);
                    toast.error('Failed to connect Github Integration');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [currentWorkspace, loading, searchParams, setSearchParams]);

    const handleConnect = () => {
        window.location.href = 'https://github.com/apps/weekfuse/installations/new';
    };

    const handleDisconnect = () => {
        if (!integration) return;

        setLoading(true);
        deleteIntegration.mutate(
            {
                id: integration.id,
                installation_id: integration.installation_id,
                type: 'github',
            },
            {
                onSuccess: () => {
                    setStatus('inactive');
                    toast.success('Github Integration disconnected');
                },
                onError: (error) => {
                    console.error('Error disconnecting Github:', error);
                    toast.error('Failed to disconnect Github Integration');
                },
                onSettled: () => {
                    setLoading(false);
                },
            },
        );
    };

    useEffect(() => {
        setLoading(isLoading);
        if (integration) {
            setStatus(integration.status);
        }
    }, [integration, isLoading]);

    return (
        <IntegrationCard
            id="github"
            name="Github"
            isLoading={loading}
            isPending={isPending}
            icon={<RiGithubFill />}
            description="Import GitHub issues assigned to you."
            status={status}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            hasConfigOptions={false}
        />
    );
};

export default GithubIntegrationCard;
