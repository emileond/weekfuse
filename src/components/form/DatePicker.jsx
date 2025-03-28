import { Popover, PopoverTrigger, PopoverContent, Button } from '@heroui/react';
import { Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { RiCalendarEventLine } from 'react-icons/ri';

const DatePicker = ({
    control,
    name,
    defaultValue = dayjs(),
    trigger,
    placement = 'bottom',
    onChange,
}) => {
    const [selectedDate, setSelectedDate] = useState(defaultValue);

    const triggerText = useMemo(() => {
        if (!selectedDate) return 'Select date';

        const today = dayjs();
        const tomorrow = today.add(1, 'day');

        if (dayjs(selectedDate).isSame(today, 'day')) {
            return 'Today';
        } else if (dayjs(selectedDate).isSame(tomorrow, 'day')) {
            return 'Tomorrow';
        } else {
            return new Intl.DateTimeFormat(navigator.language, {
                dateStyle: 'medium',
            }).format(new Date(selectedDate));
        }
    }, [selectedDate]);

    return (
        <Popover placement={placement}>
            <PopoverTrigger>
                {trigger || (
                    <Button
                        size="sm"
                        variant="light"
                        className="text-default-600"
                        startContent={<RiCalendarEventLine fontSize="1rem" />}
                    >
                        {triggerText}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="p-0">
                <Controller
                    control={control}
                    name={name}
                    defaultValue={defaultValue}
                    render={({ field }) => (
                        <DayPicker
                            mode="single"
                            selected={field.value}
                            onDayClick={(date) => {
                                setSelectedDate(date);
                                field.onChange(date);
                                if (onChange) onChange(date);
                            }}
                            className="p-3"
                            classNames={{
                                months: 'relative flex flex-wrap justify-center gap-8',
                                month_caption:
                                    'flex items-center font-medium text-lg h-9 px-2 text-default-800',
                                nav: 'absolute inset-x-0 flex justify-end items-center h-9 gap-2',
                                button_next:
                                    'relative inline-flex items-center justify-center size-9 hover:bg-default-100 rounded',
                                button_previous:
                                    'relative inline-flex items-center justify-center size-9 hover:bg-default-100 rounded',
                                calendar: 'relative text-sm',
                                chevron: 'inline-block size-7 fill-gray-400',
                                week: 'grid grid-cols-7',
                                weekdays: 'grid grid-cols-7',
                                weekday: 'size-9 flex items-center justify-center text-default-500',
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
                    )}
                />
            </PopoverContent>
        </Popover>
    );
};

export default DatePicker;
