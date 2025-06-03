import { Button, useDisclosure, Pagination, Spinner, Input, Divider } from '@heroui/react';
import { RiAddLine, RiArchiveStackLine, RiSearchLine } from 'react-icons/ri';
import { useBacklogTasks, useFuzzySearchTasks } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import DraggableList from './DraggableList.jsx';
import NewTaskModal from './NewTaskModal.jsx';
import TasksFilters from './TasksFilters.jsx';
import { useEffect, useState, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import debounce from '../../utils/debounceUtils.js';

// Memoized panel content component to prevent unnecessary re-renders
// eslint-disable-next-line react/display-name
const BacklogPanelContent = memo(({ currentWorkspace, isOpen, onOpenChange }) => {
    const [page, setPage] = useState(1);
    const pageSize = 20; // Number of tasks to show per page
    const { register, watch } = useForm();
    const searchTerm = watch('searchTerm', '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(true);

    // Filter state
    const [filters, setFilters] = useState({
        project_id: null,
        milestone_id: null,
        tags: null,
        integration_source: null,
        priority: null,
    });

    // Create a debounced function to update search term
    const debouncedSetSearchTerm = useCallback(
        debounce((value) => {
            setDebouncedSearchTerm(value);
        }, 500),
        [],
    );

    // Update debounced search term when search term changes
    useEffect(() => {
        debouncedSetSearchTerm(searchTerm);
    }, [searchTerm, debouncedSetSearchTerm]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [filters]);

    // Use the hook with pagination parameters and filters for backlog tasks
    const { data: tasksData, refetch } = useBacklogTasks(currentWorkspace, page, pageSize, filters);

    // Use the hook for fuzzy search with debounced search term
    const { data: searchData, isLoading: isSearching } = useFuzzySearchTasks(
        currentWorkspace,
        debouncedSearchTerm,
        pageSize,
        'pending',
    );

    // Determine which tasks to display based on debounced search term
    const isSearchActive = debouncedSearchTerm && debouncedSearchTerm.trim() !== '';
    const tasks = isSearchActive ? searchData?.data || [] : tasksData?.data || [];

    const [totalTasks, setTotalTasks] = useState(tasksData?.count);
    const totalPages = Math.ceil(totalTasks / pageSize);

    useEffect(() => {
        if (tasksData?.count && !isSearchActive) {
            setTotalTasks(tasksData?.count);
        }
    }, [tasksData, isSearchActive]);

    useEffect(() => {
        if (!isOpen) {
            refetch();
        }
    }, [isOpen, refetch]);

    return (
        <>
            <NewTaskModal isOpen={isOpen} onOpenChange={onOpenChange} defaultDate={null} />
            <div className="bg-content2 border-1 border-default rounded-xl p-4 flex flex-col h-full">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-default-700 pb-1">
                    <RiArchiveStackLine fontSize="1.2rem" /> Backlog
                </h3>
                <div>
                    <Button
                        size="sm"
                        color="primary"
                        variant="light"
                        startContent={<RiAddLine />}
                        className="mb-2"
                        onPress={() => onOpenChange(true)}
                    >
                        Add task
                    </Button>
                </div>
                <div className="flex flex-col gap-1 mb-3">
                    <Input
                        size="sm"
                        color="primary"
                        variant="bordered"
                        placeholder="Search..."
                        startContent={<RiSearchLine />}
                        {...register('searchTerm')}
                        autoComplete="off"
                    />

                    <TasksFilters
                        showFilters={showFilters}
                        onShowFiltersChange={setShowFilters}
                        onFiltersChange={setFilters}
                        initialFilters={filters}
                    />
                </div>

                {isSearchActive && isSearching ? (
                    <div className="flex grow items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : tasks.length > 0 ? (
                    <DraggableList
                        id="backlog"
                        items={tasks}
                        group="tasks"
                        smallCards
                        onDragEnd={(e, startCol) => {
                            // This component doesn't need to handle drag and drop business logic
                            // as it's only a source for dragging, not a target for dropping
                        }}
                    />
                ) : (
                    <div className="flex grow items-center justify-center">
                        {isSearchActive ? (
                            <p className="text-default-500">No tasks found matching your search</p>
                        ) : (
                            <Spinner size="lg" />
                        )}
                    </div>
                )}

                {!isSearchActive && !!totalPages && (
                    <div className="flex w-full justify-center mt-4">
                        <Pagination
                            variant="faded"
                            showControls
                            page={page}
                            total={totalPages}
                            onChange={(newPage) => setPage(newPage)}
                        />
                    </div>
                )}
            </div>
        </>
    );
});

function BacklogPanel({ isBacklogCollapsed }) {
    const [currentWorkspace] = useCurrentWorkspace();
    const { isOpen, onOpenChange } = useDisclosure();

    // Use CSS for width/size transition, but conditionally render content
    return (
        <div
            className={`${isBacklogCollapsed ? 'basis-0 w-0' : 'basis-1/3'} shadow-2xl rounded-xl transition-all duration-200 overflow-hidden`}
            style={{
                opacity: isBacklogCollapsed ? 0 : 1,
                transition: 'opacity 200ms ease, flex-basis 200ms ease, width 200ms ease',
            }}
        >
            {!isBacklogCollapsed && (
                <BacklogPanelContent
                    currentWorkspace={currentWorkspace}
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                />
            )}
        </div>
    );
}

export default BacklogPanel;
