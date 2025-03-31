import { useState, useEffect } from 'react';
import CreatableSelect from './CreatableSelect';
import { useProjects, useCreateProject } from '../../hooks/react-query/projects/useProjects';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { RiFolder3Line } from 'react-icons/ri';
import { Spinner } from '@heroui/react';

const ProjectSelect = ({
    label = 'Project',
    placeholder = 'Search projects...',
    defaultValue = null,
    onChange,
    placement = 'bottom',
    className = '',
    disabled = false,
}) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: projects, isLoading } = useProjects(currentWorkspace);
    const { mutateAsync: createProject } = useCreateProject(currentWorkspace);
    const [selectedProject, setSelectedProject] = useState();

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

        onChange(newProject);

        return {
            label: projectName,
            value: newProject.id,
        };
    };

    // Update parent component when selected project changes
    useEffect(() => {
        if (selectedProject && onChange) {
            onChange(selectedProject);
        }
    }, [selectedProject, onChange]);

    // Set default value when projects are loaded
    useEffect(() => {
        if (defaultValue && projects?.length) {
            const project = projects.find((p) => p.id === defaultValue);
            if (project) {
                setSelectedProject({
                    label: project.name,
                    value: project.id,
                });
            }
        }
    }, [defaultValue, projects]);

    return isLoading ? (
        <Spinner color="default" variant="wave" size="sm" />
    ) : (
        <CreatableSelect
            label={label}
            placeholder={placeholder}
            options={projectOptions}
            defaultValue={projectOptions?.find((opt) => opt.value === defaultValue)}
            onChange={(value) => {
                const option = projectOptions.find((opt) => opt.value === value);
                setSelectedProject(option);
            }}
            onCreate={handleCreateProject}
            placement={placement}
            className={className}
            disabled={disabled}
            icon={<RiFolder3Line fontSize="1rem" />}
        />
    );
};

export default ProjectSelect;
