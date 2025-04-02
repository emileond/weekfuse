import {
    Checkbox,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from '@heroui/react';
import { RiCalendarCloseLine, RiCheckboxCircleFill, RiMoreLine } from 'react-icons/ri';
import { useUpdateTask, useDeleteTask } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import TaskDetailModal from './TaskDetailModal';
import { useState } from 'react';
import CreatableSelect from '../form/CreatableSelect.jsx';
import EntityChip from '../common/EntityChip.jsx';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { taskCompletedMessages } from '../../utils/toast-messages/taskCompleted.js';

const TaskCard = ({ task, sm }) => {
    const [isCompleted, setIsCompleted] = useState(task?.status === 'completed');
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateTask } = useUpdateTask(currentWorkspace);
    const { mutateAsync: deleteTask } = useDeleteTask(currentWorkspace);
    const { isOpen, onOpenChange } = useDisclosure();
    const { isOpen: isMenuOpen, onOpenChange: onMenuOpenChange } = useDisclosure();
    const {
        isOpen: isDeleteModalOpen,
        onOpen: onDeleteModalOpen,
        onClose: onDeleteModalClose,
    } = useDisclosure();
    const {
        isOpen: isMoveModalOpen,
        onOpen: onMoveModalOpen,
        onClose: onMoveModalClose,
    } = useDisclosure();

    const taskDate = dayjs(task?.date);
    const today = dayjs().startOf('day');
    const isOverdue = taskDate.isBefore(today);

    const handleStatusToggle = async () => {
        setIsCompleted(!isCompleted);
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            await updateTask({
                taskId: task.id,
                updates: {
                    status: newStatus,
                    completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
                },
            });
        } catch (error) {
            setIsCompleted(!isCompleted);
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
                onMoveModalOpen();
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
                {(task.project_id || task.milestone_id) && (
                    <div className="flex gap-3 justify-end pt-2">
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
                    </div>
                )}
            </div>
            <TaskDetailModal isOpen={isOpen} onOpenChange={onOpenChange} task={task} />

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
                <ModalContent>
                    <ModalHeader>Delete Task</ModalHeader>
                    <ModalBody>
                        <p>
                            Are you sure you want to delete "{task.name}"? This action cannot be
                            undone.
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

            {/* Move Modal */}
            <Modal isOpen={isMoveModalOpen} onClose={onMoveModalClose}>
                <ModalContent>
                    <ModalHeader>Move Task</ModalHeader>
                    <ModalBody>
                        <p className="mb-4">Select a list to move this task to:</p>
                        <CreatableSelect
                            label="Select project"
                            options={[
                                {
                                    label: 'option x',
                                    value: 'option x',
                                },
                                {
                                    label: 'option y',
                                    value: 'option y',
                                },
                                {
                                    label: 'option z',
                                    value: 'option z',
                                },
                            ]}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onMoveModalClose}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={onMoveModalClose}>
                            Move
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default TaskCard;
