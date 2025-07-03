import { useDisclosure } from '@heroui/react';
import NewProjectModal from '../components/projects/NewProjectModal.jsx';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useProjects } from '../hooks/react-query/projects/useProjects.js';
import { useState } from 'react';
import Paywall from '../components/marketing/Paywall';
import ProjectCard from '../components/projects/ProjectCard.jsx';
import EmptyState from '../components/EmptyState';

function ProjectsPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const [insufficientCredits, setInsufficientCredits] = useState(false);
    const { data: projects } = useProjects(currentWorkspace);
    const {
        isOpen: isNewProjectModalOpen,
        onOpen: onNewProjectModalOpen,
        onOpenChange: onNewProjectModalOpenChange,
    } = useDisclosure();

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
            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onOpenChange={onNewProjectModalOpenChange}
            />
            <PageLayout
                maxW="3xl"
                title="Projects"
                description="Manage your projects"
                primaryAction="New project"
                onClick={() => onNewProjectModalOpen()}
            >
                <div className="flex flex-col gap-6 mt-3">
                    {projects?.length ? (
                        projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))
                    ) : (
                        <EmptyState
                            title="No projects found"
                            description="Create a new project to get started"
                            primaryAction="New project"
                            onClick={() => onNewProjectModalOpen()}
                        />
                    )}
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default ProjectsPage;
