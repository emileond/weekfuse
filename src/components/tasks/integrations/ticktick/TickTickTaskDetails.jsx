import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';
import { Chip, Link, Spinner } from '@heroui/react';
import {
    RiExternalLinkLine,
    RiKanbanView2,
    RiListUnordered,
    RiCalendarLine,
    RiPriceTag3Line,
    RiFlagFill,
} from 'react-icons/ri';
import { formatDate } from '../../../../utils/dateUtils.js';
import { useTickTickProject } from '../../../../hooks/react-query/integrations/ticktick/useTickTickProject.js';
import { useUser } from '../../../../hooks/react-query/user/useUser.js';

const TickTickTaskDetails = ({ task_id, external_data }) => {
    // Check if due date has passed
    const isDueDatePassed = (dueDate) => {
        if (!dueDate) return false;
        const now = new Date();
        const due = new Date(dueDate);
        return due < now;
    };
    const { data: user } = useUser();
    const [currentWorkspace] = useCurrentWorkspace();

    // --- React Query Hooks ---
    const { data: tickTickProject, isLoading: isProjectLoading } = useTickTickProject({
        projectId: external_data?.projectId,
        user_id: user?.id,
        workspace_id: currentWorkspace?.workspace_id,
    });

    console.log(tickTickProject);

    // --- Live Data with Fallback Pattern ---
    // Use live data from tickTickProject if available, otherwise fallback to saved external_data
    const projectName = tickTickProject?.name;

    // Function to convert TickTick priority to a Tailwind CSS text color class
    function priorityToColorClass(priority) {
        switch (Number(priority)) {
            case 0:
                return 'text-default';
            case 1:
                return 'text-primary';
            case 3:
                return 'text-warning';
            case 5:
                return 'text-danger';
            default:
                return 'text-default';
        }
    }

    // Function to convert TickTick priority to a label
    function priorityToLabel(priority) {
        switch (Number(priority)) {
            case 0:
                return 'none';
            case 1:
                return 'low';
            case 3:
                return 'medium';
            case 5:
                return 'high';
            default:
                return 'unknown';
        }
    }

    if (isProjectLoading && !external_data) {
        return <Spinner label="Loading TickTick details..." />;
    }

    return (
        <>
            {projectName && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Project</label>
                    <Chip
                        color="default"
                        className="text-default-700"
                        size="sm"
                        variant="bordered"
                        startContent={<RiKanbanView2 fontSize=".9rem" />}
                        endContent={<RiExternalLinkLine fontSize=".9rem" />}
                        isLoading={isProjectLoading}
                    >
                        <Link
                            className="text-sm text-default-700"
                            isExternal
                            href={`https://ticktick.com/webapp/#p/${external_data.projectId}/tasks`}
                        >
                            {projectName}
                        </Link>
                    </Chip>
                </div>
            )}

            {external_data?.listName && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">List</label>
                    <Chip
                        color="default"
                        className="text-default-700"
                        size="sm"
                        variant="bordered"
                        startContent={<RiListUnordered fontSize=".9rem" />}
                    >
                        {external_data.listName}
                    </Chip>
                </div>
            )}

            {external_data?.priority !== undefined && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Priority</label>
                    <Chip
                        variant="light"
                        // className={priorityToColorClass(external_data.priority)}
                        startContent={
                            <RiFlagFill
                                fontSize="1rem"
                                className={priorityToColorClass(external_data.priority)}
                            />
                        }
                    >
                        {priorityToLabel(external_data.priority)}
                    </Chip>
                </div>
            )}

            {!!external_data?.tags?.length && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Tags</label>
                    <div className="flex flex-wrap gap-1">
                        {external_data.tags.map((tag, index) => (
                            <Chip
                                key={index}
                                variant="bordered"
                                size="sm"
                                startContent={<RiPriceTag3Line fontSize=".9rem" />}
                            >
                                {tag}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}

            {!!external_data?.dueDate && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Due date</label>
                    <div className="flex flex-wrap gap-1 items-center">
                        <Chip
                            color="default"
                            className="text-default-700"
                            variant="bordered"
                            startContent={<RiCalendarLine fontSize=".9rem" />}
                        >
                            {formatDate(external_data.dueDate, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            })}
                        </Chip>
                        {isDueDatePassed(external_data.dueDate) && (
                            <Chip color="danger" size="sm" className="ml-2" variant="flat">
                                overdue
                            </Chip>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default TickTickTaskDetails;
