import { useParams } from 'react-router-dom';
import { useDisclosure, Progress, Chip, Spinner, Button } from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import { RiAddLine } from 'react-icons/ri';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useTasks, useUpdateMultipleTasks } from '../hooks/react-query/tasks/useTasks.js';
import { useProjects, useTaskCountByProject } from '../hooks/react-query/projects/useProjects.js';
import {
    useMilestones,
    useTaskCountByMilestone,
} from '../hooks/react-query/milestones/useMilestones.js';
import { useState, useEffect, useMemo } from 'react';
import NewTaskModal from '../components/tasks/NewTaskModal.jsx';
import TasksFilters from '../components/tasks/TasksFilters.jsx';
import TaskViewToggle from '../components/nav/TaskViewToggle.jsx';
import KanbanView from '../components/tasks/KanbanView.jsx';
import TableView from '../components/tasks/TableView.jsx';
import DraggableList from '../components/tasks/DraggableList.jsx';

function ProjectTasksPage() {
    const { projectId, milestoneId } = useParams();
    const [currentWorkspace] = useCurrentWorkspace();
    const { isOpen, onOpenChange } = useDisclosure();
    const [pageTitle, setPageTitle] = useState('Tasks');
    const [pageDescription, setPageDescription] = useState('');
    const [pageView, setPageView] = useState();
    const [filters, setFilters] = useState({});

    // Fetch tasks for the specified project or milestone based on selected tab
    const { data: tasks, isPending } = useTasks(currentWorkspace, filters);

    const handleViewChange = (newView) => {
        setPageView(newView);
    };

    const { mutateAsync: updateMultipleTasks } = useUpdateMultipleTasks(currentWorkspace);

    // Fetch project details if projectId is provided
    const { data: projects } = useProjects(currentWorkspace);
    const project = projects?.find((p) => p.id === projectId);

    // Fetch milestone details if milestoneId is provided
    const { data: milestones } = useMilestones(currentWorkspace);
    const milestone = milestones?.find((m) => m.id === milestoneId);

    // Fetch task counts for the project or milestone
    const { data: projectTaskCount } = useTaskCountByProject(projectId);
    const { data: milestoneTaskCount } = useTaskCountByMilestone(milestoneId);

    // Calculate task counts and percentages
    const taskCount = useMemo(() => {
        if (milestoneId && milestoneTaskCount) {
            return milestoneTaskCount;
        } else if (projectId && projectTaskCount) {
            return projectTaskCount;
        }
        return { total: 0, pending: 0, completed: 0 };
    }, [milestoneId, projectId, milestoneTaskCount, projectTaskCount]);

    const completedPercentage = useMemo(() => {
        return taskCount.total > 0 ? Math.round((taskCount.completed / taskCount.total) * 100) : 0;
    }, [taskCount]);

    // Render different views based on the selected view mode
    const renderTasksView = () => {
        switch (pageView) {
            case 'list':
                return (
                    <DraggableList
                        id={projectId || milestoneId}
                        items={tasks || []}
                        group="project-tasks"
                        onDragEnd={async (e, startCol) => {
                            // Handle drag and drop logic for tasks
                            const endCol = e.parent.el.id;

                            // Update task order
                            try {
                                await updateMultipleTasks({
                                    tasks: e.values.map((item, index) => ({
                                        taskId: item.id,
                                        updates: {
                                            order: index,
                                        },
                                    })),
                                    startCol,
                                    endCol,
                                });
                            } catch (error) {
                                console.error('Error updating tasks:', error);
                            }
                        }}
                    />
                );
            case 'kanban':
                return <KanbanView items={tasks} />;
            case 'table':
                return <TableView items={tasks} />;
        }
    };

    // Set page title and description based on the project or milestone
    useEffect(() => {
        if (project) {
            setPageTitle(`${project.name} Tasks`);
            setPageDescription(`Tasks for project: ${project.name}`);
        } else if (milestone) {
            setPageTitle(`${milestone.name} Tasks`);
            setPageDescription(`Tasks for milestone: ${milestone.name}`);
        }
    }, [project, milestone]);

    return (
        <AppLayout>
            <NewTaskModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                defaultProject={projectId}
                defaultMilestone={milestoneId}
            />
            <PageLayout
                backBtn
                maxW={pageView === 'list' ? '3xl' : '6xl'}
                title={pageTitle}
                description={pageDescription}
                primaryAction="New task"
                icon={<RiAddLine fontSize="1.1rem" />}
                onClick={onOpenChange}
            >
                <TaskViewToggle hideList onChange={handleViewChange} />
                {(projectId || milestoneId) && (
                    <TasksFilters
                        showStatusFilter
                        showProjectFilter={!(!projectId || !milestoneId)}
                        showMilestoneFilter={!milestoneId}
                        onFiltersChange={setFilters}
                        initialFilters={{
                            project_id: projectId,
                            milestone_id: milestoneId,
                        }}
                    />
                )}

                <div className="flex flex-col mt-3">
                    {milestone && (
                        <div className="mb-4">
                            <Progress
                                aria-label="Milestone progress"
                                size="sm"
                                color="success"
                                maxValue={taskCount.total}
                                value={taskCount.completed}
                            />
                            <div className="flex items-center justify-between pt-1">
                                <div className="flex gap-3 py-1 items-center">
                                    <Chip size="sm" variant="light" className="text-default-500">
                                        {completedPercentage}%
                                    </Chip>
                                    <Chip size="sm" variant="light" className="text-default-500">
                                        {taskCount.pending} pending
                                    </Chip>
                                    <Chip size="sm" variant="light" className="text-default-500">
                                        {taskCount.completed} completed
                                    </Chip>
                                </div>
                            </div>
                        </div>
                    )}
                    {isPending ? (
                        <div className="w-full flex items-center justify-center basis-[50vh] grow">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        renderTasksView()
                    )}
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default ProjectTasksPage;
