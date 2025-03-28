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

const TaskDetailModal = ({ isOpen, onOpenChange, task }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateTask, isPending } = useUpdateTask(currentWorkspace);
    const [selectedDate, setSelectedDate] = useState(task?.date ? new Date(task.date) : null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors, isDirty },
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
        }
    }, [task, setValue]);

    const onSubmit = async (data) => {
        try {
            await updateTask({
                taskId: task.id,
                updates: {
                    name: data.name,
                    description: data.description,
                    status: data.status,
                    date: selectedDate ? dayjs(selectedDate).toISOString() : null,
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
