import { Chip, Spinner } from '@heroui/react';
import { RiCalendarLine, RiPriceTag3Line, RiListUnordered, RiFlagFill, RiExternalLinkLine } from 'react-icons/ri';
import { formatDate } from '../../../../utils/dateUtils.js';
import { useUser } from '../../../../hooks/react-query/user/useUser.js';
import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';
import { useTodoistProject } from '../../../../hooks/react-query/integrations/todoist/useTodoistProject.js';

const TodoistTaskDetails = ({ external_data }) => {
    // Check if due date has passed
    const isDueDatePassed = (dueDate) => {
        if (!dueDate) return false;
        const now = new Date();
        const due = new Date(dueDate);
        return due < now;
    };

    const { data: user } = useUser();
    const [currentWorkspace] = useCurrentWorkspace();

    // Fetch project details if project_id is available
    const { data: todoistProject, isLoading: isProjectLoading } = useTodoistProject({
        projectId: external_data?.project_id,
        user_id: user?.id,
        workspace_id: currentWorkspace?.workspace_id,
    });

    // Use project name from API response if available, otherwise fallback to saved name or ID
    const projectName = todoistProject?.name || external_data?.project_name || `Project ${external_data?.project_id}`;

    // Convert Todoist priority to a more readable format
    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 4:
                return { label: 'P1', color: 'text-danger' }; // Highest
            case 3:
                return { label: 'P2', color: 'text-warning' }; // High
            case 2:
                return { label: 'P3', color: 'text-blue' }; // Medium
            case 1:
            default:
                return { label: 'P4', color: 'text-default' }; // Low/Normal
        }
    };

    return (
        <>
            {external_data?.project_id && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Project</label>
                    <Chip
                        color="default"
                        className="text-default-700"
                        size="sm"
                        variant="bordered"
                        startContent={<RiListUnordered fontSize=".9rem" />}
                        isLoading={isProjectLoading}
                    >
                        {projectName}
                    </Chip>
                </div>
            )}

            {external_data?.priority && external_data.priority > 1 && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Priority</label>
                    <Chip
                        size="sm"
                        variant="light"
                        startContent={
                            <RiFlagFill
                                fontSize=".9rem"
                                className={getPriorityLabel(external_data.priority).color}
                            />
                        }
                    >
                        {getPriorityLabel(external_data.priority).label}
                    </Chip>
                </div>
            )}

            {external_data?.labels?.length > 0 && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Labels</label>
                    <div className="flex flex-wrap gap-1">
                        {external_data.labels.map((label, index) => (
                            <Chip
                                key={index}
                                size="sm"
                                startContent={<RiPriceTag3Line fontSize=".9rem" />}
                            >
                                {label}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}

            {external_data?.due && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Due date</label>
                    <div className="flex flex-wrap gap-1 items-center">
                        <Chip
                            color="default"
                            className="text-default-700"
                            size="sm"
                            variant="bordered"
                            startContent={<RiCalendarLine fontSize=".9rem" />}
                        >
                            {formatDate(external_data.due.date, {
                                dateStyle: 'medium',
                                timeStyle: external_data.due.datetime ? 'short' : undefined,
                            })}
                        </Chip>
                        {isDueDatePassed(external_data.due.date) && (
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

export default TodoistTaskDetails;
