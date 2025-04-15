import IntegrationSourceIcon from './IntegrationSourceIcon.jsx';
import { Avatar, Chip, User, Link, Divider } from '@heroui/react';
import { RiGitRepositoryLine } from 'react-icons/ri';
import { colorContrast } from '../../utils/colorContrast.js';

export const TaskIntegrationDetails = ({ source, external_id, external_data }) => {
    external_data?.labels?.map((label) => {
        console.log(colorContrast(label?.color, 'y'));
    });
    switch (source) {
        case 'github':
            return (
                <>
                    {external_data?.state && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm">Issue</label>
                            <div className="flex gap-3">
                                <Link
                                    className="font-medium text-blue-700"
                                    isExternal
                                    showAnchorIcon
                                    href={external_data?.html_url}
                                >
                                    #{external_data?.number}
                                </Link>
                                <Chip
                                    color={external_data?.state === 'open' ? 'success' : 'primary'}
                                    size="sm"
                                    variant="dot"
                                >
                                    {external_data?.state}
                                </Chip>
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
                                }}
                            />
                        ))}
                    </div>
                    {external_data?.labels?.length && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm">Labels</label>
                            <div className="flex flex-wrap gap-1">
                                {external_data?.labels?.map((label) => (
                                    <Chip
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
    }
};

const TaskIntegrationPanel = ({ source, external_id, external_data }) => {
    return (
        <>
            <div className="w-[1px] bg-content2"></div>
            <div className="flex flex-col gap-6 basis-1/3 pr-6 pt-6 pb-6">
                <h4 className="font-semibold flex gap-1">
                    <IntegrationSourceIcon type={source} /> {source}
                </h4>
                <Divider />
                <TaskIntegrationDetails
                    source={source}
                    external_data={external_data}
                    external_id={external_id}
                />
            </div>
        </>
    );
};

export default TaskIntegrationPanel;
