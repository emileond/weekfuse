import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    Input,
    Listbox,
    ListboxItem,
    Divider,
} from '@heroui/react';
import { useState, useRef } from 'react';
import { RiSearchLine, RiAddLine, RiCheckLine, RiCheckboxBlankCircleLine } from 'react-icons/ri';

const CreatableSelect = ({
    label,
    placeholder = 'Search...',
    options = [],
    defaultValue = null,
    onChange,
    onCreate,
    placement = 'bottom',
    className = '',
    disabled = false,
    icon,
    multiple = false,
    allSelectedLabel = null,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedOption, setSelectedOption] = useState(defaultValue);
    const [selectedOptions, setSelectedOptions] = useState(
        Array.isArray(defaultValue) ? defaultValue : [],
    );
    const inputRef = useRef(null);

    // Filter options based on search text
    const filteredOptions = options.filter((option) => {
        if (searchText?.length) {
            return option.label.toLowerCase().includes(searchText.toLowerCase());
        } else {
            return options;
        }
    });

    // Ensure all options are valid before rendering
    const validOptions = filteredOptions.filter((option) => option && option.value !== undefined && option.value !== null && option.label);

    const handleSelect = (option) => {
        if (multiple) {
            // Check if option is already selected
            const isSelected = selectedOptions.some((item) => item.value === option.value);

            if (isSelected) {
                // Remove option if already selected
                setSelectedOptions(selectedOptions.filter((item) => item.value !== option.value));
            } else {
                // Add option if not already selected
                setSelectedOptions([...selectedOptions, option]);
            }
            // Keep popover open for multiple selection
            setSearchText('');
        } else {
            // Single selection behavior
            // Check if the option is already selected
            const isAlreadySelected = selectedOption && selectedOption.value === option.value;

            if (isAlreadySelected) {
                // Deselect if already selected
                setSelectedOption(null);
            } else {
                // Select if not already selected
                setSelectedOption(option);
            }
            setIsOpen(false);
            setSearchText('');
        }
    };

    const handleCreate = async () => {
        if (typeof onCreate === 'function') {
            try {
                const newOption = await onCreate(searchText);
                if (newOption) {
                    if (multiple) {
                        const newSelectedOptions = [...selectedOptions, newOption];
                        setSelectedOptions(newSelectedOptions);
                        setSearchText('');
                        if (onChange) {
                            onChange(newSelectedOptions.map((opt) => opt.value));
                        }
                    } else {
                        setSelectedOption(newOption);
                        setIsOpen(false);
                        setSearchText('');
                        if (onChange) {
                            onChange(newOption.value);
                        }
                    }
                }
            } catch (error) {
                console.error('Error creating option:', error);
            }
        } else {
            console.error('onCreate is not a function');
        }
    };

    const getDisplayText = () => {
        if (multiple) {
            if (selectedOptions.length === 0) {
                return label;
            } else if (selectedOptions.length === 1) {
                return selectedOptions[0].label;
            } else if (allSelectedLabel && options.length > 0 && selectedOptions.length === options.length) {
                return allSelectedLabel;
            } else {
                return `${selectedOptions.length} ${label}s`;
            }
        } else if (selectedOption) {
            return selectedOption.label;
        }

        return label;
    };

    return (
        <Popover
            placement={placement}
            isOpen={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    setSearchText('');
                }
            }}
            className={className}
        >
            <PopoverTrigger>
                <div>
                    <Button
                        size="sm"
                        variant="light"
                        className="text-default-600"
                        startContent={icon}
                        disabled={disabled}
                        onPress={() => setIsOpen(true)}
                    >
                        {getDisplayText()}
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px]">
                <div className="w-full p-2">
                    <Input
                        variant="underlined"
                        ref={inputRef}
                        placeholder={placeholder}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        startContent={<RiSearchLine />}
                        className="mb-2"
                        autoFocus
                    />
                    <Divider className="my-2" />
                    <Listbox
                        aria-label="Select an option"
                        className="max-h-[200px] overflow-auto"
                        emptyContent={
                            <div className="p-2 text-center text-default-400">No options found</div>
                        }
                    >
                        {validOptions?.map((option, index) => {
                            const isSelected = multiple
                                ? selectedOptions.some((item) => item.value === option.value)
                                : selectedOption && selectedOption.value === option.value;

                            return (
                                <ListboxItem
                                    key={option.value}
                                    onPress={() => {
                                        handleSelect(option);
                                        if (onChange) {
                                            if (multiple) {
                                                // For multiple selection, check if option is already selected
                                                const isSelected = selectedOptions.some(
                                                    (item) => item.value === option.value,
                                                );
                                                const newSelectedOptions = isSelected
                                                    ? selectedOptions.filter(
                                                          (item) => item.value !== option.value,
                                                      )
                                                    : [...selectedOptions, option];
                                                onChange(
                                                    newSelectedOptions.map((opt) => opt.value),
                                                );
                                            } else {
                                                // For single selection, check if option is already selected
                                                const isAlreadySelected = selectedOption && selectedOption.value === option.value;
                                                // Pass null if deselecting, otherwise pass the option value
                                                onChange(isAlreadySelected ? null : option.value);
                                            }
                                        }
                                    }}
                                    className={isSelected ? 'text-primary' : ''}
                                    startContent={
                                        isSelected ? (
                                            <RiCheckLine fontSize="1rem" />
                                        ) : (
                                            <span className="h-4 w-4" />
                                        )
                                    }
                                >
                                    {option.label}
                                </ListboxItem>
                            );
                        })}
                        {searchText?.trim() && onCreate && (
                            <ListboxItem
                                key="create-option"
                                onPress={() => handleCreate()}
                                startContent={<RiAddLine />}
                                className="text-primary"
                            >
                                {`Create "${searchText?.trim()}"`}
                            </ListboxItem>
                        )}
                    </Listbox>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default CreatableSelect;
