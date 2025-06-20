import ThemeSwitcher from '../theme/ThemeSwitcher.jsx';
import { Button } from '@heroui/react';

function ThemeStep({ goToNextStep }) {
    return (
        <div className="flex flex-col gap-6">
            <ThemeSwitcher isOnboarding />
            <Button color="primary" onPress={goToNextStep}>
                Continue
            </Button>
        </div>
    );
}

export default ThemeStep;
