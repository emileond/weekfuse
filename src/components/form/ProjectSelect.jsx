// project select component:
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

    // ✅ NO MORE INTERNAL STATE OR USEEFFECT FOR SELECTION

    const projectOptions = projects
        ? projects.map((project) => ({
              label: project.name,
              value: project.id,
          }))
        : [];

    const handleCreateProject = async (projectName) => {
        const newProject = await createProject({
            project: {
                name: projectName,
                workspace_id: currentWorkspace?.workspace_id,
            },
        });
        const mappedNew = { label: projectName, value: newProject.id };
        // This was already correct, it calls the parent onChange
        onChange(mappedNew);
        return mappedNew;
    };

    return isLoading ? (
        <Spinner color="default" variant="wave" size="sm" />
    ) : (
        <CreatableSelect
            label={label}
            placeholder={placeholder}
            options={projectOptions}
            defaultValue={projectOptions?.find((opt) => opt.value === defaultValue)}
            onChange={(value) => {
                if (multiSelect) {
                    // This logic remains for multi-select
                    const selectedOptions = Array.isArray(value)
                        ? value
                              .map((id) => projectOptions.find((opt) => opt.value === id))
                              .filter(Boolean)
                        : [];
                    onChange(selectedOptions.map((opt) => opt.value));
                } else {
                    const option = projectOptions.find((opt) => opt.value === value);
                    onChange(option || null);
                }
            }}
            onCreate={!multiSelect ? handleCreateProject : undefined}
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
