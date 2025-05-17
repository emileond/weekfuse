import { Popover, PopoverTrigger, PopoverContent, Button, Divider } from '@heroui/react';
import dayjs from 'dayjs';
import { useState, useMemo, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { RiCalendarEventLine } from 'react-icons/ri';

const RangeDatepicker = ({ defaultValue, trigger, placement = 'bottom', onChange }) => {
    // Set "Last 7 days" as default if no defaultValue is provided
    const getDefaultDateRange = () => {
        if (defaultValue) return defaultValue;

        const to = dayjs();
        const from = to.subtract(7, 'day');
        return {
            from: from.toDate(),
            to: to.toDate(),
        };
    };

    const [dateRange, setDateRange] = useState(getDefaultDateRange());
    const [isOpen, setIsOpen] = useState(false); // Track popover state
    const [selectedPreset, setSelectedPreset] = useState(defaultValue ? null : 'Last 7 days'); // Track selected preset

    const triggerText = useMemo(() => {
        // If a preset is selected, display the preset label
        if (selectedPreset) return selectedPreset;

        // Otherwise display the date range
        if (!dateRange.from || !dateRange.to) return 'Select date range';

        const fromDate = new Intl.DateTimeFormat(navigator.language, {
            dateStyle: 'medium',
        }).format(new Date(dateRange.from));

        const toDate = new Intl.DateTimeFormat(navigator.language, {
            dateStyle: 'medium',
        }).format(new Date(dateRange.to));

        return `${fromDate} - ${toDate}`;
    }, [dateRange, selectedPreset]);

    useEffect(() => {
        if (onChange) {
            onChange(dateRange);
        }
    }, [dateRange]);

    const handlePresetSelection = (days, presetLabel) => {
        const to = dayjs();
        const from = to.subtract(days, 'day');

        setDateRange({
            from: from.toDate(),
            to: to.toDate(),
        });
        setSelectedPreset(presetLabel);
        setIsOpen(false);
    };

    return (
        <Popover placement={placement} isOpen={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger>
                {trigger || (
                    <Button
                        size="sm"
                        variant="light"
                        className="text-default-600"
                        startContent={<RiCalendarEventLine fontSize="1rem" />}
                        onPress={() => setIsOpen(true)}
                    >
                        {triggerText}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="p-0">
                <div className="flex flex-col gap-1 p-2">
                    <Button
                        size="sm"
                        className="w-full text-default-600"
                        variant="light"
                        onPress={() => handlePresetSelection(7, 'Last 7 days')}
                    >
                        Last 7 days
                    </Button>
                    <Button
                        size="sm"
                        className="w-full text-default-600"
                        variant="light"
                        onPress={() => handlePresetSelection(14, 'Last 2 weeks')}
                    >
                        Last 2 weeks
                    </Button>
                    <Divider />
                    <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                            if (range?.from && range?.to) {
                                setDateRange(range);
                                // Clear the preset selection when a custom range is selected
                                setSelectedPreset(null);
                                // Don't close the calendar on selection to allow users to modify their selection
                            } else {
                                setDateRange(range || { from: undefined, to: undefined });
                                // Clear the preset selection when the range is cleared
                                if (!range) setSelectedPreset(null);
                            }
                        }}
                        classNames={{
                            months: 'relative flex flex-wrap justify-center gap-8',
                            month_caption:
                                'flex items-center font-medium text-md h-9 px-2 text-default-800',
                            nav: 'absolute inset-x-0 flex justify-end items-center h-9 gap-2',
                            button_next:
                                'relative inline-flex items-center justify-center size-8 hover:bg-default-100 rounded',
                            button_previous:
                                'relative inline-flex items-center justify-center size-8 hover:bg-default-100 rounded',
                            calendar: 'relative text-sm',
                            chevron: 'inline-block size-7 fill-gray-400',
                            week: 'grid grid-cols-7',
                            weekdays: 'grid grid-cols-7',
                            weekday:
                                'size-8 flex items-center justify-center text-default-500 font-normal',
                            day: '*:h-[36px] *:w-[36px] inline-flex items-center justify-center rounded text-gray-700 hover:bg-default-200 size-9 font-normal aria-selected:opacity-100 cursor-pointer',
                            today: 'bg-default-200 font-semibold',
                            selected:
                                'bg-primary text-white hover:bg-primary-500 hover:text-white focus:bg-primary-500 focus:text-white',
                            outside: 'text-gray-500 opacity-50 ',
                            disabled: 'text-gray-500 opacity-50 cursor-auto',
                            range_middle:
                                'aria-selected:bg-primary-50 aria-selected:text-gray-900 aria-selected:hover:bg-blue-200 rounded-none ',
                            hidden: 'invisible',
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default RangeDatepicker;
