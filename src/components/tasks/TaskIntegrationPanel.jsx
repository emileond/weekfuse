import IntegrationSourceIcon from './IntegrationSourceIcon.jsx';
import {
    Chip,
    User,
    Link,
    Image,
    Divider,
    Dropdown,
    DropdownTrigger,
    Button,
    DropdownMenu,
    DropdownItem,
    DropdownSection,
} from '@heroui/react';
import {
    RiArrowDownSLine,
    RiCheckboxBlankCircleFill,
    RiCheckboxBlankCircleLine,
    RiCheckboxCircleLine,
    RiGitRepositoryLine,
} from 'react-icons/ri';
import { colorContrast } from '../../utils/colorContrast.js';
import ky from 'ky';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const TaskIntegrationLink = ({ source, external_data }) => {
    switch (source) {
        case 'github':
            return (
                <Link
                    className="font-medium text-blue-700 text-sm"
                    isExternal
                    showAnchorIcon
                    href={external_data?.html_url}
                >
                    #{external_data?.number}
                </Link>
            );
        case 'jira':
            return (
                <div className="flex gap-1 items-center">
                    <Image src={external_data?.fields?.issuetype?.iconUrl} />
                    <Link
                        className="font-medium text-blue-700 text-sm"
                        isExternal
                        showAnchorIcon
                        href={external_data?.self}
                    >
                        {external_data?.key}
                    </Link>
                </div>
            );
    }
};

export const TaskIntegrationDetails = ({ source, external_id, external_data }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const queryClient = useQueryClient();

    external_data?.labels?.map((label) => {
        console.log(colorContrast(label?.color, 'y'));
    });

    const handleStatusChange = async (newState) => {
        try {
            await ky.patch('/api/github/task', {
                json: {
                    external_id,
                    url: external_data.url,
                    state: newState,
                    workspace_id: currentWorkspace.workspace_id,
                },
            });
            toast.success('Github issue updated');
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
            toast.error(error.message);
            console.error('Error updating GitHub task status:', error);
        }
    };

    switch (source) {
        case 'github':
            return (
                <>
                    {external_data?.state && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm">Status</label>
                            <div className="flex gap-3 items-center">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            startContent={
                                                external_data?.state === 'open' ? (
                                                    <RiCheckboxBlankCircleLine
                                                        className="text-default-500"
                                                        fontSize=".8rem"
                                                    />
                                                ) : (
                                                    <RiCheckboxCircleLine
                                                        className="text-default-500"
                                                        fontSize=".8rem"
                                                    />
                                                )
                                            }
                                            endContent={<RiArrowDownSLine fontSize="1rem" />}
                                        >
                                            {external_data?.state}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu>
                                        <DropdownSection title="Move to:">
                                            <DropdownItem
                                                key="open"
                                                onPress={() => handleStatusChange('open')}
                                            >
                                                Open
                                            </DropdownItem>
                                            <DropdownItem
                                                key="closed"
                                                onPress={() => handleStatusChange('closed')}
                                            >
                                                Close
                                            </DropdownItem>
                                        </DropdownSection>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-1 items-start">
                        <label className="text-sm ">Assignees</label>
                        {external_data?.assignees?.map((member) => (
                            <User
                                key={member?.id}
                                name={member?.login}
                                avatarProps={{
                                    src: member?.avatar_url,
                                    size: 'sm',
                                    className: 'w-6 h-6 text-tiny',
                                }}
                            />
                        ))}
                    </div>
                    {!!external_data?.labels?.length && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm">Labels</label>
                            <div className="flex flex-wrap gap-1">
                                {external_data?.labels?.map((label) => (
                                    <Chip
                                        key={label.id}
                                        size="sm"
                                        style={{
                                            background: `#${label?.color}cc`,
                                            color: colorContrast(label?.color, 'y'),
                                        }}
                                    >
                                        {label?.name}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    )}
                    {external_data?.repository && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm">Repository</label>
                            <Chip
                                color="default"
                                className="text-default-500"
                                size="sm"
                                variant="bordered"
                                startContent={<RiGitRepositoryLine fontSize="1rem" />}
                            >
                                <Link
                                    className="text-sm text-default-500"
                                    isExternal
                                    href={external_data?.repository?.html_url}
                                >
                                    {external_data?.repository?.name}
                                </Link>
                            </Chip>
                        </div>
                    )}
                </>
            );

        case 'jira':
            return (
                <>
                    {external_data?.fields?.priority && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm">Priority</label>
                            <Chip
                                color="default"
                                variant="light"
                                startContent={
                                    <Image
                                        width={18}
                                        src={external_data?.fields?.priority?.iconUrl}
                                    />
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
    }
};

const TaskIntegrationPanel = ({ source, external_id, external_data }) => {
    return (
        <div className="flex flex-col gap-6 bg-content2 basis-1/3 p-6 border-l-1 border-default-200">
            <div className="flex gap-3 items-center">
                <h4 className="font-semibold flex gap-1">
                    <IntegrationSourceIcon type={source} /> {source}
                </h4>
                <TaskIntegrationLink source={source} external_data={external_data} />
            </div>
            <Divider />
            <TaskIntegrationDetails
                source={source}
                external_data={external_data}
                external_id={external_id}
            />
        </div>
    );
};

export default TaskIntegrationPanel;
