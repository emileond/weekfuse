import {
    RiRefreshLine,
    RiCalendarEventLine,
    RiQuillPenAiLine,
    RiTerminalBoxLine,
    RiGroupLine,
    RiSettingsLine,
    RiCalendarScheduleLine,
    RiBriefcase2Line,
} from 'react-icons/ri';

const ICON_SIZE = '1.2rem';

export const navItems = [
    {
        name: 'Today',
        path: '/dashboard',
        startContent: <RiCalendarEventLine fontSize={ICON_SIZE} />,
        endContent: null,
    },
    {
        name: 'Upcoming',
        path: '/upcoming',
        startContent: <RiCalendarScheduleLine fontSize={ICON_SIZE} />,
        endContent: null,
    },
    {
        name: 'Reflect',
        path: '/reflect',
        startContent: <RiQuillPenAiLine fontSize={ICON_SIZE} />,
        endContent: null,
    },
    {
        name: 'Projects',
        path: '/projects',
        startContent: <RiBriefcase2Line fontSize={ICON_SIZE} />,
        endContent: null,
    },
    {
        name: 'Notes',
        path: '/keys',
        startContent: <RiTerminalBoxLine fontSize={ICON_SIZE} />,
        endContent: null,
    },
    {
        name: 'Team',
        path: '/team',
        startContent: <RiGroupLine fontSize={ICON_SIZE} />,
        endContent: null,
    },
    {
        name: 'Integrations',
        path: '/integrations',
        startContent: <RiRefreshLine fontSize={ICON_SIZE} />,
        endContent: null,
    },
    {
        name: 'Settings',
        path: '/settings',
        startContent: <RiSettingsLine fontSize={ICON_SIZE} />,
        endContent: null,
    },
];
