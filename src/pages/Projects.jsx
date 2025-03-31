import {
    Avatar,
    CardHeader,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Progress,
    Tab,
    Tabs,
    useDisclosure,
} from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import { RiAddLine, RiListCheck3, RiFlag2Line } from 'react-icons/ri';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useProjects } from '../hooks/react-query/projects/useProjects.js';
import { useMilestones } from '../hooks/react-query/milestones/useMilestones.js';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import Paywall from '../components/marketing/Paywall';
import { Card, CardBody, CardFooter, Button } from '@heroui/react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionItem } from '@heroui/accordion';

function ProjectsPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const { isOpen, onOpenChange } = useDisclosure();
    const [insufficientCredits, setInsufficientCredits] = useState(false);
    const { data: projects } = useProjects(currentWorkspace);
    const { data: milestones } = useMilestones(currentWorkspace);
    const navigate = useNavigate();

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
                                <Card
                                    key={project.id}
                                    shadow="none"
                                    className="w-full border-1 border-default-200"
                                >
                                    <CardBody>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2 items-center text-default-500">
                                                <RiListCheck3 fontSize="1.2rem" />
                                                <div>
                                                    <p className="font-medium text-default-900">
                                                        {project.name}
                                                    </p>
                                                    <p className="text-sm">123 Tasks</p>
                                                </div>
                                            </div>
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button size="sm" isIconOnly>
                                                        A
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu>
                                                    <DropdownItem>Delete</DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>
                                    </CardBody>
                                </Card>
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
                                            <div
                                                key={project.id}
                                                // title={
                                                //     <div className="flex items-center gap-2">
                                                //         <RiListCheck3 fontSize="1.2rem" />
                                                //         <Chip size="sm" variant="flat" color="primary">
                                                //             {projectMilestones.length}
                                                //         </Chip>
                                                //     </div>
                                                // }
                                            >
                                                <span className="text-sm font-medium">
                                                    {project.name}
                                                </span>
                                                <div className="flex flex-col gap-3 pl-3 py-3">
                                                    {projectMilestones.map((milestone) => (
                                                        <Card
                                                            key={milestone.id}
                                                            shadow="none"
                                                            className="w-full border-1 border-default-200"
                                                        >
                                                            <CardHeader>
                                                                <div className="w-full flex justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <RiFlag2Line
                                                                            fontSize="1rem"
                                                                            className="text-primary"
                                                                        />
                                                                        <span>
                                                                            {milestone.name}
                                                                        </span>
                                                                    </div>
                                                                    <Dropdown>
                                                                        <DropdownTrigger>
                                                                            <Button
                                                                                size="sm"
                                                                                isIconOnly
                                                                            >
                                                                                ...
                                                                            </Button>
                                                                        </DropdownTrigger>
                                                                        <DropdownMenu>
                                                                            <DropdownItem>
                                                                                Delete
                                                                            </DropdownItem>
                                                                        </DropdownMenu>
                                                                    </Dropdown>
                                                                </div>
                                                            </CardHeader>
                                                            <CardBody>
                                                                <Progress
                                                                    size="sm"
                                                                    color="success"
                                                                    value={Math.random(10, 100)}
                                                                    maxValue={1}
                                                                />
                                                                <div className="flex items-center justify-between pt-1">
                                                                    <div className="flex gap-3 py-1 items-center">
                                                                        <Chip
                                                                            size="sm"
                                                                            variant="light"
                                                                            className="text-default-500"
                                                                        >
                                                                            68% complete
                                                                        </Chip>
                                                                        <Chip
                                                                            size="sm"
                                                                            variant="light"
                                                                            className="text-default-500"
                                                                        >
                                                                            29 open
                                                                        </Chip>
                                                                        <Chip
                                                                            size="sm"
                                                                            variant="light"
                                                                            className="text-default-500"
                                                                        >
                                                                            29 closed
                                                                        </Chip>
                                                                    </div>

                                                                    <Link
                                                                        to="#"
                                                                        className="text-sm font-medium text-primary hover:text-primary-600"
                                                                    >
                                                                        View tasks
                                                                    </Link>
                                                                </div>
                                                            </CardBody>
                                                        </Card>
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
