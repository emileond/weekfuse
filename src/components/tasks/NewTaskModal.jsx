import { Modal, ModalContent, ModalBody, ModalFooter, Button, Input, Divider } from '@heroui/react';
import { useForm } from 'react-hook-form';
import { useCreateTask } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import DatePicker from '../../components/form/DatePicker';
import ProjectSelect from '../form/ProjectSelect.jsx';
import MilestoneSelect from '../form/MilestoneSelect.jsx';
import TagSelect from '../form/TagSelect.jsx';
import PrioritySelect from '../form/PrioritySelect.jsx';
import { useUser } from '../../hooks/react-query/user/useUser.js';

const NewTaskModal = ({ isOpen, onOpenChange, defaultDate, defaultProject, defaultMilestone }) => {
    const { data: user } = useUser();
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: createTask, isPending } = useCreateTask();
    const [selectedDate, setSelectedDate] = useState(defaultDate); // State to track selected date
    const [selectedProject, setSelectedProject] = useState(
        defaultProject ? { value: defaultProject } : null,
    ); // State to track selected project
    const [selectedMilestone, setSelectedMilestone] = useState(
        defaultMilestone ? { value: defaultMilestone } : null,
    ); // State to track selected milestone
    const [selectedTags, setSelectedTags] = useState([]); // State to track selected tags
    const [selectedPriority, setSelectedPriority] = useState(null); // State to track selected priority

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        try {
            await createTask({
                task: {
                    name: data.name,
                    description: data.description,
                    date: selectedDate ? dayjs(selectedDate).toISOString() : null,
                    workspace_id: currentWorkspace.workspace_id,
                    project_id: selectedProject?.value || null,
                    milestone_id: selectedMilestone?.value || null,
                    tags: selectedTags.length > 0 ? selectedTags : null,
                    priority: selectedPriority?.key ? parseInt(selectedPriority.key) : null,
                    status: 'pending',
                    assignee: user?.id,
                    creator: user?.id,
                },
            });
            toast.success('Task created successfully');
            onOpenChange(false);
            reset();
            setSelectedProject(null);
            setSelectedMilestone(null);
            setSelectedTags([]);
            setSelectedPriority(null);
        } catch (error) {
            toast.error(error.message || 'Failed to create task');
        }
    };

    useEffect(() => {
        reset();
    }, [onOpenChange]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
            <ModalContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ModalBody className="pt-4">
                        <div className="flex flex-col gap-6">
                            <Input
                                size="lg"
                                variant="underlined"
                                color="primary"
                                {...register('name', {
                                    required: true,
                                })}
                                label="Task"
                                autoFocus
                                isInvalid={!!errors.name}
                                errorMessage="Title is required"
                                classNames={{
                                    inputWrapper: 'shadow-none border-0',
                                    input: 'text-xl font-medium',
                                    label: 'text-default-600 font-normal',
                                }}
                            />
                            <div className="flex gap-2">
                                <DatePicker defaultValue={defaultDate} onChange={setSelectedDate} />
                                <ProjectSelect
                                    onChange={setSelectedProject}
                                    defaultValue={defaultProject}
                                />
                                {(selectedProject || defaultProject) && (
                                    <MilestoneSelect
                                        onChange={setSelectedMilestone}
                                        projectId={selectedProject?.value || defaultProject}
                                        defaultValue={defaultMilestone}
                                    />
                                )}
                                <TagSelect onChange={setSelectedTags} multiple={true} />
                                <PrioritySelect onChange={setSelectedPriority} />
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
                                setSelectedProject(null);
                                setSelectedMilestone(null);
                                setSelectedTags([]);
                                setSelectedPriority(null);
                            }}
                            isDisabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button color="primary" type="submit" isLoading={isPending}>
                            Create Task
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default NewTaskModal;
