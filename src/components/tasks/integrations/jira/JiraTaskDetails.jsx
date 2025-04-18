import {
    Button,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    DropdownSection,
    Image,
    User,
} from '@heroui/react';
import { RiArrowDownSLine } from 'react-icons/ri';
import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';
import {
    useJiraTransitions,
    useJiraTransitionIssue,
} from '../../../../hooks/react-query/integrations/jira/useJiraTransitions.js';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const JiraTaskDetails = ({ external_data }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const queryClient = useQueryClient();
    const { data: transitions } = useJiraTransitions(
        external_data?.id,
        currentWorkspace?.workspace_id,
    );
    const { mutateAsync: transitionIssue } = useJiraTransitionIssue();
    const [isLoading, setIsLoading] = useState(false);

    const handleTransition = async (transitionId) => {
        setIsLoading(true);
        try {
            await transitionIssue({
                issueIdOrKey: external_data?.id,
                transitionId,
                workspace_id: currentWorkspace?.workspace_id,
            });
            toast.success('Jira status updated');
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
            toast.error(error.message || 'Failed to update jira status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {external_data?.fields?.status && (
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
                                    {external_data?.fields?.status?.name}
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownSection title="Move to:">
                                    {transitions?.map((item) => (
                                        <DropdownItem
                                            key={item.id}
                                            onPress={() => handleTransition(item.id)}
                                        >
                                            {item.name}
                                        </DropdownItem>
                                    ))}
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
            )}
            {external_data?.fields?.priority && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Priority</label>
                    <Chip
                        color="default"
                        variant="light"
                        startContent={
                            <Image width={18} src={external_data?.fields?.priority?.iconUrl} />
                        }
                    >
                        {external_data?.fields?.priority?.name}
                    </Chip>
                </div>
            )}
            {!!external_data?.fields?.labels?.length && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Labels</label>
                    <div className="flex flex-wrap gap-1">
                        {external_data?.fields?.labels?.map((label) => (
                            <Chip key={label} size="sm">
                                {label}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}
            {!!external_data?.fields?.assignee && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Assignee</label>
                    <div className="flex flex-wrap gap-1">
                        <User
                            name={external_data?.fields?.assignee?.displayName}
                            avatarProps={{
                                src: external_data?.fields?.assignee?.avatarUrls?.['24x24'],
                                size: 'sm',
                                className: 'w-6 h-6 text-tiny',
                            }}
                        />
                    </div>
                </div>
            )}
            {!!external_data?.fields?.reporter && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Reporter</label>
                    <div className="flex flex-wrap gap-1">
                        <User
                            name={external_data?.fields?.reporter?.displayName}
                            avatarProps={{
                                src: external_data?.fields?.reporter?.avatarUrls?.['24x24'],
                                size: 'sm',
                                className: 'w-6 h-6 text-tiny',
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default JiraTaskDetails;
