import IntegrationCard from '../IntegrationCard.jsx';
import { RiGithubFill } from 'react-icons/ri';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    useUserIntegration,
    useDeleteIntegration,
} from '../../../hooks/react-query/integrations/useUserIntegrations.js';
import { useUser } from '../../../hooks/react-query/user/useUser.js';

const JiraIntegrationCard = () => {
    const { data: user } = useUser();
    const { data: integration, isLoading, isPending } = useUserIntegration(user?.id, 'jira');
    const deleteIntegration = useDeleteIntegration();
    const [status, setStatus] = useState('inactive');
    const [loading, setLoading] = useState(false);

    const handleConnect = () => {
        window.location.href =
            'https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=O4tGSfMVVADbcB7j7ZtiQKvDuN4ExclE&scope=offline_access%20read%3Ajira-work%20write%3Ajira-work&redirect_uri=https%3A%2F%2Fweekfuse.com%2Fintegrations%2Foauth%2Fcallback%2Fjira&state=${YOUR_USER_BOUND_VALUE}&response_type=code&prompt=consent';
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
            id="jira"
            name="Jira"
            isLoading={loading}
            isPending={isPending}
            icon={<RiGithubFill />}
            description="Import Jira tickets assigned to you."
            status={status}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            hasConfigOptions={false}
        />
    );
};

export default JiraIntegrationCard;
