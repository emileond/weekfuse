import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button, Tooltip } from '@heroui/react';
import { RiCupFill, RiFocusFill, RiTimerLine } from 'react-icons/ri';
import { PomodoroTimer } from './PomodoroTimer';

export function PomodoroWidget() {
    const [isOpen, setIsOpen] = useState(false);

    const originalTitleRef = useRef(document.title);
    const workerRef = useRef(null);

    // Settings state (remains in component for the settings UI)
    const [settings, setSettings] = useState({
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        autoStartBreaks: true,
        autoStartPomodoros: true,
        longBreakInterval: 4,
    });

    // Stats tracking - this will now be updated by the worker
    const [stats, setStats] = useState({
        completedPomodoros: 0,
        completedBreaks: 0,
        totalFocusTime: 0,
    });

    // Timer state - this is a REFLECTION of the worker's state
    const [mode, setMode] = useState('focus');
    const [time, setTime] = useState(settings.focusDuration * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [cycle, setCycle] = useState(1);

    // Ref for the audio element
    const audioRef = useRef(null);

    // Initialize Audio and Web Worker
    useEffect(() => {
        // Initialize Audio
        audioRef.current = new Audio('/sounds/alarm.mp3');
        audioRef.current.preload = 'auto';

        // Initialize Web Worker
        const worker = new Worker('/pomodoro.worker.js');
        workerRef.current = worker;

        // Send initial settings to the worker
        worker.postMessage({ type: 'updateSettings', payload: settings });

        // Listen for messages from the worker
        worker.onmessage = (e) => {
            const { type, payload } = e.data;

            switch (type) {
                case 'tick':
                    setTime(payload.time);
                    break;
                case 'statusChange':
                    setIsRunning(payload.isRunning);
                    break;
                case 'stateChange':
                    // Update the entire UI state from the worker's source of truth
                    setTime(payload.time);
                    setMode(payload.mode);
                    setIsRunning(payload.isRunning);
                    setCycle(payload.cycle);
                    setStats({
                        completedPomodoros: payload.completedPomodoros,
                        completedBreaks: payload.completedBreaks,
                        totalFocusTime: payload.totalFocusTime,
                    });
                    break;
                case 'complete':
                    // Play sound on the main thread
                    playSound();
                    // Optionally open the popover when a session completes
                    setIsOpen(true);
                    break;
            }
        };

        // Cleanup: terminate worker when component unmounts
        return () => {
            worker.terminate();
        };
    }, []); // Empty array ensures this runs only once on mount

    // Function to play sound (must be on main thread)
    const playSound = useCallback(() => {
        audioRef.current?.play().catch(console.warn);
    }, []);

    // Timer control functions now just send messages to the worker
    const toggleTimer = useCallback(() => {
        const command = isRunning ? 'pause' : 'start';
        workerRef.current?.postMessage({ type: command });
    }, [isRunning]);

    const resetTimer = useCallback(() => {
        workerRef.current?.postMessage({ type: 'reset' });
    }, []);

    const skipTimer = useCallback(() => {
        workerRef.current?.postMessage({ type: 'skip' });
    }, []);

    // Update settings and inform the worker
    const updateSettings = useCallback(
        (newSettings) => {
            const fullSettings = { ...settings, ...newSettings };
            setSettings(fullSettings);
            // Reset the time display immediately for better UX
            if (!isRunning) {
                setTime(fullSettings.focusDuration * 60);
            }
            workerRef.current?.postMessage({ type: 'updateSettings', payload: fullSettings });
        },
        [settings, isRunning],
    );

    // Calculate total duration for progress bar
    const getTotalDuration = useCallback(() => {
        switch (mode) {
            case 'focus':
                return settings.focusDuration * 60;
            case 'shortBreak':
                return settings.shortBreakDuration * 60;
            case 'longBreak':
                return settings.longBreakDuration * 60;
            default:
                return settings.focusDuration * 60;
        }
    }, [settings, mode]);

    const progress = useMemo(() => {
        const total = getTotalDuration();
        return total > 0 ? ((total - time) / total) * 100 : 0;
    }, [time, getTotalDuration]);

    const formatTimeShort = (timeInSeconds) => `${Math.floor(timeInSeconds / 60)}m`;

    // Props for the child component remain largely the same
    const pomodoroState = useMemo(() => {
        const totalDuration = getTotalDuration();
        const isPristine = !isRunning && time === totalDuration;
        const isPaused = !isRunning && !isPristine;

        return {
            time,
            isRunning,
            isPaused,
            isBreak: mode.includes('Break'),
            isLongBreak: mode === 'longBreak',
            progress,
            cycle,
            settings,
            stats,
            toggleTimer,
            resetTimer,
            skipTimer,
            updateSettings,
        };
    }, [
        time,
        isRunning,
        mode,
        progress,
        cycle,
        settings,
        stats,
        toggleTimer,
        resetTimer,
        skipTimer,
        updateSettings,
        getTotalDuration,
    ]);

    // Add this entire useEffect block inside your PomodoroWidget component.

    // Effect to manage the browser tab title
    useEffect(() => {
        // Restore the original title on cleanup (when the component unmounts)
        const cleanup = () => {
            document.title = originalTitleRef.current;
        };

        // Handler for when the tab's visibility changes
        const handleVisibilityChange = () => {
            // If the user returns to the tab, restore the original title.
            if (!document.hidden) {
                document.title = originalTitleRef.current;
            }
        };

        if (isRunning) {
            // If the timer is running, listen for visibility changes.
            document.addEventListener('visibilitychange', handleVisibilityChange);

            // If the tab is already hidden, update the title immediately.
            if (document.hidden) {
                const minutes = String(Math.floor(time / 60)).padStart(2, '0');
                const seconds = String(time % 60).padStart(2, '0');
                const modeText = mode.includes('Break') ? 'Break' : 'Focus';
                document.title = `${minutes}:${seconds} - ${modeText}`;
            }
        } else {
            // If the timer is not running, ensure the title is the original one.
            document.title = originalTitleRef.current;
        }

        // Cleanup function for the effect
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cleanup();
        };
    }, [time, isRunning, mode]); // Rerun this effect whenever these states change

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom">
            <Tooltip content="Pomodoro timer">
                <div>
                    <PopoverTrigger asChild>
                        <Button
                            variant="flat"
                            isIconOnly={!isRunning}
                            startContent={<RiTimerLine className="text-xl" />}
                        >
                            {isRunning && formatTimeShort(time)}{' '}
                            {isRunning && (
                                <>
                                    {mode === 'focus' && (
                                        <RiFocusFill className="text-md text-success animate-pulse" />
                                    )}
                                    {mode.includes('Break') && (
                                        <RiCupFill className="text-lg text-primary-400" />
                                    )}
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                </div>
            </Tooltip>
            <PopoverContent className="w-80 p-3">
                <PomodoroTimer onClose={() => setIsOpen(false)} {...pomodoroState} />
            </PopoverContent>
        </Popover>
    );
}
