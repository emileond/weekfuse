import GithubTaskDetails from './github/GithubTaskDetails.jsx';
import TrelloTaskDescription from './trello/TrelloTaskDescription.jsx';

export const TaskIntegrationDescription = ({ source, external_data }) => {
    switch (source) {
        case 'trello':
            return <TrelloTaskDescription external_data={external_data} />;
        default:
            return <></>;
    }
};

export default TaskIntegrationDescription;
