import { Avatar } from '@heroui/react';

const IntegrationSourceIcon = ({ type }) => {
    return (
        <Avatar
            className="w-6 h-6 text-tiny opacity-90"
            src={`/integrations/${type}.png`}
            alt={`${type} icon`}
        />
    );
};

export default IntegrationSourceIcon;
