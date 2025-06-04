import { useState, useEffect } from 'react';
import CreatableSelect from './CreatableSelect';
import { useProjects, useCreateProject } from '../../hooks/react-query/projects/useProjects';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { RiListCheck3 } from 'react-icons/ri';
import { Spinner } from '@heroui/react';

const ProjectSelect = ({
    label = 'No project',
    placeholder = 'Search projects...',
    defaultValue = null,
    onChange,
    placement = 'bottom',
    className = '',
    triggerClassName = '',
    disabled = false,
    multiSelect = false,
}) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: projects, isLoading } = useProjects(currentWorkspace);
    const { mutateAsync: createProject } = useCreateProject(currentWorkspace);
    const [selectedProject, setSelectedProject] = useState();
    const [selectedProjects, setSelectedProjects] = useState([]);

    // Convert projects to options format for CreatableSelect
    const projectOptions = projects
        ? projects.map((project) => ({
              label: project.name,
              value: project.id,
          }))
        : [];

    // Handle project creation
    const handleCreateProject = async (projectName) => {
        // Create a new project in the database
        const newProject = await createProject({
            project: {
                name: projectName,
                workspace_id: currentWorkspace?.workspace_id,
            },
        });

        const mappedNew = {
            label: projectName,
            value: newProject.id,
        };

        onChange(mappedNew);

        return mappedNew;
    };

    // Update parent component when selected project(s) change
    useEffect(() => {
        if (onChange) {
            if (multiSelect) {
                if (selectedProjects.length > 0) {
                    onChange(selectedProjects.map((project) => project.value));
                }
            } else if (selectedProject) {
                onChange(selectedProject);
            }
        }
    }, [selectedProject, selectedProjects, onChange, multiSelect]);

    // Set default selection for multi-select mode
    useEffect(() => {
        if (multiSelect && projects && projects.length > 0 && selectedProjects.length === 0) {
            // Set all projects as default for multi-select mode
            setSelectedProjects(projectOptions);
        }
    }, [multiSelect, projects, projectOptions, selectedProjects.length]);

    return isLoading ? (
        <Spinner color="default" variant="wave" size="sm" />
    ) : (
        <CreatableSelect
            label={label}
            placeholder={placeholder}
            options={projectOptions}
            defaultValue={
                multiSelect
                    ? projectOptions // Default to all projects in multi-select mode
                    : projectOptions?.find((opt) => opt.value === defaultValue)
            }
            onChange={(value) => {
                if (multiSelect) {
                    // For multi-select, value is an array of project IDs
                    const selectedOptions = Array.isArray(value)
                        ? value
                              .map((id) => projectOptions.find((opt) => opt.value === id))
                              .filter(Boolean)
                        : [];
                    setSelectedProjects(selectedOptions);
                } else {
                    // For single select, value is a single project ID
                    const option = projectOptions.find((opt) => opt.value === value);
                    setSelectedProject(option);
                }
            }}
            onCreate={!multiSelect ? handleCreateProject : undefined} // Disable creation in multi-select mode
            placement={placement}
            className={className}
            triggerClassName={triggerClassName}
            disabled={disabled}
            icon={<RiListCheck3 fontSize="1rem" />}
            multiple={multiSelect}
            allSelectedLabel={multiSelect ? 'All projects' : null}
        />
    );
};

export default ProjectSelect;
