import { useState } from 'react';
import { Button, Input, Switch } from '@heroui/react';
import { RiSaveLine, RiArrowLeftLine } from 'react-icons/ri';

export function SettingsView({ settings, updateSettings, onBack }) {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleChange = (key, value) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        updateSettings(localSettings);
        onBack();
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                <Input
                    type="number"
                    label="Focus Duration (minutes)"
                    value={localSettings.focusDuration.toString()}
                    onValueChange={(value) => handleChange('focusDuration', parseInt(value) || 25)}
                    min={1}
                    max={60}
                />
                <Input
                    type="number"
                    label="Short Break (minutes)"
                    value={localSettings.shortBreakDuration.toString()}
                    onValueChange={(value) =>
                        handleChange('shortBreakDuration', parseInt(value) || 5)
                    }
                    min={1}
                    max={30}
                />
                <Input
                    type="number"
                    label="Long Break (minutes)"
                    value={localSettings.longBreakDuration.toString()}
                    onValueChange={(value) =>
                        handleChange('longBreakDuration', parseInt(value) || 15)
                    }
                    min={1}
                    max={60}
                />
                <Switch
                    size="sm"
                    isSelected={localSettings.autoStartBreaks}
                    onValueChange={(value) => handleChange('autoStartBreaks', value)}
                >
                    Auto-start breaks
                </Switch>
                <Switch
                    size="sm"
                    isSelected={localSettings.autoStartPomodoros}
                    onValueChange={(value) => handleChange('autoStartPomodoros', value)}
                >
                    Auto-start pomodoros
                </Switch>
            </div>

            <div className="mt-2 flex gap-2">
                <Button
                    color="primary"
                    onPress={handleSave}
                    startContent={<RiSaveLine />}
                    className="flex-1"
                >
                    Save
                </Button>
                <Button
                    variant="flat"
                    color="default"
                    onPress={onBack}
                    startContent={<RiArrowLeftLine />}
                >
                    Back
                </Button>
            </div>
        </div>
    );
}
