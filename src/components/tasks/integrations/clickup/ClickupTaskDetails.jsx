import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from '@heroui/react';
import { RiArrowDownSLine } from 'react-icons/ri';
import { formatDate } from '../../../../utils/dateUtils.js';
import ky from 'ky';

const ClickupTaskDetails = ({ external_data }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    // Check if due date has passed
    const isDueDatePassed = (dueDate) => {
        if (!dueDate) return false;
        const now = new Date();
        const due = new Date(dueDate);
        return due < now;
    };

    const handleStatusChange = async (status) => {
        setIsLoading(true);
        try {
            await ky.patch('/api/clickup/task', {
                json: {
                    external_id: external_data?.id,
                    status,
                    user_id: currentWorkspace?.user_id,
                },
            });
            toast.success('ClickUp status updated');
            await queryClient.cancelQueries({
                queryKey: ['tasks'],
            });

            await queryClient.invalidateQueries({
                queryKey: ['tasks'],
                refetchType: 'all',
            });
            await queryClient.invalidateQueries({
                queryKey: ['backlogTasks'],
                refetchType: 'all',
            });
        } catch (error) {
            toast.error(error.message || 'Failed to update ClickUp status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {external_data?.status && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Status</label>
                    <div>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    className="font-medium"
                                    endContent={<RiArrowDownSLine fontSize="1rem" />}
                                    isLoading={isLoading}
                                >
                                    {external_data?.status?.status}
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownSection title="Move to:">
                                    <DropdownItem onPress={() => handleStatusChange('to do')}>
                                        To Do
                                    </DropdownItem>
                                    <DropdownItem onPress={() => handleStatusChange('in progress')}>
                                        In Progress
                                    </DropdownItem>
                                    <DropdownItem onPress={() => handleStatusChange('complete')}>
                                        Complete
                                    </DropdownItem>
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
            )}

            {external_data?.priority && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Priority</label>
                    <Chip
                        color="default"
                        variant="light"
                    >
                        {external_data?.priority?.priority}
                    </Chip>
                </div>
            )}

            {!!external_data?.tags?.length && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Tags</label>
                    <div className="flex flex-wrap gap-1">
                        {external_data?.tags?.map((tag) => (
                            <Chip key={tag.name} size="sm">
                                {tag.name}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}

            {external_data?.assignees && external_data?.assignees.length > 0 && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Assignees</label>
                    <div className="flex flex-wrap gap-1">
                        {external_data?.assignees.map((assignee) => (
                            <Chip key={assignee.id} size="sm">
                                {assignee.username}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}

            {!!external_data?.due_date && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Due date</label>
                    <div className="flex flex-wrap gap-1 items-center">
                        {formatDate(external_data?.due_date, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        })}
                        {isDueDatePassed(external_data?.due_date) && (
                            <Chip color="danger" size="sm" className="ml-2" variant="flat">
                                overdue
                            </Chip>
                        )}
                    </div>
                </div>
            )}

            {external_data?.list && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">List</label>
                    <Chip
                        color="default"
                        className="text-default-700"
                        size="sm"
                        variant="bordered"
                    >
                        {external_data.list.name}
                    </Chip>
                </div>
            )}
        </>
    );
};

export default ClickupTaskDetails;
