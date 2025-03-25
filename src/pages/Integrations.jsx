import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import IntegrationCard from '../components/integrations/IntegrationCard';
import {
    RiCalendarLine,
    RiChatPollLine,
    RiCustomerService2Line,
    RiGithubFill,
    RiGoogleFill,
    RiMailLine,
    RiShoppingCartLine,
    RiSlackFill,
    RiTwitterXFill,
} from 'react-icons/ri';
import { Link } from '@heroui/react';

function IntegrationsPage() {
    const mockIntegrations = [
        {
            id: 'mailchimp',
            name: 'Mailchimp',
            icon: <RiMailLine />,
            status: 'soon', // active inactive or soon
            description: 'Connect your Mailchimp account to validate email lists.',
            hasConfigOptions: true,
        },
        {
            id: 'listmonk',
            name: 'Listmonk',
            icon: <RiGoogleFill />,
            status: 'soon',
            description: 'Connect your Listmonk account to validate email contacts.',
            hasConfigOptions: true,
        },
        {
            id: 'slack',
            name: 'Slack',
            icon: <RiSlackFill />,
            status: 'soon',
            description: 'Get notifications and updates directly in your Slack channels.',
            hasConfigOptions: false,
        },
        {
            id: 'sendgrid',
            name: 'Sendgrid',
            icon: <RiTwitterXFill />,
            status: 'soon',
            description: 'Connect your Sendgrid account to validate email lists.',
            hasConfigOptions: false,
        },
        {
            id: 'activecampaign',
            name: 'ActiveCampaign',
            icon: <RiGithubFill />,
            status: 'soon',
            description: 'Connect your ActiveCampaign account to validate email lists.',
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
                    {mockIntegrations.map((integration) => (
                        <IntegrationCard
                            id={integration.id}
                            name={integration.name}
                            status={integration.status}
                            description={integration.description}
                            hasConfigOptions={integration.hasConfigOptions}
                        />
                    ))}
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default IntegrationsPage;
