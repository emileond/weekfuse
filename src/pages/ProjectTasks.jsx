import { useParams } from 'react-router-dom';
import { useDisclosure, Progress, Chip, Spinner } from '@heroui/react';
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
import EmptyState from '../components/EmptyState.jsx';

function ProjectTasksPage() {
    const { projectId, milestoneId } = useParams();
    const [currentWorkspace] = useCurrentWorkspace();
    const { isOpen, onOpenChange } = useDisclosure();
    const [pageTitle, setPageTitle] = useState('Tasks');
    const [pageDescription, setPageDescription] = useState('');
    const [pageView, setPageView] = useState('table');
    const [filters, setFilters] = useState({});

    const { data: tasks, isPending } = useTasks(currentWorkspace, filters);
    const { mutateAsync: updateMultipleTasks } = useUpdateMultipleTasks(currentWorkspace);
    const { data: projects } = useProjects(currentWorkspace);
    const { data: milestones } = useMilestones(currentWorkspace);

    // Memoize finding the current milestone object
    const milestone = useMemo(
        () => milestones?.find((m) => m.id === milestoneId),
        [milestones, milestoneId],
    );

    const effectiveProjectId = useMemo(() => {
        if (projectId) {
            return projectId;
        }
        return milestone?.project_id;
    }, [projectId, milestone]);

    const project = useMemo(
        () => projects?.find((p) => p.id === effectiveProjectId),
        [projects, effectiveProjectId],
    );

    const { data: projectTaskCount } = useTaskCountByProject(effectiveProjectId);
    const { data: milestoneTaskCount } = useTaskCountByMilestone(milestoneId);

    const handleViewChange = (newView) => {
        setPageView(newView);
    };

    const taskCount = useMemo(() => {
        if (milestoneId && milestoneTaskCount) {
            return milestoneTaskCount;
        } else if (effectiveProjectId && projectTaskCount) {
            return projectTaskCount;
        }
        return { total: 0, pending: 0, completed: 0 };
    }, [milestoneId, effectiveProjectId, milestoneTaskCount, projectTaskCount]);

    const completedPercentage = useMemo(() => {
        return taskCount.total > 0 ? Math.round((taskCount.completed / taskCount.total) * 100) : 0;
    }, [taskCount]);

    useEffect(() => {
        if (milestone) {
            setPageTitle(`${milestone.name} Tasks`);
            setPageDescription(`Tasks for milestone: ${milestone.name}`);
        } else if (project) {
            setPageTitle(`${project.name} Tasks`);
            setPageDescription(`Tasks for project: ${project.name}`);
        }
    }, [project, milestone]);

    const renderTasksView = () => {
        switch (pageView) {
            case 'list':
                return (
                    <DraggableList
                        id={effectiveProjectId || milestoneId}
                        items={tasks || []}
                        group="project-tasks"
                        onDragEnd={async (e, startCol) => {
                            const endCol = e.parent.el.id;
                            try {
                                await updateMultipleTasks({
                                    tasks: e.values.map((item, index) => ({
                                        taskId: item.id,
                                        updates: { order: index },
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

    return (
        <AppLayout>
            <NewTaskModal
                key={`${effectiveProjectId}-${milestoneId}`}
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                defaultProject={effectiveProjectId}
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
                <TaskViewToggle
                    pageKey={milestone ? 'milestone' : 'project'}
                    hideList
                    onChange={handleViewChange}
                />
                {(effectiveProjectId || milestoneId) && (
                    <TasksFilters
                        showStatusFilter
                        showProjectFilter={!milestoneId}
                        showMilestoneFilter={!milestoneId}
                        preserveProjectFilter={!!effectiveProjectId}
                        preserveMilestoneFilter={!!milestoneId}
                        onFiltersChange={setFilters}
                        initialFilters={{
                            project_id: effectiveProjectId,
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
                    ) : tasks?.length === 0 ? (
                        <EmptyState
                            title="No tasks found"
                            description="Create your first task for this project"
                            primaryAction="Add a task"
                            onClick={onOpenChange}
                        />
                    ) : (
                        renderTasksView()
                    )}
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default ProjectTasksPage;
