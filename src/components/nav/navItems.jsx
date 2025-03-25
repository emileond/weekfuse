import {
  RiRefreshLine,
  RiMailCheckLine,
  RiTerminalBoxLine,
  RiGroupLine,
  RiSettingsLine,
} from 'react-icons/ri'

const ICON_SIZE = '1.2rem'

export const navItems = [
  {
    name: 'Verify',
    path: '/dashboard',
    startContent: <RiMailCheckLine fontSize={ICON_SIZE} />,
    endContent: null,
  },
  {
    name: 'API keys',
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
]
