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
import { RiSearchLine, RiAddLine } from 'react-icons/ri';

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
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedOption, setSelectedOption] = useState(defaultValue);
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
    const validOptions = filteredOptions.filter((option) => option && option.value && option.label);

    const handleSelect = (option) => {
        setSelectedOption(option);
        setIsOpen(false);
        setSearchText('');
    };

    const handleCreate = async () => {
        if (typeof onCreate === 'function') {
            try {
                const newOption = await onCreate(searchText);
                if (newOption) {
                    setSelectedOption(newOption);
                    setIsOpen(false);
                    setSearchText('');
                }
            } catch (error) {
                console.error('Error creating option:', error);
            }
        } else {
            console.error('onCreate is not a function');
        }
    };

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
                        {validOptions?.map((option, index) => (
                            <ListboxItem
                                key={option.value}
                                onPress={() => {
                                    handleSelect(option);
                                    onChange && onChange(option.value);
                                }}
                            >
                                {option.label}
                            </ListboxItem>
                        ))}
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
