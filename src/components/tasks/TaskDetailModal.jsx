import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
    Divider,
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

const TaskDetailModal = ({ isOpen, onOpenChange, task }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateTask, isPending } = useUpdateTask(currentWorkspace);
    const [selectedDate, setSelectedDate] = useState(task?.date ? new Date(task.date) : null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedMilestone, setSelectedMilestone] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: task?.name || '',
            description: task?.description || '',
            date: task?.date ? new Date(task.date) : null,
        },
    });

    // Update form values when task changes
    useEffect(() => {
        if (task) {
            setValue('name', task.name || '');
            setValue('description', task.description || '');
            setValue('date', task.date ? new Date(task.date) : null);
            setSelectedDate(task.date ? new Date(task.date) : null);

            // Set initial project if task has one
            if (task.project_id) {
                setSelectedProject({ value: task.project_id });
            }

            // Set initial milestone if task has one
            if (task.milestone_id) {
                setSelectedMilestone({ value: task.milestone_id });
            }
        }
    }, [task, setValue]);

    const onSubmit = async (data) => {
        try {
            // Create the updates object
            const updates = {
                name: data.name,
                description: data.description,
                // status: data.status,
                date: selectedDate ? dayjs(selectedDate).toISOString() : null,
                project_id: selectedProject?.value || null,
                milestone_id: selectedMilestone?.value || null,
            };

            // Check if the data has actually changed
            const hasChanged =
                updates.name !== (task.name || '') ||
                updates.description !== (task.description || '') ||
                (updates.date !== (task.date || null) &&
                    (updates.date === null ||
                        task.date === null ||
                        dayjs(updates.date).format('YYYY-MM-DD') !==
                            dayjs(task.date).format('YYYY-MM-DD'))) ||
                updates.project_id !== (task.project_id || null) ||
                updates.milestone_id !== (task.milestone_id || null);

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
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
            <ModalContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ModalHeader className="flex flex-col gap-1">Task Details</ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <Input
                                size="lg"
                                {...register('name', { required: true })}
                                label="Task name"
                                isInvalid={!!errors.name}
                                errorMessage="Task name is required"
                            />
                            <Textarea
                                {...register('description')}
                                label="Description"
                                minRows={4}
                            />
                            <div className="flex gap-2">
                                <DatePicker
                                    control={control}
                                    name="date"
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
                            </div>
                            <input type="hidden" {...register('status')} />
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
            </ModalContent>
        </Modal>
    );
};

export default TaskDetailModal;
