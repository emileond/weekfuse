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
import { useState, useEffect, useRef } from 'react';
import { RiSearchLine, RiAddLine } from 'react-icons/ri';

const CreatableSelect = ({
    label = 'Select an option',
    placeholder = 'Search...',
    options = [],
    defaultValue = null,
    onChange,
    onCreateOption,
    placement = 'bottom',
    className = '',
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedOption, setSelectedOption] = useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
            }, 100);
        }
    }, [isOpen]);

    // Filter options based on search text
    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchText.toLowerCase()),
    );

    // Ensure all options are valid before rendering
    const validOptions = filteredOptions.filter((option) => option && option.value && option.label);

    // Check if the search text exactly matches any option and get the matching option
    const exactMatch = options.find(
        (option) => option.label.toLowerCase() === searchText.toLowerCase(),
    );

    const handleSelect = (option) => {
        setSelectedOption(option);
        setIsOpen(false);
        setSearchText('');
    };

    const handleCreate = () => {
        if (onCreateOption && searchText.trim()) {
            const newOption = onCreateOption(searchText.trim());
            handleSelect(newOption);
        }
    };

    useEffect(() => {
        if (defaultValue && !selectedOption) {
            const option = options.find((opt) => opt.value === defaultValue);
            if (option) {
                setSelectedOption(option);
            }
        }
    }, [defaultValue, options]);

    const getDisplayText = () => {
        if (selectedOption) {
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
                <Button
                    variant="bordered"
                    className="w-full justify-between"
                    disabled={disabled}
                    onPress={() => setIsOpen(true)}
                >
                    {getDisplayText()}
                </Button>
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
                        {validOptions?.map((option) => (
                            <ListboxItem
                                key={option.value} // Ensure key is a string/primitive value
                                onPress={() => {
                                    handleSelect(option);
                                    onChange && onChange(option.value);
                                }}
                            >
                                {option.label}
                            </ListboxItem>
                        ))}
                        {searchText?.trim() && exactMatch === undefined && (
                            <>
                                {validOptions.length > 0 && <Divider className="my-2" />}
                                <ListboxItem
                                    key="create-option"
                                    onPress={() => {
                                        handleCreate();
                                        onChange && onChange(searchText.trim());
                                    }}
                                    startContent={<RiAddLine />}
                                    className="text-primary"
                                >
                                    Create "{searchText.trim()}"
                                </ListboxItem>
                            </>
                        )}
                    </Listbox>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default CreatableSelect;
