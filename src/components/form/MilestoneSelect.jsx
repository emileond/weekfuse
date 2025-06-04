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

        const newMapped = {
            label: newMilestone.name,
            value: newMilestone.id,
        };

        onChange(newMapped);

        return newMapped;
    };

    // Update parent component when selected milestone changes
    useEffect(() => {
        if (selectedMilestone && onChange) {
            onChange(selectedMilestone);
        }
    }, [selectedMilestone, onChange]);

    // Reset selected milestone when projectId changes
    useEffect(() => {
        setSelectedMilestone(null);
    }, [projectId]);

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
                setSelectedMilestone(option);
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
