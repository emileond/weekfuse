import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    useDisclosure,
} from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import {
    useProjects,
    useTaskCountByProject,
    useUpdateProject,
    useDeleteProject,
} from '../hooks/react-query/projects/useProjects.js';
import { useMilestones } from '../hooks/react-query/milestones/useMilestones.js';
import { useState, useMemo } from 'react';
import Paywall from '../components/marketing/Paywall';
import MilestoneCard from '../components/milestones/MilestoneCard.jsx';
import { RiMoreLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function ProjectsPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const [insufficientCredits, setInsufficientCredits] = useState(false);
    const [activeProject, setActiveProject] = useState(null);
    const { data: projects } = useProjects(currentWorkspace);
    const { data: milestones } = useMilestones(currentWorkspace);
    const { mutateAsync: updateProject } = useUpdateProject(currentWorkspace);
    const { mutateAsync: deleteProject } = useDeleteProject(currentWorkspace);
    const { isOpen: isMenuOpen, onOpenChange: onMenuOpenChange } = useDisclosure();

    // We'll use individual hooks for each project at the top level
    // This is a temporary solution - in a real-world scenario, we might want to
    // fetch all task counts at once with a single API call
    const project1 = projects?.[0]?.id;
    const project2 = projects?.[1]?.id;
    const project3 = projects?.[2]?.id;
    const project4 = projects?.[3]?.id;
    const project5 = projects?.[4]?.id;

    const { data: taskCount1 } = useTaskCountByProject(project1);
    const { data: taskCount2 } = useTaskCountByProject(project2);
    const { data: taskCount3 } = useTaskCountByProject(project3);
    const { data: taskCount4 } = useTaskCountByProject(project4);
    const { data: taskCount5 } = useTaskCountByProject(project5);

    // Create a mapping of project IDs to their respective task counts
    const taskCountsByProject = useMemo(() => {
        const counts = {};
        if (project1) counts[project1] = taskCount1 || 0;
        if (project2) counts[project2] = taskCount2 || 0;
        if (project3) counts[project3] = taskCount3 || 0;
        if (project4) counts[project4] = taskCount4 || 0;
        if (project5) counts[project5] = taskCount5 || 0;
        return counts;
    }, [
        project1,
        project2,
        project3,
        project4,
        project5,
        taskCount1,
        taskCount2,
        taskCount3,
        taskCount4,
        taskCount5,
    ]);

    const handleAction = (key, projectId) => {
        setActiveProject(projectId);
        switch (key) {
            case 'edit':
                // Handle edit project (would need a modal)
                toast('Edit project functionality would go here');
                break;
            case 'delete':
                // Handle delete project (would need a confirmation)
                toast('Delete project functionality would go here');
                break;
            default:
                null;
        }
    };

    // Group milestones by project
    const milestonesByProject = useMemo(() => {
        if (!milestones || !projects) return {};

        const groupedMilestones = {};

        // Initialize with empty arrays for all projects
        projects.forEach((project) => {
            groupedMilestones[project.id] = [];
        });

        // Group milestones by project_id
        milestones.forEach((milestone) => {
            if (milestone.project_id && groupedMilestones[milestone.project_id]) {
                groupedMilestones[milestone.project_id].push(milestone);
            }
        });

        return groupedMilestones;
    }, [milestones, projects]);

    return (
        <AppLayout>
            <Paywall
                isOpen={insufficientCredits}
                onOpenChange={(open) => {
                    if (!open) {
                        setInsufficientCredits(false);
                    }
                }}
                feature="more credits"
            />
            {/* TODO: Add NewProjectModal component if needed */}
            <PageLayout maxW="3xl" title="Projects" description="Manage your projects">
                <div className="flex flex-col gap-6 mt-3">
                    {projects?.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {projects?.map((project) => (
                                <div 
                                    key={project.id}
                                    className="border rounded-lg overflow-hidden"
                                >
                                    <div className="w-full flex items-center gap-3 justify-between p-3 bg-default-50">
                                        <div className="flex items-center gap-2">
                                            <Link 
                                                to={`/projects/${project.id}/tasks`} 
                                                className="text-sm font-medium hover:text-primary-600"
                                            >
                                                {project.name}
                                            </Link>
                                            <span className="text-xs text-default-500">
                                                ({taskCountsByProject[project.id] || 0}{' '}
                                                tasks)
                                            </span>
                                        </div>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    isIconOnly
                                                    startContent={
                                                        <RiMoreLine fontSize="1.2rem" />
                                                    }
                                                />
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                onAction={(key) =>
                                                    handleAction(key, project.id)
                                                }
                                            >
                                                <DropdownItem key="edit">Edit</DropdownItem>
                                                <DropdownItem
                                                    key="delete"
                                                    className="text-danger"
                                                    variant="flat"
                                                    color="danger"
                                                >
                                                    Delete
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                    <div className="flex flex-col gap-3 pl-3 py-3">
                                        {(milestonesByProject[project.id] || [])?.length > 0 ? (
                                            (milestonesByProject[project.id] || [])?.map(
                                                (milestone) => (
                                                    <MilestoneCard
                                                        key={milestone.id}
                                                        milestone={milestone}
                                                    />
                                                ),
                                            )
                                        ) : (
                                            <div className="text-center py-3">
                                                <p className="text-default-500 text-sm">
                                                    No milestones for this project yet.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-default-500">
                                No projects found. Create a project first to add milestones.
                            </p>
                        </div>
                    )}

                    {projects?.length > 0 &&
                        Object.values(milestonesByProject).flat().length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-default-500">
                                    No milestones found. Create your first milestone!
                                </p>
                            </div>
                        )}
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default ProjectsPage;
