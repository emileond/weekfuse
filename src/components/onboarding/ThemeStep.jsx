import ThemeSwitcher from '../theme/ThemeSwitcher.jsx';

function ThemeStep() {
    return (
        <div className="mb-6 flex flex-col">
            <ThemeSwitcher isOnboarding />
        </div>
    );
}

export default ThemeStep;
