import { useEffect, useState } from 'react';
import { useTheme } from '@heroui/use-theme';
import logo from '/logo.svg';
import icon from '/icon.svg';
import darkLogo from '/logo-dark.svg';

function Logo({ isIconOnly = false, size = '160px' }) {
    const { theme } = useTheme();
    // Initialize state with the light logo by default if not icon-only
    const [src, setSrc] = useState(isIconOnly ? icon : logo);

    useEffect(() => {
        // This logic is now mutually exclusive. It will either set the icon
        // OR it will set one of the theme-based logos.
        if (isIconOnly) {
            setSrc(icon);
        } else {
            // This block is only entered if we are displaying the full logo
            if (theme.includes('dark')) {
                setSrc(darkLogo);
            } else {
                // Default to the light logo for the 'light' theme or any other value
                setSrc(logo);
            }
        }
    }, [theme, isIconOnly]); // The effect correctly re-runs when theme or isIconOnly changes

    return <img src={src} alt="logo" width={size} />;
}

export default Logo;
