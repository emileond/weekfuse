import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Chip, Link } from '@heroui/react';
import { RiExternalLinkLine, RiCalendarLine, RiPriceTag3Line, RiListUnordered } from 'react-icons/ri';
import { colorContrast } from '../../../../utils/colorContrast.js';
import { formatDate } from '../../../../utils/dateUtils.js';

const TodoistTaskDetails = ({ external_data }) => {
    // Check if due date has passed
    const isDueDatePassed = (dueDate) => {
        if (!dueDate) return false;
        const now = new Date();
        const due = new Date(dueDate);
        return due < now;
    };
    
    const [currentWorkspace] = useCurrentWorkspace();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    // Convert Todoist priority to a more readable format
    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 4:
                return { label: 'Priority 1', color: '#ff5252' }; // Highest
            case 3:
                return { label: 'Priority 2', color: '#ff9800' }; // High
            case 2:
                return { label: 'Priority 3', color: '#2196f3' }; // Medium
            case 1:
            default:
                return { label: 'Priority 4', color: '#757575' }; // Low/Normal
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
                    >
                        {external_data.project_name || `Project ${external_data.project_id}`}
                    </Chip>
                </div>
            )}

            {external_data?.priority && external_data.priority > 1 && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Priority</label>
                    <Chip
                        size="sm"
                        style={{
                            background: getPriorityLabel(external_data.priority).color,
                            color: colorContrast(getPriorityLabel(external_data.priority).color, 'y'),
                        }}
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

            <div className="flex flex-col gap-1">
                <label className="text-sm">Todoist Link</label>
                <Link
                    href={`https://todoist.com/app/task/${external_data.id}`}
                    isExternal
                    className="text-sm text-default-700"
                    showAnchorIcon
                >
                    Open in Todoist
                </Link>
            </div>
        </>
    );
};

export default TodoistTaskDetails;