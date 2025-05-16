import {
    Checkbox,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    DropdownSection,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from '@heroui/react';
import {
    RiCalendarCloseLine,
    RiCheckboxCircleFill,
    RiMoreLine,
    RiArrowDownSLine,
} from 'react-icons/ri';
import { useUpdateTask, useDeleteTask } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import {
    useJiraTransitions,
    useJiraTransitionIssue,
} from '../../hooks/react-query/integrations/jira/useJiraTransitions.js';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import { useUserIntegration } from '../../hooks/react-query/integrations/useUserIntegrations.js';
import TaskDetailModal from './TaskDetailModal';
import { useState, useEffect } from 'react';
import EntityChip from '../common/EntityChip.jsx';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { taskCompletedMessages } from '../../utils/toast-messages/taskCompleted.js';
import IntegrationSourceIcon from './integrations/IntegrationSourceIcon.jsx';
import ky from 'ky';

const TaskCard = ({ task, sm }) => {
    const [isCompleted, setIsCompleted] = useState(task?.status === 'completed');
    const [isJiraTransitionLoading, setIsJiraTransitionLoading] = useState(false);
    const { data: user } = useUser();
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateTask } = useUpdateTask(currentWorkspace);
    const { mutateAsync: deleteTask } = useDeleteTask(currentWorkspace);
    const { data: integration } = useUserIntegration(user?.id, task?.integration_source);
    const { data: jiraTransitions } = useJiraTransitions(
        task?.integration_source === 'jira' ? task?.external_id : null,
        currentWorkspace?.workspace_id,
    );
    const { mutateAsync: transitionJiraIssue } = useJiraTransitionIssue();
    const { isOpen, onOpenChange } = useDisclosure();
    const { isOpen: isMenuOpen, onOpenChange: onMenuOpenChange } = useDisclosure();
    const {
        isOpen: isDeleteModalOpen,
        onOpen: onDeleteModalOpen,
        onClose: onDeleteModalClose,
    } = useDisclosure();
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

    const taskDate = dayjs(task?.date);
    const today = dayjs().startOf('day');
    const isOverdue = taskDate.isBefore(today) && task.status === 'pending';

    // Update isCompleted state when task.status changes
    useEffect(() => {
        setIsCompleted(task?.status === 'completed');
    }, [task.status]);

    const handleStatusToggle = async () => {
        // Determine new value by inverting the current state
        const newCompleted = !isCompleted;
        const newStatus = newCompleted ? 'completed' : 'pending';

        setIsCompleted(newCompleted);

        const syncStatus = integration?.config?.syncStatus;

        if (task?.integration_source && syncStatus) {
            switch (syncStatus) {
                case 'auto':
                    return handleSourceStatusUpdate({ newStatus });

                case 'prompt':
                    if (task.integration_source === 'jira') {
                        await updateTaskStatus({ newStatus });
                        return onJiraTransitionsModalOpen();
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
                // call clickup status update api route (to do)
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
            setIsCompleted(newStatus !== 'completed');
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

    const handleAction = (key) => {
        switch (key) {
            case 'delete':
                onDeleteModalOpen();
                break;
            case 'move':
                break;
            default:
                null;
        }
    };

    const handleDelete = async () => {
        try {
            await deleteTask({ taskId: task.id });
            onDeleteModalClose();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    return (
        <>
            <TaskDetailModal isOpen={isOpen} onOpenChange={onOpenChange} task={task} />

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
                <ModalContent>
                    <ModalHeader>Delete Task</ModalHeader>
                    <ModalBody>
                        <p>
                            Are you sure you want to delete &#34;{task.name}&#34;? This action
                            cannot be undone.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onDeleteModalClose}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleDelete}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

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
            <div
                id={task.id}
                className="w-full border-1 border-content3 rounded-xl p-3 bg-content1 hover:bg-content2/50 transition-bg duration-300 ease-in-out cursor-grabbing hover:cursor-pointer"
                onClick={onOpenChange}
            >
                <div className="flex justify-between items-center">
                    <div className="flex gap-1 grow items-center">
                        <Checkbox
                            size={sm ? 'md' : 'lg'}
                            isSelected={isCompleted}
                            onValueChange={handleStatusToggle}
                        />
                        <span
                            className={`font-medium ${
                                isCompleted ? 'line-through text-default-400' : ''
                            } ${sm && 'text-sm'}`}
                        >
                            {task.name}
                        </span>
                    </div>
                    {isOverdue && (
                        <span className="text-xs font-medium text-danger px-6 flex items-center gap-1">
                            <RiCalendarCloseLine fontSize="1rem" />
                            {Intl.DateTimeFormat(navigator.language, {
                                dateStyle: 'medium',
                            }).format(new Date(task?.date))}
                        </span>
                    )}
                    <Dropdown isOpen={isMenuOpen} onOpenChange={onMenuOpenChange}>
                        <DropdownTrigger>
                            <div
                                onClick={onMenuOpenChange}
                                className={`${sm ? 'p-1' : 'p-2'} hover:bg-default-200 rounded-lg`}
                            >
                                <RiMoreLine fontSize="1.2rem" />
                            </div>
                        </DropdownTrigger>
                        <DropdownMenu onAction={(key) => handleAction(key)}>
                            <DropdownItem key="move">Move...</DropdownItem>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                variant="flat"
                                color="danger"
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
                {(task.project_id ||
                    task.milestone_id ||
                    task.tags ||
                    task.tag_id ||
                    (task.priority !== null && task.priority !== undefined) ||
                    task.integration_source) && (
                    <div className="flex gap-2 justify-end flex-wrap pt-2">
                        {task.project_id && (
                            <EntityChip
                                type="project"
                                entityId={task.project_id}
                                size="sm"
                                variant="light"
                            />
                        )}
                        {task.milestone_id && (
                            <EntityChip
                                type="milestone"
                                entityId={task.milestone_id}
                                size="sm"
                                variant="light"
                            />
                        )}
                        {task.tags && Array.isArray(task.tags) && task.tags.length > 0 ? (
                            <EntityChip type="tag" entityId={task.tags} size="sm" variant="light" />
                        ) : (
                            task.tag_id && (
                                <EntityChip
                                    type="tag"
                                    entityId={task.tag_id}
                                    size="sm"
                                    variant="light"
                                />
                            )
                        )}
                        {task.priority !== null && task.priority !== undefined && (
                            <EntityChip
                                type="priority"
                                entityId={task.priority}
                                size="sm"
                                variant="light"
                            />
                        )}
                        {task.integration_source && (
                            <IntegrationSourceIcon type={task.integration_source} />
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default TaskCard;
