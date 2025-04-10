import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Divider,
    Alert,
} from '@heroui/react';
import { useDeleteProject } from '../../hooks/react-query/projects/useProjects.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import toast from 'react-hot-toast';

const DeleteProjectConfirmationDialog = ({ isOpen, onOpenChange, project, onDelete }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: deleteProject, isPending } = useDeleteProject(currentWorkspace);

    const handleDelete = async () => {
        if (!project) return;

        try {
            await deleteProject({ projectId: project.id });
            toast.success('Project deleted successfully');
            onOpenChange(false);
            if (onDelete) onDelete();
        } catch (error) {
            toast.error(error.message || 'Failed to delete project');
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Delete Project?</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4 py-3">
                        <p>
                            Are you sure you want to delete "{project?.name}"?{' '}
                            <span>This action cannot be undone.</span>
                        </p>
                        <Alert
                            color="danger"
                            description="All tasks and milestones associated with this project will also be deleted."
                        />
                    </div>
                </ModalBody>
                <Divider />
                <ModalFooter>
                    <Button variant="light" onPress={handleCancel} isDisabled={isPending}>
                        Cancel
                    </Button>
                    <Button color="danger" onPress={handleDelete} isLoading={isPending}>
                        Delete
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DeleteProjectConfirmationDialog;
