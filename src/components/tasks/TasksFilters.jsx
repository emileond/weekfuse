import { useState, useEffect } from 'react';
import { Button, Divider } from '@heroui/react';
import ProjectSelect from '../form/ProjectSelect.jsx';
import MilestoneSelect from '../form/MilestoneSelect.jsx';
import TagSelect from '../form/TagSelect.jsx';
import IntegrationSourceSelect from '../form/IntegrationSourceSelect.jsx';
import PrioritySelect from '../form/PrioritySelect.jsx';

function TasksFilters({ onFiltersChange, onShowFiltersChange, initialFilters = {} }) {
    // Filter state variables
    const [selectedProject, setSelectedProject] = useState(initialFilters.project_id || null);
    const [selectedMilestone, setSelectedMilestone] = useState(initialFilters.milestone_id || null);
    const [selectedTags, setSelectedTags] = useState(initialFilters.tags || []);
    const [selectedIntegrationSource, setSelectedIntegrationSource] = useState(
        initialFilters.integration_source || null,
    );
    const [selectedPriority, setSelectedPriority] = useState(
        initialFilters.priority ? { key: initialFilters.priority.toString() } : null,
    );
    const [resetKey, setResetKey] = useState(0); // Add a key to force re-render of filter components

    // Set initial filters visibility (always visible now)
    useEffect(() => {
        if (onShowFiltersChange) {
            onShowFiltersChange(true);
        }
    }, [onShowFiltersChange]);

    // Update parent component when filters change
    useEffect(() => {
        if (onFiltersChange) {
            const filters = {
                project_id: selectedProject,
                milestone_id: selectedMilestone,
                tags: selectedTags.length > 0 ? selectedTags : null,
                integration_source: selectedIntegrationSource,
                priority: selectedPriority?.key ? parseInt(selectedPriority.key) : null,
            };
            onFiltersChange(filters);
        }
    }, [
        selectedProject,
        selectedMilestone,
        selectedTags,
        selectedIntegrationSource,
        selectedPriority,
        onFiltersChange,
    ]);

    // Clear all filters
    const clearFilters = () => {
        setSelectedProject(null);
        setSelectedMilestone(null);
        setSelectedTags([]);
        setSelectedIntegrationSource(null);
        setSelectedPriority(null);
        setResetKey((prevKey) => prevKey + 1); // Increment reset key to force re-render
    };

    // Check if any filter is active
    const hasActiveFilters =
        selectedProject ||
        selectedMilestone ||
        selectedTags.length > 0 ||
        selectedIntegrationSource ||
        selectedPriority;

    return (
        <div>
            <div className="flex flex-wrap gap-2 py-1">
                <ProjectSelect
                    key={`project-select-${resetKey}`}
                    onChange={(value) => setSelectedProject(value?.value || null)}
                    defaultValue={selectedProject ? { value: selectedProject } : null}
                />
                {selectedProject && (
                    <MilestoneSelect
                        key={`milestone-select-${selectedProject}-${resetKey}`}
                        projectId={selectedProject}
                        onChange={(value) => setSelectedMilestone(value?.value || null)}
                        defaultValue={selectedMilestone ? { value: selectedMilestone } : null}
                    />
                )}
                <TagSelect
                    key={`tag-select-${resetKey}`}
                    onChange={setSelectedTags}
                    multiple={true}
                    defaultValue={
                        selectedTags.length > 0 ? selectedTags.map((tag) => ({ value: tag })) : []
                    }
                />
                <IntegrationSourceSelect
                    key={`integration-source-select-${resetKey}`}
                    onChange={setSelectedIntegrationSource}
                    defaultValue={
                        selectedIntegrationSource ? { value: selectedIntegrationSource } : null
                    }
                />
                <PrioritySelect
                    key={`priority-select-${resetKey}`}
                    onChange={setSelectedPriority}
                    defaultValue={selectedPriority}
                />
            </div>
            {hasActiveFilters && (
                <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    className="mt-2"
                    onPress={clearFilters}
                >
                    Clear filters
                </Button>
            )}
        </div>
    );
}

export default TasksFilters;
