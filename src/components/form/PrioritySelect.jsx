import { useState, useMemo, useEffect } from 'react';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    Listbox,
    ListboxItem,
} from '@heroui/react';
import {
    RiFlag2Line,
    RiArrowUpDoubleLine,
    RiArrowDownWideLine,
    RiEqualLine,
    RiCheckLine,
} from 'react-icons/ri';

export default function PrioritySelect({
    label = 'Priority',
    defaultValue,
    onChange,
    triggerClassName = '',
    placement = 'bottom',
}) {
    const [isOpen, setIsOpen] = useState(false);
    // Store the selected option object itself for consistency
    const [selectedOption, setSelectedOption] = useState(null);

    const options = useMemo(
        () => [
            {
                label: 'High',
                key: '2',
                value: 2,
                icon: <RiArrowUpDoubleLine fontSize="1rem" className="text-danger" />,
            },
            {
                label: 'Medium',
                key: '1',
                value: 1,
                icon: <RiEqualLine fontSize="1rem" className="text-orange-500" />,
            },
            {
                label: 'Low',
                key: '0',
                value: 0,
                icon: <RiArrowDownWideLine fontSize="1rem" className="text-blue-500" />,
            },
        ],
        [],
    );

    // Effect to set the initial selected option based on defaultValue
    useEffect(() => {
        const defaultOption = options.find((opt) => opt.value === defaultValue) || null;
        setSelectedOption(defaultOption);
    }, [defaultValue, options]);

    const handleSelect = (option) => {
        const isAlreadySelected = selectedOption && selectedOption.key === option.key;

        if (isAlreadySelected) {
            setSelectedOption(null); // Deselect
            if (onChange) onChange(null);
        } else {
            setSelectedOption(option); // Select
            if (onChange) onChange(option);
        }
        setIsOpen(false); // Close popover after selection
    };

    const displayIcon = selectedOption?.icon || <RiFlag2Line fontSize="1rem" />;
    const displayLabel = selectedOption?.label || label;

    return (
        <Popover placement={placement} isOpen={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger>
                {/* We can keep the div wrapper as a good practice seen in CreatableSelect */}
                <div>
                    <Button
                        type="button"
                        size="sm"
                        variant="light"
                        className={`text-default-600 ${triggerClassName}`}
                        startContent={displayIcon}
                        onPress={() => setIsOpen(true)}
                    >
                        {displayLabel}
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="p-0">
                <Listbox
                    aria-label="Priority select"
                    onAction={(key) => {
                        const option = options.find((opt) => opt.key === key);
                        if (option) {
                            handleSelect(option);
                        }
                    }}
                >
                    {options.map((opt) => {
                        const isSelected = selectedOption && selectedOption.key === opt.key;
                        return (
                            <ListboxItem
                                key={opt.key}
                                startContent={opt.icon}
                                endContent={isSelected ? <RiCheckLine /> : null}
                                className={isSelected ? 'text-primary' : ''}
                            >
                                {opt.label}
                            </ListboxItem>
                        );
                    })}
                </Listbox>
            </PopoverContent>
        </Popover>
    );
}
