import IntegrationCard from '../IntegrationCard.jsx';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    useUserIntegration,
    useDeleteIntegration,
} from '../../../hooks/react-query/integrations/useUserIntegrations.js';
import { useUser } from '../../../hooks/react-query/user/useUser.js';

const TrelloIntegrationCard = () => {
    const { data: user } = useUser();
    const { data: integration, isLoading, isPending } = useUserIntegration(user?.id, 'trello');
    const deleteIntegration = useDeleteIntegration(user.id, 'trello');
    const [status, setStatus] = useState('inactive');
    const [loading, setLoading] = useState(false);

    const handleConnect = () => {
        window.location.href =
            'https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&key=22d71bb66c8e12f0668dd083c1118d2a&callback_method=fragment&return_url=https://weekfuse.com/integrations/oauth/callback/trello';
    };

    const handleDisconnect = () => {
        if (!integration) return;

        setLoading(true);
        deleteIntegration.mutate(
            {
                id: integration.id,
                access_token: integration.access_token,
                type: 'trello',
            },
            {
                onSuccess: () => {
                    setStatus('inactive');
                    toast.success('Trello Integration disconnected');
                },
                onError: (error) => {
                    console.error('Error disconnecting Trello:', error);
                    toast.error('Failed to disconnect Trello Integration');
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
                access_token: integration.access_token,
                type: 'trello',
            },
            {
                onSuccess: () => {
                    setStatus('inactive');
                    toast.success('Trello Integration reset');
                },
                onError: (error) => {
                    console.error('Error resetting Trello:', error);
                    toast.error('Failed to reset Trello Integration');
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
            id="trello"
            name="Trello"
            isLoading={loading}
            isPending={isPending}
            description="Import all Trello cards from boards visible to you."
            status={status}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onReset={handleReset}
            hasConfigOptions={false}
        />
    );
};

export default TrelloIntegrationCard;
