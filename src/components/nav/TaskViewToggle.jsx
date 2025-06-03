import { Button, ButtonGroup, Tooltip } from '@heroui/react';
import { RiListCheck3, RiKanbanView, RiTableView } from 'react-icons/ri';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'taskViewPreference';

const TaskViewToggle = ({ onChange }) => {
    // Initialize state from localStorage or default to 'list'
    const [view, setView] = useState(() => {
        const savedView = localStorage.getItem(STORAGE_KEY);
        return savedView || 'list';
    });

    const ICON_SIZE = '1.3REM';

    // Update view handler that updates state, localStorage, and calls onChange
    const handleViewChange = (newView) => {
        setView(newView);
        localStorage.setItem(STORAGE_KEY, newView);
        if (onChange) {
            onChange(newView);
        }
    };

    // Notify parent component of initial view on mount
    useEffect(() => {
        if (onChange) {
            onChange(view);
        }
    }, []);

    return (
        <div className="flex items-center gap-3 p-1 absolute mx-auto mb-3 bottom-0 left-0 right-0 w-32 rounded-2xl bg-background shadow z-10">
            <ButtonGroup>
                <Tooltip content="List view">
                    <Button
                        variant={view === 'list' ? 'flat' : 'light'}
                        color={view === 'list' ? 'primary' : 'default'}
                        isIconOnly
                        onPress={() => handleViewChange('list')}
                    >
                        <RiListCheck3
                            fontSize={ICON_SIZE}
                            className={view !== 'list' && 'text-default-500'}
                        />
                    </Button>
                </Tooltip>
                <Tooltip content="Kanban view">
                    <Button
                        variant={view === 'kanban' ? 'flat' : 'light'}
                        color={view === 'kanban' ? 'primary' : 'default'}
                        isIconOnly
                        onPress={() => handleViewChange('kanban')}
                    >
                        <RiKanbanView
                            fontSize={ICON_SIZE}
                            className={view !== 'kanban' && 'text-default-500'}
                        />
                    </Button>
                </Tooltip>
                <Tooltip content="Table view">
                    <Button
                        variant={view === 'table' ? 'flat' : 'light'}
                        color={view === 'table' ? 'primary' : 'default'}
                        isIconOnly
                        onPress={() => handleViewChange('table')}
                    >
                        <RiTableView
                            fontSize={ICON_SIZE}
                            className={view !== 'table' && 'text-default-500'}
                        />
                    </Button>
                </Tooltip>
            </ButtonGroup>
        </div>
    );
};

export default TaskViewToggle;
