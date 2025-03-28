import { Button } from '@heroui/react';
import { RiAddLine } from 'react-icons/ri';
import { useBacklogTasks } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import DraggableList from './DraggableList.jsx';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

function BacklogPanel({ isBacklogCollapsed }) {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: tasks } = useBacklogTasks(currentWorkspace);

    const [listKey, setListKey] = useState(null);

    useEffect(() => {
        setListKey(dayjs().toISOString());
    }, [tasks]);

    return (
        <div className={`${isBacklogCollapsed ? 'hidden' : 'basis-1/4'}`}>
            <div className="bg-content2 border-1 border-default rounded-xl p-4 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Backlog</h3>
                </div>
                <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    startContent={<RiAddLine />}
                    className="justify-start mb-4"
                >
                    Add task
                </Button>
                {tasks && <DraggableList key={listKey} id="backlog" items={tasks} group="tasks" />}
            </div>
        </div>
    );
}

export default BacklogPanel;
