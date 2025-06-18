import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Chip, Link } from '@heroui/react';
import { RiExternalLinkLine, RiKanbanView2, RiListUnordered, RiCalendarLine, RiPriceTag3Line } from 'react-icons/ri';
import { colorContrast } from '../../../../utils/colorContrast.js';
import { formatDate } from '../../../../utils/dateUtils.js';

const TickTickTaskDetails = ({ external_data }) => {
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

    // Function to convert TickTick priority to a color
    function priorityToColor(priority) {
        switch (priority) {
            case 'high':
                return '#F54180'; // Red for high priority
            case 'medium':
                return '#fcc800'; // Yellow for medium priority
            case 'low':
                return '#45D483'; // Green for low priority
            default:
                return '#90a1b9'; // Default color
        }
    }

    return (
        <>
            {external_data?.projectName && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Project</label>
                    <Chip
                        color="default"
                        className="text-default-700"
                        size="sm"
                        variant="bordered"
                        startContent={<RiKanbanView2 fontSize=".9rem" />}
                        endContent={<RiExternalLinkLine fontSize=".9rem" />}
                    >
                        <Link
                            className="text-sm text-default-700"
                            isExternal
                            href={`https://ticktick.com/webapp/#p/${external_data.projectId}`}
                        >
                            {external_data.projectName}
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
            
            {external_data?.priority && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Priority</label>
                    <Chip
                        size="sm"
                        style={{
                            background: priorityToColor(external_data.priority),
                            color: colorContrast(priorityToColor(external_data.priority), 'y'),
                        }}
                    >
                        {external_data.priority}
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
                            size="sm"
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