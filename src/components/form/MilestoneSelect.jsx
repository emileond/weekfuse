import { useState, useEffect, useCallback } from 'react';
import CreatableSelect from './CreatableSelect';
import {
    useMilestones,
    useCreateMilestone,
} from '../../hooks/react-query/milestones/useMilestones';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { RiFlagLine } from 'react-icons/ri';
import { Spinner } from '@heroui/react';

const MilestoneSelect = ({
    label = 'Milestone',
    placeholder = 'Search milestones...',
    defaultValue = null,
    onChange,
    placement = 'bottom',
    className = '',
    disabled = false,
    projectId = null,
}) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: milestones, isLoading } = useMilestones(currentWorkspace, projectId);
    const { mutateAsync: createMilestone } = useCreateMilestone(currentWorkspace, projectId);
    const [selectedMilestone, setSelectedMilestone] = useState();

    // Convert milestones to options format for CreatableSelect
    const milestoneOptions = milestones
        ? milestones.map((milestone) => ({
              label: milestone.name,
              value: milestone.id,
          }))
        : [];

    // Handle milestone creation
    const handleCreateMilestone = async (milestoneName) => {
        if (!projectId) {
            console.error('Cannot create milestone without a project');
            return null;
        }

        // Create a new milestone in the database
        const newMilestone = await createMilestone({
            milestone: {
                name: milestoneName,
                workspace_id: currentWorkspace?.workspace_id,
                project_id: projectId,
            },
        });

        onChange(newMilestone);

        // Return a temporary option for immediate UI update
        // The actual milestone will be fetched when the query is invalidated
        return newMilestone;
    };

    // Update parent component when selected milestone changes
    useEffect(() => {
        if (selectedMilestone && onChange) {
            onChange(selectedMilestone);
        }
    }, [selectedMilestone, onChange]);

    // Set default value when milestones are loaded
    useEffect(() => {
        if (defaultValue && milestones?.length) {
            const milestone = milestones.find((m) => m.id === defaultValue);
            if (milestone) {
                setSelectedMilestone({
                    label: milestone.name,
                    value: milestone.id,
                });
            }
        }
    }, [defaultValue, milestones]);

    return isLoading ? (
        <Spinner color="default" variant="wave" size="sm" />
    ) : (
        <CreatableSelect
            label={label}
            placeholder={placeholder}
            options={milestoneOptions}
            defaultValue={milestoneOptions?.find((opt) => opt.value === defaultValue)}
            onChange={(value) => {
                const option = milestoneOptions?.find((opt) => opt.value === value);
                setSelectedMilestone(option);
            }}
            onCreate={projectId ? handleCreateMilestone : null}
            placement={placement}
            className={className}
            disabled={disabled || !projectId}
            icon={<RiFlagLine fontSize="1rem" />}
        />
    );
};

export default MilestoneSelect;
