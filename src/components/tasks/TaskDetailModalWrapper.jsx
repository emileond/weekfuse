import { useState } from 'react';
import TaskDetailModal from './TaskDetailModal';
import DeleteTaskModal from './DeleteTaskModal';
import { useDeleteTask } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { useDisclosure } from '@heroui/react';

const TaskDetailModalWrapper = ({ isOpen, onOpenChange, task }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: deleteTask } = useDeleteTask(currentWorkspace);
    const [isDeleting, setIsDeleting] = useState(false);
    const {
        isOpen: isDeleteModalOpen,
        onOpen: onDeleteModalOpen,
        onClose: onDeleteModalClose,
    } = useDisclosure();

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
        setIsDeleting(true);
        try {
            await deleteTask({ taskId: task.id });
            onDeleteModalClose();
            onOpenChange(false); // Close the task detail modal after deletion
        } catch (error) {
            console.error('Error deleting task:', error);
        }
        setIsDeleting(false);
    };

    return (
        <>
            <DeleteTaskModal 
                isOpen={isDeleteModalOpen} 
                onClose={onDeleteModalClose} 
                onDelete={handleDelete} 
                taskName={task.name}
                isDeleting={isDeleting}
            />
            <TaskDetailModal 
                isOpen={isOpen} 
                onOpenChange={onOpenChange} 
                task={task} 
                onAction={handleAction}
            />
        </>
    );
};

export default TaskDetailModalWrapper;