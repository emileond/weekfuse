import { useState, useEffect, useMemo, memo } from 'react';
import { Chip, Spinner } from '@heroui/react';
import {
    RiListCheck3,
    RiFlag2Line,
    RiHashtag,
    RiArrowUpDoubleLine,
    RiArrowDownWideLine,
    RiEqualLine,
    RiAlarmWarningLine,
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
    },
};

// Memoized icons for better performance
const PROJECT_ICON = <RiListCheck3 fontSize=".95rem" />;
const MILESTONE_ICON = <RiFlag2Line fontSize=".9rem" />;
const TAG_ICON = <RiHashtag fontSize=".9rem" />;
const WARNING_ICON = <RiAlarmWarningLine fontSize=".9rem" />;

// Memoized EntityChip component for better performance
const EntityChip = memo(({ type, entityId, size = 'sm', variant = 'light', className = '' }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const [entityData, setEntityData] = useState(null);
    const [entitiesData, setEntitiesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check if we're dealing with multiple entities (for tags)
    const isMultiple = useMemo(() => type === 'tag' && Array.isArray(entityId), [type, entityId]);

    // Only fetch data for the specific entity type we need
    const { data: projects, isLoading: isProjectsLoading } = useProjects(
        type === 'project' ? currentWorkspace : null,
    );

    const { data: milestones, isLoading: isMilestonesLoading } = useMilestones(
        type === 'milestone' ? currentWorkspace : null,
    );

    const { data: tags, isLoading: isTagsLoading } = useTags(
        type === 'tag' ? currentWorkspace : null,
    );

    // Memoize the entity data processing to prevent unnecessary calculations
    useEffect(() => {
        if (type === 'priority') {
            // Handle priority type immediately without waiting for API data
            const priorityValue = parseInt(entityId, 10);
            const priorityInfo = PRIORITY_MAPPING[priorityValue] || {
                label: 'Unknown',
                icon: WARNING_ICON,
                color: 'text-default-600',
            };

            setEntityData({
                name: priorityInfo.label,
                priority: priorityValue,
                color: priorityInfo.color,
            });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // Process data based on entity type
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
        }
    }, [
        type,
        entityId,
        isMultiple,
        // Only include the data sources that are relevant to the current entity type
        ...(type === 'project' ? [projects, isProjectsLoading] : []),
        ...(type === 'milestone' ? [milestones, isMilestonesLoading] : []),
        ...(type === 'tag' ? [tags, isTagsLoading] : []),
    ]);

    // Memoize the icon to prevent unnecessary re-renders
    const icon = useMemo(() => {
        switch (type) {
            case 'project':
                return PROJECT_ICON;
            case 'milestone':
                return MILESTONE_ICON;
            case 'tag':
                return TAG_ICON;
            case 'priority':
                if (entityData && entityData.priority !== undefined) {
                    const priorityInfo = PRIORITY_MAPPING[entityData.priority];
                    return priorityInfo ? priorityInfo.icon : WARNING_ICON;
                }
                return WARNING_ICON;
            default:
                return null;
        }
    }, [type, entityData?.priority]);

    // Loading state
    if (isLoading) {
        return <Spinner size="sm" color="default" />;
    }

    // Multiple entities (tags)
    if (isMultiple) {
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
                        startContent={icon}
                        className={`text-default-600 ${className}`}
                    >
                        {entity.name}
                    </Chip>
                ))}
            </div>
        );
    }

    // Single entity
    if (!entityData) {
        return null;
    }

    return (
        <Chip size={size} variant={variant} startContent={icon}>
            {entityData.name}
        </Chip>
    );
});

export default EntityChip;
