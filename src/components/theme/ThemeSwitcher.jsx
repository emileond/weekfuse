import { Card, CardBody, CardHeader } from '@heroui/react';
import { useTheme } from '@heroui/use-theme';
import { RiPaintBrushLine, RiCheckLine } from 'react-icons/ri';
import { useMemo } from 'react';

// A small, reusable component to display a preview of each theme
const ThemePreviewCard = ({ themeInfo, isSelected, onSelect }) => {
    // Defines the styles for the preview cards
    const previewStyles = {
        light: {
            bg: 'bg-[#fff]',
            primary: 'bg-[#735587]',
            secondary: 'bg-[#5bc0be]',
            default400: 'bg-[#b4afa8]',
            default300: 'bg-[#d7d3d0]',
            border: isSelected ? 'border-primary' : 'border-default-200',
        },
        latte: {
            bg: 'bg-white',
            primary: 'bg-[#31a2a9]',
            secondary: 'bg-[#ca6a9e]',
            default400: 'bg-[#ac9b8b]',
            default300: 'bg-[#c8beb2]',
            border: isSelected ? 'border-primary' : 'border-default-200',
        },
        forest: {
            bg: 'bg-[#f8fbf8]',
            primary: 'bg-[#4a6d6f]',
            secondary: 'bg-[#735587]',
            default400: 'bg-[#b6b0a7]',
            default300: 'bg-[#d4d0cb]',
            border: isSelected ? 'border-primary' : 'border-default-200',
        },
        dark: {
            bg: 'bg-[#141210]',
            primary: 'bg-[#735587]',
            secondary: 'bg-[#5bc0be]',
            default400: 'bg-[#d7d3d0]', // 600 for dark themes
            default300: 'bg-[#b4afa8]', // 500 for dark themes
            border: isSelected ? 'border-primary' : 'border-default-700',
        },
        'slate-dark': {
            bg: 'bg-slate-500',
            primary: 'bg-[#3b82f6]',
            secondary: 'bg-[#06b6d4]',
            default400: 'bg-[#cbd5e1]',
            default300: 'bg-[#94a3b8]',
            border: isSelected ? 'border-rose-500' : 'border-slate-700',
        },
        'midnight-dark': {
            bg: 'bg-[#111119]',
            primary: 'bg-[#6366f1]',
            secondary: 'bg-[#0ea5e9]',
            default400: 'bg-[#c4b5fd]',
            default300: 'bg-[#ddd6fe]',
            border: isSelected ? 'border-rose-500' : 'border-slate-700',
        },
    };

    const styles = previewStyles[themeInfo.key];

    return (
        <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => onSelect(themeInfo.key)}
        >
            {/* The visual preview card */}
            <div
                className={`relative w-32 h-20 rounded-lg border-2 p-2 transition-all ${styles.border} ${styles.bg}`}
            >
                <div className="flex items-center gap-1">
                    <div className={`w-4 h-4 rounded-full ${styles.secondary}`}></div>
                    <div className={`w-full h-2 rounded-sm ${styles.primary}`}></div>
                </div>
                <div className={`w-10/12 h-2 mt-2 rounded-sm ${styles.default400}`}></div>
                <div className={`w-8/12 h-2 mt-1 rounded-sm ${styles.default300}`}></div>

                {/* Checkmark for the selected theme */}
                {isSelected && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <RiCheckLine size={14} />
                    </div>
                )}
            </div>
            <p className="text-center text-sm mt-2">{themeInfo.label}</p>
        </div>
    );
};

// The main ThemeSwitcher component
export default function ThemeSwitcher({ isOnboarding }) {
    const { theme, setTheme } = useTheme();

    const themeOptions = useMemo(
        () => [
            { key: 'light', label: 'Classic Light' },
            { key: 'latte', label: 'Latte' },
            { key: 'forest', label: 'Forest' },
            { key: 'dark', label: 'Classic Dark' },
            { key: 'slate-dark', label: 'Slate' },
            { key: 'midnight-dark', label: 'Midnight' },
        ],
        [],
    );

    return (
        <Card shadow="none">
            <CardHeader>
                {!isOnboarding && (
                    <div>
                        <div className="flex items-center gap-1 mb-2">
                            <RiPaintBrushLine fontSize="1.2rem" />
                            <p className="text-lg font-medium">Theme</p>
                        </div>
                        <p className="text-sm text-default-500">
                            Customize the look and feel of the app
                        </p>
                    </div>
                )}
            </CardHeader>
            <CardBody className="p-4 max-w-lg">
                {/* The gallery of theme previews */}
                <div className="flex justify-center gap-4 flex-wrap">
                    {themeOptions.map((opt) => (
                        <ThemePreviewCard
                            key={opt.key}
                            themeInfo={opt}
                            isSelected={theme === opt.key}
                            onSelect={setTheme}
                        />
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}
