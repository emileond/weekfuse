import { useState, useEffect } from 'react';
import CreatableSelect from './CreatableSelect';
import { RiApps2Line } from 'react-icons/ri';
import IntegrationSourceIcon from '../tasks/integrations/IntegrationSourceIcon.jsx';

const IntegrationSourceSelect = ({
    label = 'Integration',
    placeholder = 'Filter by integration...',
    defaultValue = null,
    onChange,
    placement = 'bottom',
    className = '',
    disabled = false,
}) => {
    const [selectedSource, setSelectedSource] = useState(defaultValue);

    // Hardcoded options for integration sources
    const sourceOptions = [
        { label: 'GitHub', value: 'github' },
        { label: 'Jira', value: 'jira' },
        { label: 'Clickup', value: 'clickup' },
        { label: 'Trello', value: 'trello' },
    ];

    // Update parent component when selected source changes
    useEffect(() => {
        if (onChange) {
            onChange(selectedSource);
        }
    }, [selectedSource, onChange]);

    return (
        <CreatableSelect
            label={label}
            placeholder={placeholder}
            options={sourceOptions}
            defaultValue={sourceOptions.find((opt) => opt.value === defaultValue)}
            onChange={(value) => {
                const option = sourceOptions.find((opt) => opt.value === value);
                setSelectedSource(option?.value || null);
            }}
            placement={placement}
            className={className}
            disabled={disabled}
            icon={<RiApps2Line fontSize="1rem" />}
            onCreate={null} // No creation allowed for integration sources
        />
    );
};

export default IntegrationSourceSelect;