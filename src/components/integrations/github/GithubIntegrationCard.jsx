import IntegrationCard from '../IntegrationCard.jsx';
import { RiGithubFill } from 'react-icons/ri';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useUser } from '../../../hooks/react-query/user/useUser.js';
import {
    useUserIntegration,
    useDeleteIntegration,
    useUpdateIntegrationConfig,
} from '../../../hooks/react-query/integrations/useUserIntegrations.js';
import { useForm, Controller } from 'react-hook-form';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    RadioGroup,
    Radio,
} from '@heroui/react';

const GithubIntegrationCard = () => {
    const { data: user } = useUser();
    const { data: integration, isLoading, isPending } = useUserIntegration(user?.id, 'github');
    const deleteIntegration = useDeleteIntegration(user.id, 'github');
    const updateIntegrationConfig = useUpdateIntegrationConfig(user.id, 'github');
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

    const handleConfigure = () => {
        // Set default values from existing config when opening the modal
        if (integration && integration.config && integration.config.syncStatus) {
            setValue('syncStatus', integration.config.syncStatus);
        } else {
            // Default to 'auto' if no config exists
            setValue('syncStatus', 'auto');
        }
        onOpen();
    };

    const onSubmit = (data) => {
        if (!integration) return;

        setLoading(true);
        // Use form data for the config
        const config = {
            syncStatus: data.syncStatus,
        };

        updateIntegrationConfig.mutate(
            {
                id: integration.id,
                config,
            },
            {
                onSuccess: () => {
                    toast.success('Github configuration saved');
                    onClose();
                },
                onError: (error) => {
                    console.error('Error saving Github configuration:', error);
                    toast.error('Failed to save Github configuration');
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
    }, [integration, isLoading, setValue]);

    return (
        <>
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
                onConfigure={handleConfigure}
                hasConfigOptions={true}
            />

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <form onSubmit={handleSubmit(onSubmit)} id="github-config">
                        <ModalHeader>Github Configuration</ModalHeader>
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
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <Radio value="auto">Update on Github</Radio>
                                            <Radio value="prompt">
                                                Show prompt to update on Github
                                            </Radio>
                                            <Radio value="never">Don&apos;t update on Github</Radio>
                                        </RadioGroup>
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
                                form="github-config"
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

export default GithubIntegrationCard;
