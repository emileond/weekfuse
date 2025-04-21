import IntegrationCard from '../IntegrationCard.jsx';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    useUserIntegration,
    useDeleteIntegration,
} from '../../../hooks/react-query/integrations/useUserIntegrations.js';
import { useUser } from '../../../hooks/react-query/user/useUser.js';

const ClickupIntegrationCard = () => {
    const { data: user } = useUser();
    const { data: integration, isLoading, isPending } = useUserIntegration(user?.id, 'clickup');
    const deleteIntegration = useDeleteIntegration(user.id, 'clickup');
    const [status, setStatus] = useState('inactive');
    const [loading, setLoading] = useState(false);

    const handleConnect = () => {
        window.location.href =
            'https://app.clickup.com/api?client_id=MZHWY0X3R4B24M2XKEV344LUGJZLRVBH&redirect_uri=http://localhost:8788/integrations/oauth/callback/clickup';
    };

    const handleDisconnect = () => {
        if (!integration) return;

        setLoading(true);
        deleteIntegration.mutate(
            {
                id: integration.id,
                access_token: integration.access_token,
                type: 'clickup',
            },
            {
                onSuccess: () => {
                    setStatus('inactive');
                    toast.success('Clickup Integration disconnected');
                },
                onError: (error) => {
                    console.error('Error disconnecting Clickup:', error);
                    toast.error('Failed to disconnect Clickup Integration');
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
                type: 'clickup',
            },
            {
                onSuccess: () => {
                    setStatus('inactive');
                    toast.success('Clickup Integration reset');
                },
                onError: (error) => {
                    console.error('Error resetting Clickup:', error);
                    toast.error('Failed to reset Clickup Integration');
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
            id="clickup"
            name="Clickup"
            isLoading={loading}
            isPending={isPending}
            description="Import all Clickup tasks assigned to you."
            status={status}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onReset={handleReset}
            hasConfigOptions={false}
        />
    );
};

export default ClickupIntegrationCard;
