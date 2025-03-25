import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useApiKeys } from '../hooks/react-query/api-keys/useApiKeys';
import ApiKeyCard from '../components/auth/ApiKeyCard';
import {
    Button,
    Input,
    Link,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from '@heroui/react';
import { useForm } from 'react-hook-form';
import { useCreateApiKey } from '../hooks/react-query/api-keys/useApiKeys';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import { RiAddFill, RiExternalLinkLine } from 'react-icons/ri';

function ApiKeysPage() {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [currentWorkspace] = useCurrentWorkspace();
    const { data } = useApiKeys(currentWorkspace);
    const { mutateAsync: createApiKey, isPending } = useCreateApiKey(currentWorkspace);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        await createApiKey(
            { name: data.name, workspace_id: currentWorkspace.workspace_id },
            {
                onSuccess: () => {
                    toast.success('API key created successfully');
                },
                onError: (error) => {
                    toast.error(error.message);
                },
            },
        );
        onClose();
        reset();
    };

    return (
        <AppLayout>
            <PageLayout
                title="API keys"
                maxW="2xl"
                primaryAction="Create key"
                icon={<RiAddFill fontSize="1.2rem" />}
                description="Automate actions on Mailerfuse from external services using the API"
                onClick={onOpen}
                customElements={
                    <Button
                        as={Link}
                        href="https://docs.mailerfuse.com"
                        isExternal
                        variant="bordered"
                        endContent={<RiExternalLinkLine fontSize="1.2rem" />}
                    >
                        View API docs
                    </Button>
                }
            >
                <div className="flex flex-col gap-3 mb-12">
                    {data?.length ? (
                        data.map((key) => <ApiKeyCard key={key.id} apiKey={key} />)
                    ) : (
                        <EmptyState
                            title="No API keys found"
                            description="Create an API key to get started"
                            primaryAction="Create key"
                            onClick={onOpen}
                        />
                    )}
                </div>
                <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ModalContent>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <ModalHeader className="flex flex-col gap-1">
                                Create API key
                            </ModalHeader>
                            <ModalBody>
                                <p>Add a name to the API key to easily identify it</p>
                                <Input
                                    {...register('name', { required: true })}
                                    label="API key name"
                                    isInvalid={errors.name}
                                    errorMessage="Name is required"
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose} isDisabled={isPending}>
                                    Cancel
                                </Button>
                                <Button color="primary" type="submit" isLoading={isPending}>
                                    Create key
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalContent>
                </Modal>
            </PageLayout>
        </AppLayout>
    );
}

export default ApiKeysPage;
