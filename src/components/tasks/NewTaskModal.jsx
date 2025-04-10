import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Divider,
} from '@heroui/react';
import { useForm } from 'react-hook-form';
import { useCreateTask } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { useState } from 'react';
import DatePicker from '../../components/form/DatePicker';
import ProjectSelect from '../form/ProjectSelect.jsx';
import MilestoneSelect from '../form/MilestoneSelect.jsx';
import SimpleEditor from '../form/SimpleEditor.jsx';

const NewTaskModal = ({ isOpen, onOpenChange, defaultDate, defaultProject, defaultMilestone }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: createTask, isPending } = useCreateTask(currentWorkspace);
    const [selectedDate, setSelectedDate] = useState(defaultDate); // State to track selected date
    const [selectedProject, setSelectedProject] = useState(
        defaultProject ? { value: defaultProject } : null,
    ); // State to track selected project
    const [selectedMilestone, setSelectedMilestone] = useState(
        defaultMilestone ? { value: defaultMilestone } : null,
    ); // State to track selected milestone

    const {
        register,
        handleSubmit,
        control, // Use control for the Controller
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
                    status: 'pending',
                },
            });
            toast.success('Task created successfully');
            onOpenChange(false);
            reset();
            setSelectedProject(null);
            setSelectedMilestone(null);
        } catch (error) {
            toast.error(error.message || 'Failed to create task');
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
            <ModalContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ModalHeader className="flex flex-col gap-1">New Task</ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-6">
                            <Input
                                size="lg"
                                {...register('name', { required: true })}
                                label="Task"
                                isInvalid={!!errors.title}
                                errorMessage="Title is required"
                            />
                            {/*<SimpleEditor*/}
                            {/*    // control={control}*/}
                            {/*    name="description"*/}
                            {/*    label="Description"*/}
                            {/*    // minRows={2}*/}
                            {/*/>*/}
                        </div>
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
