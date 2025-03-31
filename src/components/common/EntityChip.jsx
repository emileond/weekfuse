import { useState, useEffect } from 'react';
import { Chip, Spinner } from '@heroui/react';
import { RiListCheck3, RiFlag2Line, RiPriceTag3Line } from 'react-icons/ri';
import { useProjects } from '../../hooks/react-query/projects/useProjects';
import { useMilestones } from '../../hooks/react-query/milestones/useMilestones';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';

/**
 * A reusable component that displays an entity (project, milestone, priority) as a chip
 * Fetches the entity data using react-query hooks based on the provided type and ID
 */
const EntityChip = ({ type, entityId, size = 'sm', variant = 'light', className = '' }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const [entityData, setEntityData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch projects data if type is 'project'
    const { data: projects, isLoading: isProjectsLoading } = useProjects(
        type === 'project' ? currentWorkspace : {},
    );

    // Fetch milestones data if type is 'milestone'
    const { data: milestones, isLoading: isMilestonesLoading } = useMilestones(
        type === 'milestone' ? currentWorkspace : {},
    );

    useEffect(() => {
        setIsLoading(true);

        if (type === 'project' && projects && !isProjectsLoading) {
            const project = projects.find((p) => p.id === entityId);
            setEntityData(project);
            setIsLoading(false);
        } else if (type === 'milestone' && milestones && !isMilestonesLoading) {
            const milestone = milestones.find((m) => m.id === entityId);
            setEntityData(milestone);
            setIsLoading(false);
        } else if (type === 'priority') {
            // For priority, we could have a predefined mapping or fetch from an API
            // For now, just use the ID as the name
            setEntityData({ name: entityId });
            setIsLoading(false);
        }
    }, [type, entityId, projects, milestones, isProjectsLoading, isMilestonesLoading]);

    // Get the appropriate icon based on the entity type
    const getIcon = () => {
        switch (type) {
            case 'project':
                return <RiListCheck3 fontSize=".95rem" />;
            case 'milestone':
                return <RiFlag2Line fontSize=".9rem" />;
            case 'priority':
                return <RiPriceTag3Line fontSize=".9rem" />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return <Spinner size="sm" color="default" />;
    }

    if (!entityData) {
        return null;
    }

    return (
        <Chip
            size={size}
            variant={variant}
            startContent={getIcon()}
            className={`text-default-600 ${className}`}
        >
            {entityData.name}
        </Chip>
    );
};

export default EntityChip;
