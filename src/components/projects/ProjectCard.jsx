import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    useDisclosure,
} from '@heroui/react';
import { RiMoreLine } from 'react-icons/ri';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import { useTaskCountByProject } from '../../hooks/react-query/projects/useProjects.js';

import { Link } from 'react-router-dom';
import { useMilestones } from '../../hooks/react-query/milestones/useMilestones.js';
import MilestoneCard from '../milestones/MilestoneCard.jsx';
import UpdateProjectModal from './UpdateProjectModal.jsx';
import DeleteProjectConfirmationDialog from './DeleteProjectConfirmationDialog.jsx';

const ProjectCard = ({ project }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: taskCount } = useTaskCountByProject(project?.id);
    const { data: milestones } = useMilestones(currentWorkspace, project?.id);

    const {
        isOpen: isUpdateProjectModalOpen,
        onOpen: onUpdateProjectModalOpen,
        onOpenChange: onUpdateProjectModalOpenChange,
    } = useDisclosure();
    const {
        isOpen: isDeleteConfirmationOpen,
        onOpen: onDeleteConfirmationOpen,
        onOpenChange: onDeleteConfirmationOpenChange,
    } = useDisclosure();

    const handleAction = (key) => {
        switch (key) {
            case 'edit':
                // Open the update project modal
                onUpdateProjectModalOpen();
                break;
            case 'delete':
                // Open the delete confirmation dialog
                onDeleteConfirmationOpen();
                break;
            default:
                null;
        }
    };

    return (
        <>
            <UpdateProjectModal
                isOpen={isUpdateProjectModalOpen}
                onOpenChange={onUpdateProjectModalOpenChange}
                project={project}
            />
            <DeleteProjectConfirmationDialog
                isOpen={isDeleteConfirmationOpen}
                onOpenChange={onDeleteConfirmationOpenChange}
                project={project}
            />
            <div key={project.id} className="border rounded-lg overflow-hidden border-content4">
                <div className="w-full flex items-center gap-3 justify-between p-3 bg-background">
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/projects/${project.id}/tasks`}
                            className="text-sm font-medium hover:text-primary-600"
                        >
                            {project.name}
                        </Link>
                        <span className="text-xs text-default-500">
                            Open tasks: {taskCount?.pending}
                        </span>
                    </div>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                size="sm"
                                variant="flat"
                                isIconOnly
                                startContent={<RiMoreLine fontSize="1.2rem" />}
                            />
                        </DropdownTrigger>
                        <DropdownMenu onAction={(key) => handleAction(key, project.id)}>
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
                <div className="flex flex-col gap-3 p-3">
                    {milestones?.map((milestone) => (
                        <MilestoneCard key={milestone.id} milestone={milestone} />
                    ))}
                    {!milestones && (
                        <div className="text-center py-3">
                            <p className="text-default-500 text-sm">
                                No milestones for this project yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProjectCard;
