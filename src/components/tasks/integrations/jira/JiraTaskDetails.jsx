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
    Spinner,
} from '@heroui/react';
import { RiArrowDownSLine } from 'react-icons/ri';
import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';
import { useJiraIssue } from '../../../../hooks/react-query/integrations/jira/useJiraIssue.js';
import {
    useJiraTransitions,
    useJiraTransitionIssue,
} from '../../../../hooks/react-query/integrations/jira/useJiraTransitions.js';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../../../../hooks/react-query/user/useUser.js';

const JiraTaskDetails = ({ task_id, external_data }) => {
    const { data: user } = useUser();
    const [currentWorkspace] = useCurrentWorkspace();
    const queryClient = useQueryClient();

    // --- React Query Hooks ---
    const { data: jiraIssue, isLoading: isStatusLoading } = useJiraIssue({
        issueIdOrKey: external_data?.id,
        user_id: user?.id,
        workspace_id: currentWorkspace?.workspace_id,
    });

    const { data: transitions } = useJiraTransitions({
        issueIdOrKey: external_data?.id,
        user_id: user?.id,
        workspace_id: currentWorkspace?.workspace_id,
    });

    const { mutateAsync: transitionIssue, isLoading: isTransitioning } = useJiraTransitionIssue();

    // --- Live Data with Fallback Pattern ---
    // Use live data from jiraIssue if available, otherwise fallback to saved external_data
    const currentStatus = jiraIssue?.fields?.status || external_data?.fields?.status;
    const currentPriority = jiraIssue?.fields?.priority || external_data?.fields?.priority;
    const currentLabels = jiraIssue?.fields?.labels || external_data?.fields?.labels;
    const currentAssignee = jiraIssue?.fields?.assignee || external_data?.fields?.assignee;
    const currentReporter = jiraIssue?.fields?.reporter || external_data?.fields?.reporter;

    // --- Simplified Event Handler ---
    const handleTransition = async (transitionId) => {
        try {
            await transitionIssue({
                task_id,
                issueIdOrKey: external_data?.id,
                transitionId,
                user_id: user?.id,
                workspace_id: currentWorkspace?.workspace_id,
            });
            toast.success('Jira status updated');

            // Invalidate the specific issue query to refetch its status and other details instantly
            await queryClient.invalidateQueries({
                queryKey: ['jira', 'issue', external_data?.id],
            });
        } catch (error) {
            toast.error(error.message || 'Failed to update Jira status');
        }
    };

    if (isStatusLoading && !external_data) {
        return <Spinner label="Loading Jira details..." />;
    }

    return (
        <>
            {/* --- Status Section --- */}
            {currentStatus && (
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
                                    isLoading={isStatusLoading || isTransitioning}
                                >
                                    {currentStatus.name}
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Jira Status Transitions">
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

            {/* --- Priority Section --- */}
            {currentPriority && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Priority</label>
                    <Chip
                        color="default"
                        variant="light"
                        startContent={<Image width={18} src={currentPriority.iconUrl} />}
                    >
                        {currentPriority.name}
                    </Chip>
                </div>
            )}

            {/* --- Labels Section --- */}
            {!!currentLabels?.length && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Labels</label>
                    <div className="flex flex-wrap gap-1">
                        {currentLabels.map((label) => (
                            <Chip key={label} size="sm">
                                {label}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Assignee Section --- */}
            {currentAssignee && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Assignee</label>
                    <div className="flex flex-wrap gap-1">
                        <User
                            name={currentAssignee.displayName}
                            avatarProps={{
                                src: currentAssignee.avatarUrls?.['24x24'],
                                size: 'sm',
                                className: 'w-6 h-6 text-tiny',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* --- Reporter Section --- */}
            {currentReporter && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Reporter</label>
                    <div className="flex flex-wrap gap-1">
                        <User
                            name={currentReporter.displayName}
                            avatarProps={{
                                src: currentReporter.avatarUrls?.['24x24'],
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
