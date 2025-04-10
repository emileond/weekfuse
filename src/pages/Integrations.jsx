import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import IntegrationCard from '../components/integrations/IntegrationCard';
import {
    RiGithubFill,
    RiGoogleFill,
    RiMailLine,
    RiSlackFill,
    RiTwitterXFill,
} from 'react-icons/ri';
import {
    Link,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Checkbox,
} from '@heroui/react';
import { useUser } from '../hooks/react-query/user/useUser.js';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace.js';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

function IntegrationsPage() {
    const { user, session } = useUser();
    const [currentWorkspace] = useCurrentWorkspace();
    const [searchParams, setSearchParams] = useSearchParams();

    // State for GitHub integration
    const [githubStatus, setGithubStatus] = useState('inactive');
    const [githubTickets, setGithubTickets] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [isImportingTickets, setIsImportingTickets] = useState(false);

    // Modal for GitHub tickets
    const {
        isOpen: isTicketsModalOpen,
        onOpen: onTicketsModalOpen,
        onClose: onTicketsModalClose,
    } = useDisclosure();

    // Check if GitHub is connected on component mount and when URL params change
    useEffect(() => {
        const checkGithubConnection = async () => {
            if (!user || !session) return;

            try {
                const response = await fetch('/api/github/tickets', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                });

                // If the response is 200, GitHub is connected
                if (response.ok) {
                    setGithubStatus('active');
                }
            } catch (error) {
                console.error('Error checking GitHub connection:', error);
            }
        };

        checkGithubConnection();

        // Check if we just connected GitHub (URL param)
        const githubConnected = searchParams.get('github_connected');
        if (githubConnected === 'true') {
            setGithubStatus('active');
            toast({
                title: 'GitHub Connected',
                description: 'Your GitHub account has been successfully connected.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            // Remove the query parameter
            searchParams.delete('github_connected');
            setSearchParams(searchParams);
        }
    }, [user, session, searchParams, setSearchParams, toast]);

    // Handle GitHub connect action
    const handleGithubConnect = useCallback(() => {
        if (!user || !session) {
            toast({
                title: 'Authentication Required',
                description: 'Please sign in to connect GitHub.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // Redirect to the GitHub OAuth endpoint
        window.location.href = `/api/github/auth`;
    }, [user, session, toast]);

    // Handle GitHub disconnect action
    const handleGithubDisconnect = useCallback(async () => {
        if (!user || !session) return;

        try {
            const response = await fetch('/api/github/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action: 'disconnect' }),
            });

            if (response.ok) {
                setGithubStatus('inactive');
                toast({
                    title: 'GitHub Disconnected',
                    description: 'Your GitHub account has been disconnected.',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to disconnect GitHub');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }, [user, session, toast]);

    // Handle GitHub configure action (show tickets modal)
    const handleGithubConfigure = useCallback(async () => {
        if (!user || !session) return;

        setIsLoadingTickets(true);

        try {
            const response = await fetch('/api/github/tickets', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setGithubTickets(data.tickets || []);
                onTicketsModalOpen();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch GitHub tickets');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoadingTickets(false);
        }
    }, [user, session, onTicketsModalOpen, toast]);

    // Handle ticket selection
    const handleTicketSelect = useCallback((ticketId) => {
        setSelectedTickets((prev) => {
            if (prev.includes(ticketId)) {
                return prev.filter((id) => id !== ticketId);
            } else {
                return [...prev, ticketId];
            }
        });
    }, []);

    // Handle import tickets action
    const handleImportTickets = useCallback(async () => {
        if (!user || !session || !currentWorkspace || selectedTickets.length === 0) return;

        setIsImportingTickets(true);

        try {
            const response = await fetch('/api/github/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    ticketIds: selectedTickets,
                    workspaceId: currentWorkspace.id,
                }),
            });

            if (response.ok) {
                toast({
                    title: 'Tickets Imported',
                    description: `Successfully imported ${selectedTickets.length} GitHub tickets as tasks.`,
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
                onTicketsModalClose();
                setSelectedTickets([]);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to import GitHub tickets');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsImportingTickets(false);
        }
    }, [user, session, currentWorkspace, selectedTickets, onTicketsModalClose, toast]);
    // Define all integrations with GitHub having dynamic status and handlers
    const integrations = [
        {
            id: 'github',
            name: 'GitHub',
            icon: <RiGithubFill />,
            status: githubStatus, // active inactive or soon
            description: 'Import GitHub issues assigned to you as tasks.',
            hasConfigOptions: true, // Enable configure option to import tickets
            onConnect: handleGithubConnect,
            onDisconnect: handleGithubDisconnect,
            onConfigure: handleGithubConfigure,
        },
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

            {/* GitHub Tickets Modal */}
            <Modal isOpen={isTicketsModalOpen} onClose={onTicketsModalClose} size="xl">
                <ModalContent>
                    <ModalHeader>Import GitHub Tickets</ModalHeader>
                    <ModalBody>
                        {isLoadingTickets ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : githubTickets.length === 0 ? (
                            <div className="text-center py-8">
                                <p>No GitHub tickets found assigned to you.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {githubTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                isSelected={selectedTickets.includes(ticket.id)}
                                                onValueChange={() => handleTicketSelect(ticket.id)}
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-medium">{ticket.title}</h3>
                                                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded">
                                                        {ticket.repository.name}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {ticket.description || 'No description'}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {ticket.labels.map((label) => (
                                                        <span
                                                            key={label.name}
                                                            className="text-xs px-2 py-1 rounded"
                                                            style={{
                                                                backgroundColor: `#${label.color}20`,
                                                                color: `#${label.color}`,
                                                            }}
                                                        >
                                                            {label.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-2">
                                                    <a
                                                        href={ticket.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-500 hover:underline"
                                                    >
                                                        View on GitHub
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onTicketsModalClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleImportTickets}
                            isDisabled={selectedTickets.length === 0 || isImportingTickets}
                            isLoading={isImportingTickets}
                        >
                            Import {selectedTickets.length > 0 ? `(${selectedTickets.length})` : ''}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </AppLayout>
    );
}

export default IntegrationsPage;
