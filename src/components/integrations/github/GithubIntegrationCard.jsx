import IntegrationCard from '../IntegrationCard.jsx';
import { RiGithubFill } from 'react-icons/ri';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useUser } from '../../../hooks/react-query/user/useUser.js';
import {
    useUserIntegration,
    useDeleteIntegration,
} from '../../../hooks/react-query/integrations/useUserIntegrations.js';

const GithubIntegrationCard = () => {
    const { data: user } = useUser();
    const { data: integration, isLoading, isPending } = useUserIntegration(user?.id, 'github');
    const deleteIntegration = useDeleteIntegration();
    const [status, setStatus] = useState('inactive');
    const [loading, setLoading] = useState(false);

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

    const handleReset = () => {
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
            onReset={handleReset}
            hasConfigOptions={false}
        />
    );
};

export default GithubIntegrationCard;
