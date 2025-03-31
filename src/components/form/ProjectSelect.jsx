import { useState, useEffect } from 'react';
import CreatableSelect from './CreatableSelect';
import { useProjects, useCreateProject } from '../../hooks/react-query/projects/useProjects';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { RiFolder3Line } from 'react-icons/ri';

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
    const [selectedProject, setSelectedProject] = useState(defaultValue);

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

        // Return a temporary option for immediate UI update
        // The actual project will be fetched when the query is invalidated
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

    return (
        <CreatableSelect
            label={label}
            placeholder={placeholder}
            options={projectOptions}
            defaultValue={selectedProject}
            onChange={(value) => {
                console.log(value);
                // Find the selected project option
                const option = projectOptions.find((opt) => opt.value === value);
                setSelectedProject(option);
            }}
            onCreate={handleCreateProject}
            placement={placement}
            className={className}
            disabled={disabled || isLoading}
            icon={<RiFolder3Line fontSize="1rem" />}
        />
    );
};

export default ProjectSelect;
