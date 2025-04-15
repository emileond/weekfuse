import { Button, useDisclosure } from '@heroui/react';
import { RiAddLine, RiArchiveStackLine } from 'react-icons/ri';
import { useBacklogTasks } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import DraggableList from './DraggableList.jsx';
import NewTaskModal from './NewTaskModal.jsx';

function BacklogPanel({ isBacklogCollapsed }) {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: tasks } = useBacklogTasks(currentWorkspace);
    const { isOpen, onOpenChange } = useDisclosure();

    return (
        <div
            className={`${isBacklogCollapsed ? 'basis-0 opacity-0' : 'basis-1/3 opacity-100'} shadow-2xl rounded-xl transition-all duration-200 overflow-hidden`}
        >
            <NewTaskModal isOpen={isOpen} onOpenChange={onOpenChange} defaultDate={null} />
            <div className="bg-content2 border-1 border-default rounded-xl p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-default-700">
                        <RiArchiveStackLine fontSize="1.24rem" /> Backlog
                    </h3>
                </div>
                <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    startContent={<RiAddLine />}
                    className="justify-start mb-4"
                    onPress={() => onOpenChange(true)}
                >
                    Add task
                </Button>
                {tasks && <DraggableList id="backlog" items={tasks} group="tasks" smallCards />}
            </div>
        </div>
    );
}

export default BacklogPanel;
