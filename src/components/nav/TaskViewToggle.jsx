import { Button, ButtonGroup, Tooltip } from '@heroui/react';
import { RiListCheck3, RiKanbanView, RiTableView } from 'react-icons/ri';
import { useState, useEffect, useMemo } from 'react';

// The base key for localStorage to keep naming consistent
const BASE_STORAGE_KEY = 'taskViewPreference';

const TaskViewToggle = ({ pageKey = 'global', hideList, hideKanban, hideTable, onChange }) => {
    // Create a dynamic storage key based on the pageKey prop.
    // This makes the preference unique to the page (e.g., 'taskViewPreference_dashboard').
    const storageKey = useMemo(() => `${BASE_STORAGE_KEY}_${pageKey}`, [pageKey]);

    // Initialize state from localStorage using the dynamic key, or default to 'list'
    const [view, setView] = useState(() => {
        // Ensure localStorage is available before using it (for SSR safety)
        if (typeof window !== 'undefined') {
            const savedView = localStorage.getItem(storageKey);
            return savedView || 'list';
        }
        return 'list';
    });

    const ICON_SIZE = '1.3REM';

    // Update view handler that updates state, localStorage (with dynamic key), and calls onChange
    const handleViewChange = (newView) => {
        setView(newView);
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, newView);
        }
        if (onChange) {
            onChange(newView);
        }
    };

    // This effect synchronizes the component's state with localStorage when the pageKey changes.
    // This ensures that if the component is used across different pages while staying mounted,
    // it always reflects the correct preference for the current page.
    useEffect(() => {
        const savedView = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : 'list';
        const currentView = savedView || 'list';

        setView(currentView); // Update the component's internal state

        if (onChange) {
            onChange(currentView); // Notify the parent component of the correct view
        }
    }, [pageKey, storageKey, onChange]); // Rerun when the page context changes

    return (
        <div className="flex items-center gap-3 p-1 mx-auto fixed bottom-4 md:left-[240px] md:right-0 left-0 right-0 w-32 rounded-2xl bg-background shadow z-10">
            <ButtonGroup>
                <Tooltip content="List view">
                    <Button
                        isDisabled={hideList}
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
                        isDisabled={hideKanban}
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
                        isDisabled={hideTable}
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
