import { useState, useEffect, useMemo } from 'react';
import { Chip, Spinner } from '@heroui/react';
import { 
    RiListCheck3, 
    RiFlag2Line, 
    RiPriceTag3Line, 
    RiHashtag,
    RiArrowUpDoubleLine,
    RiArrowDownWideLine,
    RiEqualLine,
    RiAlarmWarningLine
} from 'react-icons/ri';
import { useProjects } from '../../hooks/react-query/projects/useProjects';
import { useMilestones } from '../../hooks/react-query/milestones/useMilestones';
import { useTags } from '../../hooks/react-query/tags/useTags';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';

// Priority mapping to match PrioritySelect component - defined outside component to avoid recreation on each render
const PRIORITY_MAPPING = {
    0: { 
        label: 'Low', 
        icon: <RiArrowDownWideLine fontSize=".95rem" className="text-blue-500" />,
    },
    1: { 
        label: 'Medium', 
        icon: <RiEqualLine fontSize=".95rem" className="text-orange-500" />,
    },
    2: { 
        label: 'High', 
        icon: <RiArrowUpDoubleLine fontSize=".95rem" className="text-danger" />,
    }
};

const EntityChip = ({ type, entityId, size = 'sm', variant = 'light', className = '' }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const [entityData, setEntityData] = useState(null);
    const [entitiesData, setEntitiesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check if we're dealing with multiple entities (for tags)
    const isMultiple = type === 'tag' && Array.isArray(entityId);

    // Fetch projects data if type is 'project'
    const { data: projects, isLoading: isProjectsLoading } = useProjects(
        type === 'project' ? currentWorkspace : {},
    );

    // Fetch milestones data if type is 'milestone'
    const { data: milestones, isLoading: isMilestonesLoading } = useMilestones(
        type === 'milestone' ? currentWorkspace : {},
    );

    // Fetch tags data if type is 'tag'
    const { data: tags, isLoading: isTagsLoading } = useTags(
        type === 'tag' ? currentWorkspace : {},
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
        } else if (type === 'tag' && tags && !isTagsLoading) {
            if (isMultiple) {
                // Handle multiple tags
                const foundTags = entityId
                    .map((id) => tags.find((t) => t.id === id))
                    .filter(Boolean);
                setEntitiesData(foundTags);
                setIsLoading(false);
            } else {
                // Handle single tag
                const tag = tags.find((t) => t.id === entityId);
                setEntityData(tag);
                setIsLoading(false);
            }
        } else if (type === 'priority') {
            // Use our priority mapping to get the appropriate data
            const priorityValue = parseInt(entityId, 10);
            const priorityInfo = PRIORITY_MAPPING[priorityValue] || { 
                label: 'Unknown', 
                icon: <RiAlarmWarningLine fontSize=".9rem" />,
                color: 'text-default-600'
            };

            setEntityData({ 
                name: priorityInfo.label,
                priority: priorityValue,
                color: priorityInfo.color
            });
            setIsLoading(false);
        }
    }, [
        type,
        entityId,
        projects,
        milestones,
        tags,
        isProjectsLoading,
        isMilestonesLoading,
        isTagsLoading,
        isMultiple,
    ]);

    // Get the appropriate icon based on the entity type
    const getIcon = () => {
        switch (type) {
            case 'project':
                return <RiListCheck3 fontSize=".95rem" />;
            case 'milestone':
                return <RiFlag2Line fontSize=".9rem" />;
            case 'tag':
                return <RiHashtag fontSize=".9rem" />;
            case 'priority':
                if (entityData && entityData.priority !== undefined) {
                    const priorityInfo = PRIORITY_MAPPING[entityData.priority];
                    return priorityInfo ? priorityInfo.icon : <RiAlarmWarningLine fontSize=".9rem" />;
                }
                return <RiAlarmWarningLine fontSize=".9rem" />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return <Spinner size="sm" color="default" />;
    }

    if (isMultiple) {
        // Render multiple tags
        if (entitiesData.length === 0) {
            return null;
        }

        return (
            <div className="flex flex-wrap gap-1">
                {entitiesData.map((entity) => (
                    <Chip
                        key={entity.id}
                        size={size}
                        variant={type === 'tag' ? 'flat' : variant}
                        startContent={getIcon()}
                        className={`text-default-600 ${className}`}
                    >
                        {entity.name}
                    </Chip>
                ))}
            </div>
        );
    } else {
        // Render single entity
        if (!entityData) {
            return null;
        }

        return (
            <Chip
                size={size}
                variant={variant}
                startContent={getIcon()}
            >
                {entityData.name}
            </Chip>
        );
    }
};

export default EntityChip;
