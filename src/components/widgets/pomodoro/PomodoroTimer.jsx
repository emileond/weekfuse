import { useState } from 'react';
import { Button } from '@heroui/react';
import { RiSettings4Line, RiBarChart2Line, RiCloseLine } from 'react-icons/ri';
import { TimerView } from './TimerView';
import { SettingsView } from './SettingsView';
import { StatsView } from './StatsView';

export function PomodoroTimer({
    onClose,
    time,
    isRunning,
    isPaused,
    isBreak,
    isLongBreak,
    progress,
    cycle,
    settings,
    stats,
    toggleTimer,
    resetTimer,
    skipTimer,
    updateSettings,
}) {
    const [activeView, setActiveView] = useState('timer');

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                    <Button
                        isIconOnly
                        size="sm"
                        variant={activeView === 'settings' ? 'solid' : 'light'}
                        onPress={() => setActiveView('settings')}
                    >
                        <RiSettings4Line className="text-lg" />
                    </Button>
                    <Button
                        isIconOnly
                        size="sm"
                        variant={activeView === 'stats' ? 'solid' : 'light'}
                        onPress={() => setActiveView('stats')}
                    >
                        <RiBarChart2Line className="text-lg" />
                    </Button>
                </div>

                <Button isIconOnly size="sm" variant="light" onPress={onClose}>
                    <RiCloseLine className="text-lg" />
                </Button>
            </div>
            <h4 className="text-center text-lg font-medium mb-6 text-default-500">
                {activeView === 'timer' &&
                    (isBreak ? (isLongBreak ? 'Long Break' : 'Short Break') : 'Focus')}
                {activeView === 'settings' && 'Settings'}
                {activeView === 'stats' && 'Statistics'}
            </h4>
            {activeView === 'timer' && (
                <TimerView
                    time={time}
                    isRunning={isRunning}
                    isPaused={isPaused}
                    isBreak={isBreak}
                    progress={progress}
                    cycle={cycle}
                    toggleTimer={toggleTimer}
                    resetTimer={resetTimer}
                    skipTimer={skipTimer}
                />
            )}

            {activeView === 'settings' && (
                <SettingsView
                    settings={settings}
                    updateSettings={updateSettings}
                    onBack={() => setActiveView('timer')}
                />
            )}

            {activeView === 'stats' && (
                <StatsView stats={stats} onBack={() => setActiveView('timer')} />
            )}
        </div>
    );
}
