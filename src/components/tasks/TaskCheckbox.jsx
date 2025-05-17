import {
    Button,
    Checkbox,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownSection,
    DropdownTrigger,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure,
} from '@heroui/react';
import { useState } from 'react';
import ky from 'ky';
import toast from 'react-hot-toast';
import { taskCompletedMessages } from '../../utils/toast-messages/taskCompleted.js';
import { RiArrowDownSLine, RiCheckboxCircleFill } from 'react-icons/ri';
import { useUserIntegration } from '../../hooks/react-query/integrations/useUserIntegrations.js';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import {
    useJiraTransitions,
    useJiraTransitionIssue,
} from '../../hooks/react-query/integrations/jira/useJiraTransitions.js';
import { useUpdateTask } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';

const TaskCheckbox = ({ task, isCompleted, onChange, sm }) => {
    const { data: user } = useUser();
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: integration } = useUserIntegration(user?.id, task?.integration_source);
    const { mutateAsync: updateTask } = useUpdateTask(currentWorkspace);
    const [isJiraTransitionLoading, setIsJiraTransitionLoading] = useState(false);
    const [isClickUpStatusLoading, setIsClickUpStatusLoading] = useState(false);
    const { data: jiraTransitions } = useJiraTransitions(
        task?.integration_source === 'jira' ? task?.external_id : null,
        currentWorkspace?.workspace_id,
    );
    const { mutateAsync: transitionJiraIssue } = useJiraTransitionIssue();
    const {
        isOpen: isSyncModalOpen,
        onOpen: onSyncModalOpen,
        onClose: onSyncModalClose,
    } = useDisclosure();
    const {
        isOpen: isJiraTransitionsModalOpen,
        onOpen: onJiraTransitionsModalOpen,
        onClose: onJiraTransitionsModalClose,
    } = useDisclosure();
    const {
        isOpen: isClickUpStatusModalOpen,
        onOpen: onClickUpStatusModalOpen,
        onClose: onClickUpStatusModalClose,
    } = useDisclosure();

    const handleStatusToggle = async () => {
        // Determine new value by inverting the current state
        const newCompleted = !isCompleted;
        const newStatus = newCompleted ? 'completed' : 'pending';

        onChange(newCompleted);

        const syncStatus = integration?.config?.syncStatus;

        if (task?.integration_source && syncStatus) {
            switch (syncStatus) {
                case 'auto':
                    return handleSourceStatusUpdate({ newStatus });

                case 'prompt':
                    if (task.integration_source === 'jira') {
                        await updateTaskStatus({ newStatus });
                        return onJiraTransitionsModalOpen();
                    } else if (task.integration_source === 'clickup') {
                        await updateTaskStatus({ newStatus });
                        return onClickUpStatusModalOpen();
                    } else {
                        return onSyncModalOpen();
                    }
                case 'never':
                    break;
            }
        } else return updateTaskStatus({ newStatus });
    };

    const handleSourceStatusUpdate = async ({ newStatus }) => {
        await updateTaskStatus({ newStatus });
        switch (task?.integration_source) {
            case 'trello':
                try {
                    const state = newStatus;
                    await ky.patch('/api/trello/task', {
                        json: {
                            external_id: task.external_id,
                            state,
                            user_id: user.id,
                        },
                    });
                } catch (error) {
                    console.error('Error updating Trello task:', error);
                }
                break;

            case 'github':
                try {
                    const state = newStatus === 'completed' ? 'closed' : 'open';
                    await ky.patch('/api/github/task', {
                        json: {
                            external_id: task.external_id,
                            url: task.external_data?.url,
                            state,
                            user_id: user.id,
                        },
                    });
                } catch (error) {
                    console.error('Error updating GitHub task:', error);
                }
                break;

            case 'jira':
                // For Jira, we don't automatically update the status here
                // Instead, we show the transitions modal when syncStatus is "prompt"
                // and handle the transition in handleJiraTransition
                break;

            case 'clickup':
                // For ClickUp, we don't automatically update the status here when syncStatus is "prompt"
                // Instead, we show the status selection modal when syncStatus is "prompt"
                // and handle the status update in handleClickUpStatus
                break;
        }
    };

    const handleSyncConfirm = async () => {
        const newStatus = isCompleted ? 'completed' : 'pending';
        await handleSourceStatusUpdate({ newStatus });
        onSyncModalClose();
    };

    const handleJiraTransition = async (transitionId) => {
        setIsJiraTransitionLoading(true);
        try {
            await transitionJiraIssue({
                issueIdOrKey: task?.external_id,
                transitionId,
                workspace_id: currentWorkspace?.workspace_id,
            });
            toast.success('Jira status updated');
            onJiraTransitionsModalClose();
        } catch (error) {
            toast.error(error.message || 'Failed to update Jira status');
        } finally {
            setIsJiraTransitionLoading(false);
        }
    };

    const handleClickUpStatus = async (status) => {
        setIsClickUpStatusLoading(true);
        try {
            await ky.patch('/api/clickup/task', {
                json: {
                    external_id: task.external_id,
                    status,
                    user_id: user.id,
                },
            });
            toast.success('ClickUp status updated');
            onClickUpStatusModalClose();
        } catch (error) {
            toast.error(error.message || 'Failed to update ClickUp status');
        } finally {
            setIsClickUpStatusLoading(false);
        }
    };

    const updateTaskStatus = async ({ newStatus }) => {
        try {
            await updateTask({
                taskId: task.id,
                updates: {
                    status: newStatus,
                    completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
                },
            });
        } catch (error) {
            // If there is an error, revert the state change (you might need to do more error handling)
            onChange(newStatus !== 'completed');
            console.error('Error toggling task status:', error);
        } finally {
            if (newStatus === 'completed') {
                const randomMessage =
                    taskCompletedMessages[Math.floor(Math.random() * taskCompletedMessages.length)];
                toast.success(randomMessage.message, {
                    duration: 5000,
                    icon: randomMessage?.icon || (
                        <RiCheckboxCircleFill className="text-success" fontSize="2rem" />
                    ),
                    style: {
                        fontWeight: 500,
                    },
                });
            }
        }
    };

    return (
        <>
            <Checkbox
                size={sm ? 'md' : 'lg'}
                isSelected={isCompleted}
                onValueChange={handleStatusToggle}
            />
            {/* Sync Status Modal */}
            <Modal isOpen={isSyncModalOpen} onClose={onSyncModalClose}>
                <ModalContent>
                    <ModalHeader>Update External Task</ModalHeader>
                    <ModalBody>
                        <p>
                            Do you want to update the status in {task?.integration_source} as well?
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onSyncModalClose}>
                            No
                        </Button>
                        <Button color="primary" onPress={handleSyncConfirm}>
                            Yes, Update
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Jira Transitions Modal */}
            <Modal isOpen={isJiraTransitionsModalOpen} onClose={onJiraTransitionsModalClose}>
                <ModalContent>
                    <ModalHeader>Update Jira Status</ModalHeader>
                    <ModalBody>
                        <p className="mb-3">Do you want to move the issue in Jira?</p>
                        <div>
                            <p className="mb-1 text-sm font-medium">Status:</p>
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        className="font-medium w-full"
                                        endContent={<RiArrowDownSLine fontSize="1rem" />}
                                        isLoading={isJiraTransitionLoading}
                                    >
                                        {task?.external_data?.fields?.status?.name ||
                                            'Select status'}
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu>
                                    <DropdownSection title="Move to:">
                                        {jiraTransitions?.map((item) => (
                                            <DropdownItem
                                                key={item.id}
                                                onPress={() => handleJiraTransition(item.id)}
                                            >
                                                {item.name}
                                            </DropdownItem>
                                        ))}
                                    </DropdownSection>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onJiraTransitionsModalClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ClickUp Status Modal */}
            <Modal
                isOpen={isClickUpStatusModalOpen}
                onClose={onClickUpStatusModalClose}
                onClick={(e) => e.stopPropagation()}
            >
                <ModalContent>
                    <ModalHeader>Update ClickUp Status</ModalHeader>
                    <ModalBody>
                        <p className="mb-3">Do you want to move the task in ClickUp?</p>
                        <div>
                            <p className="mb-1 text-sm font-medium">Status:</p>
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        className="font-medium w-full"
                                        endContent={<RiArrowDownSLine fontSize="1rem" />}
                                        isLoading={isClickUpStatusLoading}
                                    >
                                        {task?.external_data?.status?.status || 'Select status'}
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu>
                                    <DropdownSection title="Move to:">
                                        <DropdownItem onPress={() => handleClickUpStatus('to do')}>
                                            To Do
                                        </DropdownItem>
                                        <DropdownItem
                                            onPress={() => handleClickUpStatus('in progress')}
                                        >
                                            In Progress
                                        </DropdownItem>
                                        <DropdownItem
                                            onPress={() => handleClickUpStatus('complete')}
                                        >
                                            Complete
                                        </DropdownItem>
                                    </DropdownSection>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClickUpStatusModalClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default TaskCheckbox;
