import {
    Checkbox,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    useDisclosure,
} from '@heroui/react';
import { RiMoreLine } from 'react-icons/ri';
import { useUpdateTask, useDeleteTask } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import TaskDetailModal from './TaskDetailModal';
import { useState } from 'react';

const TaskCard = ({ task, isDnD }) => {
    const [isCompleted, setIsCompleted] = useState(task?.status === 'completed');
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: updateTask } = useUpdateTask(currentWorkspace);
    const { mutateAsync: deleteTask } = useDeleteTask(currentWorkspace);
    const { isOpen, onOpenChange } = useDisclosure();

    const handleStatusToggle = async () => {
        setIsCompleted(!isCompleted);
        try {
            await updateTask({
                taskId: task.id,
                updates: {
                    status: task.status === 'completed' ? 'pending' : 'completed',
                },
            });
        } catch (error) {
            setIsCompleted(!isCompleted);
            console.error('Error toggling task status:', error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteTask({ taskId: task.id });
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    return (
        <>
            <div
                id={task.id}
                className="w-full border-1 border-content3 rounded-xl p-3 bg-content1 hover:bg-content2/50 transition-bg duration-300 ease-in-out hover:cursor-pointer"
                onClick={onOpenChange}
            >
                <div className="flex justify-between items-center">
                    <div className="flex gap-1 items-center">
                        <Checkbox
                            size={isDnD ? 'md' : 'lg'}
                            isSelected={isCompleted}
                            onValueChange={handleStatusToggle}
                        />
                        <span
                            className={`font-medium ${
                                isCompleted ? 'line-through text-default-400' : ''
                            } ${isDnD && 'text-sm'}`}
                        >
                            {task.name}
                        </span>
                    </div>
                    {!isDnD && (
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    variant="light"
                                    isIconOnly
                                    size="sm"
                                    startContent={<RiMoreLine fontSize="1rem" />}
                                />
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem>Move...</DropdownItem>
                                <DropdownItem>Delete</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    )}
                </div>
            </div>
            <TaskDetailModal isOpen={isOpen} onOpenChange={onOpenChange} task={task} />
        </>
    );
};

export default TaskCard;
