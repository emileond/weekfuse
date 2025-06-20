import JiraIntegrationCard from '../integrations/jira/JiraIntegrationCard.jsx';
import GithubIntegrationCard from '../integrations/github/GithubIntegrationCard.jsx';
import ClickupIntegrationCard from '../integrations/clickup/ClickupIntegrationCard.jsx';
import TrelloIntegrationCard from '../integrations/trello/TrelloIntegrationCard.jsx';
import TodoistIntegrationCard from '../integrations/todoist/TodoistIntegrationCard.jsx';
import TickTickIntegrationCard from '../integrations/ticktick/TickTickIntegrationCard.jsx';

function IntegrationsStep() {
    return (
        <div className="flex flex-col gap-3">
            <JiraIntegrationCard isCompact />
            <GithubIntegrationCard isCompact />
            <ClickupIntegrationCard isCompact />
            <TrelloIntegrationCard isCompact />
            <TodoistIntegrationCard isCompact />
            <TickTickIntegrationCard isCompact />
        </div>
    );
}

export default IntegrationsStep;
