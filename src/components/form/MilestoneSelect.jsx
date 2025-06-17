// milestone select component:
import { useState, useEffect } from 'react';
import CreatableSelect from './CreatableSelect';
import {
    useMilestones,
    useCreateMilestone,
} from '../../hooks/react-query/milestones/useMilestones';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { RiFlag2Line } from 'react-icons/ri';
import { Spinner } from '@heroui/react';

const MilestoneSelect = ({
    label = 'Milestone',
    placeholder = 'Search milestones...',
    defaultValue = null,
    onChange,
    placement = 'bottom',
    className = '',
    triggerClassName = '',
    disabled = false,
    projectId = null,
}) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: milestones, isLoading } = useMilestones(currentWorkspace, projectId);
    const { mutateAsync: createMilestone } = useCreateMilestone(currentWorkspace, projectId);

    // ✅ NO MORE INTERNAL STATE OR USEEFFECT FOR SELECTION

    const milestoneOptions = milestones
        ? milestones.map((milestone) => ({
              label: milestone.name,
              value: milestone.id,
          }))
        : [];

    const handleCreateMilestone = async (milestoneName) => {
        if (!projectId) return null;

        const newMilestone = await createMilestone({
            milestone: {
                name: milestoneName,
                workspace_id: currentWorkspace?.workspace_id,
                project_id: projectId,
            },
        });
        const newMapped = { label: newMilestone.name, value: newMilestone.id };
        // This was also correct, call parent onChange
        onChange(newMapped);
        return newMapped;
    };

    // The key prop in the parent component already handles resetting this component when projectId changes.

    return isLoading ? (
        <Spinner color="default" variant="wave" size="sm" />
    ) : (
        <CreatableSelect
            key={`milestone-select-${projectId}`}
            label={label}
            placeholder={placeholder}
            options={milestoneOptions}
            defaultValue={milestoneOptions?.find((opt) => opt.value === defaultValue)}
            onChange={(value) => {
                const option = milestoneOptions?.find((opt) => opt.value === value);
                onChange(option || null);
            }}
            onCreate={projectId ? handleCreateMilestone : null}
            placement={placement}
            className={className}
            triggerClassName={triggerClassName}
            disabled={disabled || !projectId}
            icon={<RiFlag2Line fontSize="1rem" />}
        />
    );
};

export default MilestoneSelect;
