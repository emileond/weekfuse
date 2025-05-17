import IntegrationSourceIcon from '../integrations/IntegrationSourceIcon.jsx';
import { Link, Image, Divider } from '@heroui/react';
import JiraTaskDetails from './jira/JiraTaskDetails.jsx';
import GithubTaskDetails from './github/GithubTaskDetails.jsx';
import TrelloTaskDetails from './trello/TrelloTaskDetails.jsx';
import ClickupTaskDetails from './clickup/ClickupTaskDetails.jsx';

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
        case 'trello':
            return (
                <div className="flex gap-1 items-center">
                    <Link
                        className="font-medium text-blue-700 text-sm"
                        isExternal
                        showAnchorIcon
                        href={external_data?.shortUrl}
                    >
                        See in Trello
                    </Link>
                </div>
            );
        case 'clickup':
            return (
                <div className="flex gap-1 items-center">
                    <Link
                        className="font-medium text-blue-700 text-sm"
                        isExternal
                        showAnchorIcon
                        href={external_data?.url}
                    >
                        See in ClickUp
                    </Link>
                </div>
            );
    }
};

export const TaskIntegrationDetails = ({ source, external_data }) => {
    switch (source) {
        case 'github':
            return <GithubTaskDetails external_data={external_data} />;

        case 'jira':
            return <JiraTaskDetails external_data={external_data} />;

        case 'trello':
            return <TrelloTaskDetails external_data={external_data} />;

        case 'clickup':
            return <ClickupTaskDetails external_data={external_data} />;
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
            <TaskIntegrationDetails source={source} external_data={external_data} />
        </div>
    );
};

export default TaskIntegrationPanel;
