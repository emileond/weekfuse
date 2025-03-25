import { Button } from '@heroui/react';
import { useState } from 'react';
import { useDarkMode } from '../../hooks/theme/useDarkMode';
import { RiSunLine, RiMoonClearLine } from 'react-icons/ri';

export default function ThemeSwitcher() {
    const ICON_SIZE = 18;
    const [darkMode, setDarkMode] = useDarkMode();
    const [icon, setIcon] = useState(
        darkMode ? <RiSunLine fontSize={ICON_SIZE} /> : <RiMoonClearLine fontSize={ICON_SIZE} />,
    );

    const handleClick = () => {
        setDarkMode(!darkMode);
        setIcon(
            darkMode ? (
                <RiSunLine fontSize={ICON_SIZE} />
            ) : (
                <RiMoonClearLine fontSize={ICON_SIZE} />
            ),
        );
    };

    return (
        <Button isIconOnly variant="light" onPress={handleClick}>
            {icon}
        </Button>
    );
}
