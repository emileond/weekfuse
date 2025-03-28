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
    Checkbox,
} from '@heroui/react';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useUpdateTask } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const TaskDetailModal = ({ isOpen, onOpenChange, task }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateTask, isPending } = useUpdateTask(currentWorkspace);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: {
            name: task?.name || '',
            description: task?.description || '',
            status: task?.status || 'pending',
            date: task?.date ? dayjs(task.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        },
    });

    // Update form values when task changes
    useEffect(() => {
        if (task) {
            setValue('name', task.name || '');
            setValue('description', task.description || '');
            setValue('status', task.status || 'pending');
            setValue('date', task.date ? dayjs(task.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
        }
    }, [task, setValue]);

    const status = watch('status');
    const isCompleted = status === 'completed';

    const handleStatusToggle = () => {
        setValue('status', isCompleted ? 'pending' : 'completed', { shouldDirty: true });
    };

    const onSubmit = async (data) => {
        try {
            await updateTask({
                taskId: task.id,
                updates: {
                    name: data.name,
                    description: data.description,
                    status: data.status,
                    date: data.date ? dayjs(data.date).toISOString() : dayjs().toISOString(),
                },
            });
            toast.success('Task updated successfully');
            onOpenChange(false);
        } catch (error) {
            toast.error(error.message || 'Failed to update task');
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
            <ModalContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ModalHeader className="flex flex-col gap-1">Task Details</ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Checkbox 
                                    size="lg" 
                                    isSelected={isCompleted}
                                    onChange={handleStatusToggle}
                                />
                                <span className="text-sm text-default-500">
                                    {isCompleted ? 'Completed' : 'Pending'}
                                </span>
                            </div>
                            <Input
                                size="lg"
                                {...register('name', { required: true })}
                                label="Task name"
                                isInvalid={!!errors.name}
                                errorMessage="Task name is required"
                                className={isCompleted ? 'line-through text-default-400' : ''}
                            />
                            <Textarea
                                {...register('description')}
                                label="Description"
                                minRows={4}
                            />
                            <Input
                                type="date"
                                {...register('date')}
                                label="Due Date"
                            />
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
                        <Button 
                            color="primary" 
                            type="submit" 
                            isLoading={isPending}
                            isDisabled={!isDirty}
                        >
                            Save Changes
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default TaskDetailModal;
