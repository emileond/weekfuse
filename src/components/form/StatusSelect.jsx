import { useState, useEffect, useMemo } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import { RiTimeLine, RiCheckLine, RiLoader4Line, RiFilterLine } from 'react-icons/ri';

export default function StatusSelect({
    label = 'Status',
    defaultValue = [],
    onChange,
    triggerClassName = '',
    multiple = true,
}) {
    // store the selected keys (array of strings)
    const [selectedKeys, setSelectedKeys] = useState(
        defaultValue && defaultValue.length > 0 ? new Set(defaultValue) : new Set(['any']),
    );

    // our menu options, with string keys
    const options = useMemo(
        () => [
            {
                label: 'Any',
                key: 'any',
                icon: <RiFilterLine fontSize="1rem" className="text-default-500" />,
            },
            {
                label: 'Pending',
                key: 'pending',
                icon: <RiTimeLine fontSize="1rem" className="text-warning" />,
            },
            {
                label: 'In Progress',
                key: 'in progress',
                icon: <RiLoader4Line fontSize="1rem" className="text-primary" />,
            },
            {
                label: 'Completed',
                key: 'completed',
                icon: <RiCheckLine fontSize="1rem" className="text-success" />,
            },
        ],
        [],
    );

    // derive the selected option objects for display & callback
    useMemo(() => {
        return Array.from(selectedKeys)
            .map((key) => options.find((o) => o.key === key))
            .filter(Boolean);
    }, [selectedKeys, options]);

    // notify parent when selection changes
    useEffect(() => {
        if (onChange) {
            // If "any" is selected or nothing is selected, return null
            if (selectedKeys.has('any') || selectedKeys.size === 0) {
                onChange(null);
            } else {
                // Otherwise return array of selected status keys
                onChange(Array.from(selectedKeys));
            }
        }
    }, [selectedKeys, onChange]);

    // handler for the DropdownMenu
    const handleSelectionChange = (newKeys) => {
        // If "any" is being selected, clear other selections
        if (newKeys.has('any') && !selectedKeys.has('any')) {
            setSelectedKeys(new Set(['any']));
        }
        // If another option is selected while "any" is selected, remove "any"
        else if (newKeys.size > 1 && newKeys.has('any')) {
            const updatedKeys = new Set(newKeys);
            updatedKeys.delete('any');
            setSelectedKeys(updatedKeys);
        }
        // Otherwise, update as normal
        else {
            setSelectedKeys(newKeys);
        }
    };

    // Determine the button label
    const buttonLabel = () => {
        if (selectedKeys.size === 0) {
            return label;
        } else if (selectedKeys.has('any')) {
            return 'Any Status';
        } else if (selectedKeys.size === 1) {
            const [key] = Array.from(selectedKeys);
            const option = options.find((o) => o.key === key);
            return option ? option.label : label;
        } else {
            return `${selectedKeys.size} Statuses`;
        }
    };

    // Determine the button icon
    const buttonIcon = () => {
        if (selectedKeys.size === 0) {
            return <RiFilterLine fontSize="1rem" />;
        } else if (selectedKeys.size === 1) {
            const [key] = Array.from(selectedKeys);
            const option = options.find((o) => o.key === key);
            return option?.icon || <RiFilterLine fontSize="1rem" />;
        } else {
            return <RiFilterLine fontSize="1rem" />;
        }
    };

    return (
        <Dropdown>
            <DropdownTrigger>
                <Button
                    size="sm"
                    variant="light"
                    className={`text-default-600 ${triggerClassName}`}
                    startContent={buttonIcon()}
                >
                    {buttonLabel()}
                </Button>
            </DropdownTrigger>
            <DropdownMenu
                aria-label="Status select"
                selectionMode={multiple ? 'multiple' : 'single'}
                selectedKeys={selectedKeys}
                onSelectionChange={handleSelectionChange}
            >
                {options.map((opt) => (
                    <DropdownItem key={opt.key} startContent={opt.icon}>
                        {opt.label}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
}
