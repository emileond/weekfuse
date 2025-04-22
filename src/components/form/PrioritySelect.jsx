import { useState, useEffect, useMemo } from 'react';
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button
} from '@heroui/react';
import {
    RiAlarmWarningLine,
    RiArrowUpDoubleLine,
    RiArrowDownWideLine,
    RiEqualLine,
} from 'react-icons/ri';

export default function PrioritySelect({
                                           label = 'Priority',
                                           defaultValue,
                                           onChange,
                                       }) {
    // store the selected key (a string)…
    const [selectedKey, setSelectedKey] = useState(
        defaultValue != null ? defaultValue.toString() : null
    );

    // our menu options, with string keys
    const options = useMemo(() => [
        {
            label: 'High',
            key: '2',
            icon: <RiArrowUpDoubleLine fontSize="1rem" className="text-danger" />,
        },
        {
            label: 'Medium',
            key: '1',
            icon: <RiEqualLine fontSize="1rem" className="text-orange-500" />,
        },
        {
            label: 'Low',
            key: '0',
            icon: <RiArrowDownWideLine fontSize="1rem" className="text-blue-500" />,
        },
    ], []);

    // derive the selected option object for display & callback
    const selectedOption = options.find(o => o.key === selectedKey);

    // notify parent when selection changes
    useEffect(() => {
        if (onChange) {
            // Pass the selected option or null if nothing is selected
            onChange(selectedOption || null);
        }
    }, [selectedOption, onChange]);

    // handler for the DropdownMenu
    const handleSelectionChange = (newKeys) => {
        // newKeys is a Set<string>
        if (newKeys.size === 0) {
            // Handle deselection
            setSelectedKey(null);
        } else {
            const [first] = Array.from(newKeys);
            setSelectedKey(first);
        }
    };

    return (
        <Dropdown>
            <DropdownTrigger>
                <Button
                    size="sm"
                    variant="light"
                    className="text-default-600"
                    startContent={selectedOption?.icon || <RiAlarmWarningLine fontSize="1rem" />}
                >
                    {selectedOption?.label || label}
                </Button>
            </DropdownTrigger>
            <DropdownMenu
                aria-label="Priority select"
                selectionMode="single"
                selectedKeys={ selectedKey ? new Set([selectedKey]) : new Set() }
                onSelectionChange={ handleSelectionChange }
            >
                {options.map(opt => (
                    <DropdownItem
                        key={opt.key}
                        startContent={opt.icon}
                    >
                        {opt.label}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
}
