import { Tab, Tabs } from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useProjects } from '../hooks/react-query/projects/useProjects.js';
import { useMilestones } from '../hooks/react-query/milestones/useMilestones.js';
import { useState, useMemo } from 'react';
import Paywall from '../components/marketing/Paywall';
import ProjectCard from '../components/projects/ProjectCard.jsx';
import MilestoneCard from '../components/milestones/MilestoneCard.jsx';

function ProjectsPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const [insufficientCredits, setInsufficientCredits] = useState(false);
    const { data: projects } = useProjects(currentWorkspace);
    const { data: milestones } = useMilestones(currentWorkspace);

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
                <Tabs aria-label="Page sections">
                    <Tab key="projects" title="Projects">
                        <div className="flex flex-col gap-3">
                            {projects?.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    </Tab>
                    <Tab key="milestones" title="Milestones">
                        <div className="flex flex-col gap-6 mt-3">
                            {projects?.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {projects.map((project) => {
                                        const projectMilestones =
                                            milestonesByProject[project.id] || [];

                                        // Only show projects that have milestones
                                        if (projectMilestones.length === 0) return null;

                                        return (
                                            <div key={project.id}>
                                                <span className="text-sm font-medium">
                                                    {project.name}
                                                </span>
                                                <div className="flex flex-col gap-3 pl-3 py-3">
                                                    {projectMilestones.map((milestone) => (
                                                        <MilestoneCard
                                                            key={milestone.id}
                                                            milestone={milestone}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                    </Tab>
                </Tabs>
                <div>
                    {projects?.length === 0 && (
                        <div className="col-span-2 text-center py-10">
                            <p className="text-default-500">
                                No projects found. Create your first project!
                            </p>
                        </div>
                    )}
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default ProjectsPage;
