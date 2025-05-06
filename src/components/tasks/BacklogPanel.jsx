import { Button, useDisclosure, Pagination, Spinner, Input, Divider } from '@heroui/react';
import { RiAddLine, RiArchiveStackLine, RiSearchLine, RiFilterLine } from 'react-icons/ri';
import { useBacklogTasks, useFuzzySearchTasks } from '../../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import DraggableList from './DraggableList.jsx';
import NewTaskModal from './NewTaskModal.jsx';
import { useEffect, useState, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import debounce from '../../utils/debounceUtils.js';
import ProjectSelect from '../form/ProjectSelect.jsx';
import MilestoneSelect from '../form/MilestoneSelect.jsx';
import TagSelect from '../form/TagSelect.jsx';
import IntegrationSourceSelect from '../form/IntegrationSourceSelect.jsx';
import PrioritySelect from '../form/PrioritySelect.jsx';

// Memoized panel content component to prevent unnecessary re-renders
// eslint-disable-next-line react/display-name
const BacklogPanelContent = memo(({ currentWorkspace, isOpen, onOpenChange }) => {
    const [page, setPage] = useState(1);
    const pageSize = 20; // Number of tasks to show per page
    const { register, watch } = useForm();
    const searchTerm = watch('searchTerm', '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [resetKey, setResetKey] = useState(0); // Add a key to force re-render of filter components

    // Filter state variables
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedIntegrationSource, setSelectedIntegrationSource] = useState(null);
    const [selectedPriority, setSelectedPriority] = useState(null);

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
    }, [
        selectedProject,
        selectedMilestone,
        selectedTags,
        selectedIntegrationSource,
        selectedPriority,
    ]);

    // Create filters object for the useBacklogTasks hook
    const filters = {
        project_id: selectedProject,
        milestone_id: selectedMilestone,
        tags: selectedTags.length > 0 ? selectedTags : null,
        integration_source: selectedIntegrationSource,
        priority: selectedPriority?.key ? parseInt(selectedPriority.key) : null,
    };

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
                <div className="flex items-center gap-1 mb-3">
                    <Input
                        size="sm"
                        color="primary"
                        variant="bordered"
                        placeholder="Search..."
                        startContent={<RiSearchLine />}
                        {...register('searchTerm')}
                        autoComplete="off"
                    />
                    <div>
                        <Button
                            size="sm"
                            color={showFilters ? 'primary' : 'default'}
                            variant={showFilters ? 'flat' : 'light'}
                            startContent={<RiFilterLine fontSize=".85rem" />}
                            onPress={() => setShowFilters(!showFilters)}
                        >
                            Filters
                        </Button>
                    </div>
                </div>
                {showFilters && (
                    <div className="mb-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                            <ProjectSelect
                                key={`project-select-${resetKey}`}
                                onChange={(value) => setSelectedProject(value?.value || null)}
                            />
                            {selectedProject && (
                                <MilestoneSelect
                                    key={`milestone-select-${selectedProject}-${resetKey}`}
                                    projectId={selectedProject}
                                    onChange={(value) => setSelectedMilestone(value?.value || null)}
                                />
                            )}
                            <TagSelect
                                key={`tag-select-${resetKey}`}
                                onChange={setSelectedTags}
                                multiple={true}
                            />
                            <IntegrationSourceSelect
                                key={`integration-source-select-${resetKey}`}
                                onChange={setSelectedIntegrationSource}
                            />
                            <PrioritySelect
                                key={`priority-select-${resetKey}`}
                                onChange={setSelectedPriority}
                            />
                        </div>
                        {(selectedProject ||
                            selectedMilestone ||
                            selectedTags.length > 0 ||
                            selectedIntegrationSource ||
                            selectedPriority) && (
                            <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                className="mt-2"
                                onPress={() => {
                                    setSelectedProject(null);
                                    setSelectedMilestone(null);
                                    setSelectedTags([]);
                                    setSelectedIntegrationSource(null);
                                    setSelectedPriority(null);
                                    setResetKey((prevKey) => prevKey + 1); // Increment reset key to force re-render
                                }}
                            >
                                Clear filters
                            </Button>
                        )}
                        <Divider className="my-4" />
                    </div>
                )}

                {isSearchActive && isSearching ? (
                    <div className="flex grow items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : tasks.length > 0 ? (
                    <DraggableList id="backlog" items={tasks} group="tasks" smallCards />
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
