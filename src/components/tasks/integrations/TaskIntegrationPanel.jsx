import IntegrationSourceIcon from '../integrations/IntegrationSourceIcon.jsx';
import { Link, Image, Divider } from '@heroui/react';
import JiraTaskDetails from './jira/JiraTaskDetails.jsx';
import GithubTaskDetails from './github/GithubTaskDetails.jsx';
import TrelloTaskDetails from './trello/TrelloTaskDetails.jsx';
import ClickupTaskDetails from './clickup/ClickupTaskDetails.jsx';

const TaskIntegrationLink = ({ source, external_data, host }) => {
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
        case 'jira': {
            const issueKey = external_data?.key;
            let webUrl = '#';

            if (issueKey && host) {
                const baseUrl = new URL(host);
                webUrl = `${baseUrl}/browse/${issueKey}`;
            }
            return (
                <div className="flex gap-1 items-center">
                    <Image src={external_data?.fields?.issuetype?.iconUrl} />
                    <Link
                        className="font-medium text-blue-700 text-sm"
                        isExternal
                        showAnchorIcon
                        href={webUrl}
                    >
                        {issueKey}
                    </Link>
                </div>
            );
        }
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

export const TaskIntegrationDetails = ({ task_id, source, external_data }) => {
    switch (source) {
        case 'github':
            return <GithubTaskDetails external_data={external_data} />;

        case 'jira':
            return <JiraTaskDetails task_id={task_id} external_data={external_data} />;

        case 'trello':
            return <TrelloTaskDetails external_data={external_data} />;

        case 'clickup':
            return <ClickupTaskDetails external_data={external_data} />;
    }
};

const TaskIntegrationPanel = ({ source, task_id, external_data, host }) => {
    return (
        <div className="flex flex-col gap-6 bg-content2 basis-1/3 p-6 border-l-1 border-default-200">
            <div className="flex gap-3 items-center">
                <h4 className="font-semibold flex gap-1">
                    <IntegrationSourceIcon type={source} /> {source}
                </h4>
                <TaskIntegrationLink source={source} external_data={external_data} host={host} />
            </div>
            <Divider />
            <TaskIntegrationDetails
                task_id={task_id}
                source={source}
                external_data={external_data}
            />
        </div>
    );
};

export default TaskIntegrationPanel;
