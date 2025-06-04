import IntegrationCard from '../IntegrationCard.jsx';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    useUserIntegration,
    useDeleteIntegration,
    useUpdateIntegrationConfig,
} from '../../../hooks/react-query/integrations/useUserIntegrations.js';
import { useUser } from '../../../hooks/react-query/user/useUser.js';
import { useForm, Controller } from 'react-hook-form';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Switch,
} from '@heroui/react';
import useCurrentWorkspace from '../../../hooks/useCurrentWorkspace.js';
import { useQueryClient } from '@tanstack/react-query';

const JiraIntegrationCard = () => {
    const { data: user } = useUser();
    const { data: integration, isLoading, isPending } = useUserIntegration(user?.id, 'jira');
    const deleteIntegration = useDeleteIntegration(user.id, 'jira');
    const updateIntegrationConfig = useUpdateIntegrationConfig(user.id, 'jira');
    const [status, setStatus] = useState('inactive');
    const [loading, setLoading] = useState(false);
    const [currentWorkspace] = useCurrentWorkspace();
    const queryClient = useQueryClient();

    // Configuration modal state
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Form setup with react-hook-form
    const {
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm();

    const handleConnect = () => {
        window.location.href =
            'https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=O4tGSfMVVADbcB7j7ZtiQKvDuN4ExclE&scope=offline_access%20read%3Ajira-work%20write%3Ajira-work%20manage%3Ajira-webhook%20read%3Ajira-user&redirect_uri=https%3A%2F%2Fweekfuse.com%2Fintegrations%2Foauth%2Fcallback%2Fjira&response_type=code&prompt=consent';
    };

    const handleDisconnect = () => {
        if (!integration) return;

        setLoading(true);
        deleteIntegration.mutate(
            {
                id: integration.id,
                installation_id: integration.installation_id,
                type: 'jira',
            },
            {
                onSuccess: () => {
                    setStatus('inactive');
                    toast.success('Jira Integration disconnected');
                    // Invalidate all task-related queries for the workspace
                    queryClient.invalidateQueries({
                        queryKey: ['tasks', currentWorkspace?.workspace_id],
                        refetchType: 'all',
                    });
                    queryClient.invalidateQueries({
                        queryKey: ['backlogTasks', currentWorkspace?.workspace_id],
                        refetchType: 'all',
                    });
                },
                onError: (error) => {
                    console.error('Error disconnecting Jira:', error);
                    toast.error('Failed to disconnect Jira Integration');
                },
                onSettled: () => {
                    setLoading(false);
                },
            },
        );
    };

    const handleConfigure = () => {
        // Set default values from existing config when opening the modal
        if (integration && integration.config && integration.config.syncStatus) {
            setValue('syncStatus', integration.config.syncStatus === 'prompt');
        } else {
            // Default to false (never) if no config exists
            setValue('syncStatus', false);
        }
        onOpen();
    };

    const onSubmit = (data) => {
        if (!integration) return;

        setLoading(true);
        // Use form data for the config
        const config = {
            syncStatus: data.syncStatus ? 'prompt' : 'never',
        };

        updateIntegrationConfig.mutate(
            {
                id: integration.id,
                config,
            },
            {
                onSuccess: () => {
                    toast.success('Jira configuration saved');
                    onClose();
                },
                onError: (error) => {
                    console.error('Error saving Jira configuration:', error);
                    toast.error('Failed to save Jira configuration');
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

            // Set form values if integration config exists
            if (integration.config && integration.config.syncStatus) {
                setValue('syncStatus', integration.config.syncStatus === 'prompt');
            }
        }
    }, [integration, isLoading, setValue]);

    return (
        <>
            <IntegrationCard
                id="jira"
                name="Jira"
                isLoading={loading}
                isPending={isPending}
                description="Import Jira tickets assigned to you."
                status={status}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onReset={handleDisconnect}
                onConfigure={handleConfigure}
                hasConfigOptions={true}
            />

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <form onSubmit={handleSubmit(onSubmit)} id="jira-config">
                        <ModalHeader>Jira Configuration</ModalHeader>
                        <ModalBody>
                            <div className="space-y-3">
                                <span className="font-semibold">Status sync</span>
                                <p className="text-default-600 text-sm">
                                    What should happen when you change the status of an imported
                                    task?
                                </p>
                                <Controller
                                    name="syncStatus"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                isSelected={field.value}
                                                onValueChange={field.onChange}
                                            />
                                            <span>Show prompt to move</span>
                                        </div>
                                    )}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                type="submit"
                                form="jira-config"
                                isLoading={loading}
                            >
                                Save
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </>
    );
};

export default JiraIntegrationCard;
