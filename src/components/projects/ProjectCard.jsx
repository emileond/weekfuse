import {
    Button,
    Card,
    CardBody,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
} from '@heroui/react';
import { RiListCheck3, RiMoreLine } from 'react-icons/ri';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import {
    useUpdateProject,
    useDeleteProject,
    useTaskCountByProject,
} from '../../hooks/react-query/projects/useProjects.js';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const ProjectCard = ({ project }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: taskCount } = useTaskCountByProject(project?.id);
    const { mutateAsync: updateProject } = useUpdateProject(currentWorkspace);
    const { mutateAsync: deleteProject } = useDeleteProject(currentWorkspace);
    const { isOpen: isMenuOpen, onOpenChange: onMenuOpenChange } = useDisclosure();
    const {
        isOpen: isEditModalOpen,
        onOpen: onEditModalOpen,
        onClose: onEditModalClose,
    } = useDisclosure();
    const {
        isOpen: isDeleteModalOpen,
        onOpen: onDeleteModalOpen,
        onClose: onDeleteModalClose,
    } = useDisclosure();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: project.name,
        },
    });

    const handleAction = (key) => {
        switch (key) {
            case 'edit':
                onEditModalOpen();
                break;
            case 'delete':
                onDeleteModalOpen();
                break;
            default:
                null;
        }
    };

    const handleEdit = async (data) => {
        try {
            await updateProject({
                projectId: project.id,
                updates: {
                    name: data.name,
                },
            });
            toast('Project updated');
            onEditModalClose();
        } catch (error) {
            toast.error(error.message || 'Failed to update project');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProject({ projectId: project.id });
            toast('Project deleted');
            onDeleteModalClose();
        } catch (error) {
            toast.error(error.message || 'Failed to delete project');
        }
    };

    return (
        <>
            <Card key={project.id} shadow="none" className="w-full border-1 border-default-200">
                <CardBody>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2 items-center text-default-500">
                            <RiListCheck3 fontSize="1.2rem" />
                            <div>
                                <p className="font-medium text-default-900">{project.name}</p>
                                <p className="text-sm">{taskCount} tasks</p>
                            </div>
                        </div>
                        <Dropdown isOpen={isMenuOpen} onOpenChange={onMenuOpenChange}>
                            <DropdownTrigger>
                                <Button
                                    variant="flat"
                                    isIconOnly
                                    onPress={onMenuOpenChange}
                                    startContent={<RiMoreLine fontSize="1.2rem" />}
                                />
                            </DropdownTrigger>
                            <DropdownMenu onAction={(key) => handleAction(key)}>
                                <DropdownItem key="edit">Edit</DropdownItem>
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
                </CardBody>
            </Card>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
                <ModalContent>
                    <form onSubmit={handleSubmit(handleEdit)}>
                        <ModalHeader>Edit Project</ModalHeader>
                        <ModalBody>
                            <Input
                                label="Project name"
                                {...register('name', { required: true })}
                                isInvalid={!!errors.name}
                                errorMessage="Project name is required"
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onEditModalClose}>
                                Cancel
                            </Button>
                            <Button color="primary" type="submit">
                                Update
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
                <ModalContent>
                    <ModalHeader>Delete Project</ModalHeader>
                    <ModalBody>
                        <p>
                            Are you sure you want to delete "{project.name}"? This action cannot be
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
        </>
    );
};

export default ProjectCard;
