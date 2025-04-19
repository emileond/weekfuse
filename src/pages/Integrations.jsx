import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import IntegrationCard from '../components/integrations/IntegrationCard';
import { RiGithubFill, RiSlackFill } from 'react-icons/ri';
import { Link } from '@heroui/react';
import GithubIntegrationCard from '../components/integrations/github/GithubIntegrationCard.jsx';
import JiraIntegrationCard from '../components/integrations/jira/JiraIntegrationCard.jsx';
import TrelloIntegrationCard from '../components/integrations/trello/TrelloIntegrationCard.jsx';
import ClickupIntegrationCard from '../components/integrations/clickup/ClickupIntegrationCard.jsx';

function IntegrationsPage() {
    // Define all integrations with GitHub having dynamic status and handlers
    const integrations = [
        {
            id: 'slack',
            name: 'Slack',
            icon: <RiSlackFill />,
            status: 'soon',
            description: 'Get notifications and updates directly in your Slack channels.',
            hasConfigOptions: false,
        },
        {
            id: 'zapier',
            name: 'Zapier',
            icon: <RiGithubFill />,
            status: 'soon',
            description: 'Connect with thousands of apps through Zapier automations.',
            hasConfigOptions: true,
        },
    ];

    return (
        <AppLayout>
            <PageLayout title="Integrations" maxW="6xl">
                <p className="mb-6">
                    Have a suggestion? Add it to the{' '}
                    <Link
                        href={`${import.meta.env.VITE_PUBLIC_URL}/feature-requests`}
                        isExternal
                        showAnchorIcon
                    >
                        Feature Requests Board
                    </Link>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <GithubIntegrationCard />
                    <JiraIntegrationCard />
                    <TrelloIntegrationCard />
                    <ClickupIntegrationCard />
                    {integrations?.map((integration) => (
                        <IntegrationCard
                            key={integration.id}
                            id={integration.id}
                            name={integration.name}
                            icon={integration.icon}
                            status={integration.status}
                            description={integration.description}
                            hasConfigOptions={integration.hasConfigOptions}
                            onConnect={integration.onConnect}
                            onDisconnect={integration.onDisconnect}
                            onConfigure={integration.onConfigure}
                        />
                    ))}
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default IntegrationsPage;
