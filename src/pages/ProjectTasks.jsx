import { useParams } from 'react-router-dom';
import { useDisclosure, Tabs, Tab } from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import { RiAddLine } from 'react-icons/ri';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useTasks } from '../hooks/react-query/tasks/useTasks.js';
import { useProjects } from '../hooks/react-query/projects/useProjects.js';
import { useMilestones } from '../hooks/react-query/milestones/useMilestones.js';
import { useState, useEffect } from 'react';
import NewTaskModal from '../components/tasks/NewTaskModal.jsx';
import TaskCard from '../components/tasks/TaskCard.jsx';

function ProjectTasksPage() {
    const { projectId, milestoneId } = useParams();
    const [currentWorkspace] = useCurrentWorkspace();
    const { isOpen, onOpenChange } = useDisclosure();
    const [pageTitle, setPageTitle] = useState('Tasks');
    const [pageDescription, setPageDescription] = useState('');
    const [activeTab, setActiveTab] = useState('open');

    // Fetch tasks for the specified project or milestone based on selected tab
    const { data: tasks } = useTasks(currentWorkspace, {
        project_id: projectId,
        milestone_id: milestoneId,
        statusList: activeTab === 'open' ? ['pending'] : ['completed'],
    });

    // Fetch project details if projectId is provided
    const { data: projects } = useProjects(currentWorkspace);
    const project = projects?.find((p) => p.id === projectId);

    // Fetch milestone details if milestoneId is provided
    const { data: milestones } = useMilestones(currentWorkspace);
    const milestone = milestones?.find((m) => m.id === milestoneId);

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
                maxW="3xl"
                title={pageTitle}
                description={pageDescription}
                primaryAction="New task"
                icon={<RiAddLine fontSize="1.1rem" />}
                onClick={onOpenChange}
            >
                <div className="flex flex-col mt-3">
                    <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
                        <Tab key="open" title="Open">
                            {tasks && tasks.length > 0 ? (
                                <div className="flex flex-col gap-2 mt-2">
                                    {tasks.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-default-500">
                                        No open tasks found. Create your first task!
                                    </p>
                                </div>
                            )}
                        </Tab>
                        <Tab key="closed" title="Closed">
                            {tasks && tasks.length > 0 ? (
                                <div className="flex flex-col gap-3 mt-3">
                                    {tasks.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-default-500">No closed tasks found.</p>
                                </div>
                            )}
                        </Tab>
                    </Tabs>
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default ProjectTasksPage;
