import {
    Modal,
    ModalContent,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Divider,
    Checkbox,
} from '@heroui/react';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useUpdateTask } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import DatePicker from '../../components/form/DatePicker';
import ProjectSelect from '../form/ProjectSelect.jsx';
import MilestoneSelect from '../form/MilestoneSelect.jsx';
import TagSelect from '../form/TagSelect.jsx';
import PrioritySelect from '../form/PrioritySelect.jsx';
import SimpleEditor from '../form/SimpleEditor.jsx';
import { RiCheckboxCircleFill, RiCheckboxCircleLine } from 'react-icons/ri';
import TaskIntegrationPanel from './integrations/TaskIntegrationPanel.jsx';
import { taskCompletedMessages } from '../../utils/toast-messages/taskCompleted.js';
import TaskIntegrationDescription from './integrations/TaskIntegrationDescription.jsx';

const TaskDetailModal = ({ isOpen, onOpenChange, task }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateTask, isPending } = useUpdateTask(currentWorkspace);
    const [isCompleted, setIsCompleted] = useState(task.status === 'completed');
    const [selectedDate, setSelectedDate] = useState(task?.date ? new Date(task.date) : null);
    const [description, setDescription] = useState(task.description);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedPriority, setSelectedPriority] = useState(null);

    const isExternal = !!task?.integration_source;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: task?.name || '',
            description: task?.description || '',
            date: task?.date ? new Date(task.date) : null,
        },
    });

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen && task) {
            // Reset form with task values when modal opens
            reset({
                name: task.name || '',
                date: task.date ? new Date(task.date) : null,
            });
            setDescription(task.description || '');
            setSelectedDate(task.date ? new Date(task.date) : null);

            // Update isCompleted state based on task status
            setIsCompleted(task.status === 'completed');

            // Set initial project if task has one
            setSelectedProject(task.project_id ? { value: task.project_id } : null);

            // Set initial milestone if task has one
            setSelectedMilestone(task.milestone_id ? { value: task.milestone_id } : null);

            // Set initial tags if task has them
            if (task.tags && Array.isArray(task.tags)) {
                setSelectedTags(task.tags);
            } else if (task.tags) {
                setSelectedTags([task.tags]);
            } else {
                setSelectedTags([]);
            }

            // Set initial priority if task has one
            if (task.priority !== null && task.priority !== undefined) {
                setSelectedPriority({ value: task.priority });
            } else {
                setSelectedPriority(null);
            }
        }
    }, [isOpen, task, reset]);

    const handleStatusToggle = async () => {
        // Determine new value by inverting the current state
        const newCompleted = !isCompleted;
        setIsCompleted(newCompleted);
        const newStatus = newCompleted ? 'completed' : 'pending';

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
            setIsCompleted(!newCompleted);
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

    const onSubmit = async (data) => {
        try {
            // Create the updates object
            const updates = {
                name: data.name,
                description: description,
                date: selectedDate ? dayjs(selectedDate).toISOString() : null,
                project_id: selectedProject?.value || null,
                milestone_id: selectedMilestone?.value || null,
                tags: selectedTags.length > 0 ? selectedTags : null,
                priority: selectedPriority?.key ? parseInt(selectedPriority.key) : null,
            };

            // Check if the data has actually changed
            // Helper function to compare tags arrays
            const areTagsEqual = (tags1, tags2) => {
                if (!tags1 && !tags2) return true;
                if (!tags1 || !tags2) return false;
                if (!Array.isArray(tags1) || !Array.isArray(tags2)) return false;
                if (tags1.length !== tags2.length) return false;

                // Sort both arrays to ensure consistent comparison
                const sortedTags1 = [...tags1].sort();
                const sortedTags2 = [...tags2].sort();

                return sortedTags1.every((tag, index) => tag === sortedTags2[index]);
            };

            const hasChanged =
                updates.name !== (task.name || '') ||
                updates.description !== (task.description || '') ||
                (updates.date !== (task.date || null) &&
                    (updates.date === null ||
                        task.date === null ||
                        dayjs(updates.date).format('YYYY-MM-DD') !==
                            dayjs(task.date).format('YYYY-MM-DD'))) ||
                updates.project_id !== (task.project_id || null) ||
                updates.milestone_id !== (task.milestone_id || null) ||
                updates.priority !== task.priority ||
                !areTagsEqual(updates.tags, task.tags);

            // Only make the database call if the data has changed
            if (hasChanged) {
                await updateTask({
                    taskId: task.id,
                    updates,
                });
            }
            toast.success('Task updated');
        } catch (error) {
            toast.error(error.message || 'Failed to update task');
        } finally {
            onOpenChange();
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size={isExternal ? '5xl' : '3xl'} className="max-h-[85vh]">
            <ModalContent>
                <div className="flex gap-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="basis-2/3 grow">
                        <ModalBody className="pt-6">
                            <div className="flex flex-col gap-6 ">
                                <div className="flex">
                                    <Checkbox
                                        size="lg"
                                        isSelected={isCompleted}
                                        onValueChange={handleStatusToggle}
                                    />

                                    <Input
                                        size="lg"
                                        variant={isExternal ? 'bordered' : 'underlined'}
                                        {...register('name', { required: true })}
                                        label="Task"
                                        color="primary"
                                        isInvalid={!!errors.name}
                                        errorMessage="Task name is required"
                                        isReadOnly={isExternal}
                                        classNames={{
                                            inputWrapper: 'shadow-none border-0',
                                            input: 'text-xl font-medium',
                                            label: 'text-default-600 font-normal',
                                        }}
                                    />
                                </div>
                                <SimpleEditor
                                    label="Description"
                                    defaultContent={task?.description || null}
                                    onChange={setDescription}
                                    isEditable={!isExternal}
                                />
                                {task?.integration_source && (
                                    <TaskIntegrationDescription
                                        source={task?.integration_source}
                                        external_data={task?.external_data}
                                    />
                                )}
                                <div className="flex items-center justify-between pb-1">
                                    <div className="flex gap-2">
                                        <DatePicker
                                            defaultValue={selectedDate}
                                            onChange={setSelectedDate}
                                        />
                                        <ProjectSelect
                                            defaultValue={task?.project_id}
                                            onChange={setSelectedProject}
                                        />
                                        {selectedProject && (
                                            <MilestoneSelect
                                                key={selectedProject?.value}
                                                defaultValue={
                                                    selectedProject?.value === task?.project_id
                                                        ? task?.milestone_id
                                                        : null
                                                }
                                                onChange={setSelectedMilestone}
                                                projectId={selectedProject?.value}
                                            />
                                        )}
                                        <TagSelect
                                            defaultValue={task?.tags || task?.tag_id}
                                            onChange={setSelectedTags}
                                            multiple={true}
                                        />
                                        <PrioritySelect
                                            defaultValue={task?.priority}
                                            onChange={setSelectedPriority}
                                        />
                                    </div>
                                    {task.status === 'completed' && task.completed_at && (
                                        <div className="flex gap-1 text-xs text-default-500 font-medium">
                                            <RiCheckboxCircleLine fontSize="1rem" />
                                            Completed on{' '}
                                            {Intl.DateTimeFormat(navigator.language, {
                                                dateStyle: 'medium',
                                            }).format(new Date(task.completed_at))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ModalBody>
                        <Divider />
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={() => {
                                    onOpenChange(false);
                                    reset();
                                }}
                                isDisabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button color="primary" type="submit" isLoading={isPending}>
                                Save Changes
                            </Button>
                        </ModalFooter>
                    </form>
                    {task?.integration_source && (
                        <TaskIntegrationPanel
                            source={task.integration_source}
                            external_id={task?.external_id}
                            external_data={task?.external_data}
                        />
                    )}
                </div>
            </ModalContent>
        </Modal>
    );
};

export default TaskDetailModal;
