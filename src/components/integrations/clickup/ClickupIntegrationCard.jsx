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

const ClickupIntegrationCard = () => {
    const { data: user } = useUser();
    const { data: integration, isLoading, isPending } = useUserIntegration(user?.id, 'clickup');
    const deleteIntegration = useDeleteIntegration(user.id, 'clickup');
    const updateIntegrationConfig = useUpdateIntegrationConfig(user.id, 'clickup');
    const [status, setStatus] = useState('inactive');
    const [loading, setLoading] = useState(false);

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
                    toast.success('Clickup configuration saved');
                    onClose();
                },
                onError: (error) => {
                    console.error('Error saving Clickup configuration:', error);
                    toast.error('Failed to save Clickup configuration');
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
                id="clickup"
                name="Clickup"
                isLoading={loading}
                isPending={isPending}
                description="Import all Clickup tasks assigned to you."
                status={status}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onReset={handleReset}
                onConfigure={handleConfigure}
                hasConfigOptions={true}
            />

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <form onSubmit={handleSubmit(onSubmit)} id="clickup-config">
                        <ModalHeader>Clickup Configuration</ModalHeader>
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
                                            <span>Show prompt to update on Clickup</span>
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
                                form="clickup-config"
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

export default ClickupIntegrationCard;
