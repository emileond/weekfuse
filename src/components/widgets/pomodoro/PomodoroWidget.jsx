import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button, Tooltip } from '@heroui/react';
import { RiCupFill, RiFocusFill, RiTimerLine } from 'react-icons/ri';
import { PomodoroTimer } from './PomodoroTimer';

export function PomodoroWidget() {
    const [isOpen, setIsOpen] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        focusDuration: 25, // in minutes
        shortBreakDuration: 5, // in minutes
        longBreakDuration: 15, // in minutes
        autoStartBreaks: true,
        autoStartPomodoros: true,
        longBreakInterval: 4, // After how many focus sessions a long break occurs
    });

    // Stats tracking
    const [stats, setStats] = useState({
        completedPomodoros: 0,
        completedBreaks: 0,
        totalFocusTime: 0, // in seconds
        dailyStreak: 0,
        lastCompletedDate: null,
    });

    // Timer state
    const [mode, setMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
    const [time, setTime] = useState(settings.focusDuration * 60); // in seconds
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false); // Indicates if the timer is explicitly paused
    const [cycle, setCycle] = useState(1); // Current Pomodoro cycle (1-4, then resets)

    // Ref to hold the setInterval ID
    const timerIntervalRef = useRef(null);
    // Ref for the audio element
    const audioRef = useRef(null);

    // Initialize audio element once
    useEffect(() => {
        audioRef.current = new Audio('/sounds/alarm.mp3');
        audioRef.current.preload = 'auto';
    }, []);

    // Function to play the sound
    const playSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().catch((error) => {
                console.warn('Audio playback failed:', error);
            });
        }
    }, []);

    // Calculate total duration based on current mode
    const getTotalDuration = useCallback(() => {
        switch (mode) {
            case 'focus':
                return settings.focusDuration * 60;
            case 'shortBreak':
                return settings.shortBreakDuration * 60;
            case 'longBreak':
                return settings.longBreakDuration * 60;
            default:
                return settings.focusDuration * 60; // Should not happen
        }
    }, [settings.focusDuration, settings.shortBreakDuration, settings.longBreakDuration, mode]);

    // Calculate progress percentage
    const progress = useMemo(() => {
        const total = getTotalDuration();
        // Avoid division by zero if total is 0 (shouldn't happen with valid settings)
        if (total === 0) return 0;
        return ((total - time) / total) * 100;
    }, [time, getTotalDuration]);

    // Handle timer completion (focus session or break session ends)
    const handleTimerComplete = useCallback(() => {
        // Play sound when timer completes
        playSound();

        // Clear any active interval first
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        setIsRunning(false); // Stop the timer
        setIsPaused(false); // Not paused, just completed

        const today = new Date().toISOString().split('T')[0];
        let nextMode = mode; // Placeholder for the next mode

        if (mode === 'focus') {
            // Update stats for completed focus session
            setStats((prev) => {
                const newStats = {
                    ...prev,
                    completedPomodoros: prev.completedPomodoros + 1,
                    totalFocusTime: prev.totalFocusTime + settings.focusDuration * 60,
                };

                // Update daily streak
                if (prev.lastCompletedDate !== today) {
                    const lastDate = prev.lastCompletedDate
                        ? new Date(prev.lastCompletedDate)
                        : null;
                    const currentDate = new Date(today);
                    let diffDays = 0;
                    if (lastDate) {
                        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
                        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    if (lastDate && diffDays === 1) {
                        newStats.dailyStreak = prev.dailyStreak + 1; // Consecutive day
                    } else {
                        newStats.dailyStreak = 1; // Streak broken or first time
                    }
                    newStats.lastCompletedDate = today;
                } else {
                    // If already completed today, just update current day's stats
                    newStats.dailyStreak = prev.dailyStreak; // Maintain streak
                }
                return newStats;
            });

            // Determine next break type
            if (cycle % settings.longBreakInterval === 0) {
                nextMode = 'longBreak';
            } else {
                nextMode = 'shortBreak';
            }

            setMode(nextMode); // Set the new mode
            setIsRunning(settings.autoStartBreaks); // Auto-start break if enabled
        } else {
            // Break completed
            setStats((prev) => ({
                ...prev,
                completedBreaks: prev.completedBreaks + 1,
            }));

            // Move to next cycle after break
            if (mode === 'longBreak') {
                setCycle(1); // Reset cycle count after a long break
            } else {
                setCycle((prev) => prev + 1); // Increment for short break
            }

            nextMode = 'focus'; // Always return to focus mode after any break
            setMode(nextMode); // Set the new mode
            setIsRunning(settings.autoStartPomodoros); // Auto-start pomodoro if enabled
        }

        // Set time for the NEW mode after the transition
        setTime(() => {
            // Calculate duration for the 'nextMode' (which has just been set)
            switch (nextMode) {
                case 'focus':
                    return settings.focusDuration * 60;
                case 'shortBreak':
                    return settings.shortBreakDuration * 60;
                case 'longBreak':
                    return settings.longBreakDuration * 60;
                default:
                    return settings.focusDuration * 60;
            }
        });
    }, [
        mode,
        cycle,
        settings.focusDuration,
        settings.shortBreakDuration,
        settings.longBreakDuration,
        settings.longBreakInterval,
        settings.autoStartBreaks,
        settings.autoStartPomodoros,
        playSound, // Added playSound as a dependency
    ]);

    // Timer control functions
    const toggleTimer = useCallback(() => {
        setIsRunning((prevIsRunning) => {
            const newIsRunning = !prevIsRunning;
            setIsPaused(!newIsRunning); // If it's not running, it's paused. If it's running, it's not paused.
            return newIsRunning;
        });
    }, []);

    const resetTimer = useCallback(() => {
        // Clear any active interval first
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setIsRunning(false);
        setIsPaused(false);
        setMode('focus'); // Reset mode to focus
        setCycle(1); // Reset cycle to 1
        setTime(settings.focusDuration * 60); // Reset time to initial focus duration
    }, [settings.focusDuration]);

    const skipTimer = useCallback(() => {
        // Clear any active interval first
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setIsRunning(false); // Stop the current timer immediately
        setIsPaused(false); // No longer paused
        handleTimerComplete(); // This will transition to the next mode and set its correct duration
    }, [handleTimerComplete]);

    const updateSettings = useCallback((newSettings) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
        // When settings are updated, reset the timer to a default state (focus mode, not running)
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setIsRunning(false);
        setIsPaused(false);
        setMode('focus'); // Always reset to focus mode
        setTime(newSettings.focusDuration * 60); // Use the new focus duration
        setCycle(1); // Reset cycle count
    }, []);

    // Format time for display on the main widget button
    const formatTimeShort = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        return `${minutes}m`;
    };

    // Props to pass down to PomodoroTimer
    const pomodoroState = useMemo(
        () => ({
            time,
            isRunning,
            isPaused,
            isBreak: mode !== 'focus',
            isLongBreak: mode === 'longBreak',
            progress,
            cycle,
            settings,
            stats,
            toggleTimer,
            resetTimer,
            skipTimer,
            updateSettings,
        }),
        [
            time,
            isRunning,
            isPaused,
            mode,
            progress,
            cycle,
            settings,
            stats,
            toggleTimer,
            resetTimer,
            skipTimer,
            updateSettings,
        ],
    );

    // Effect to start/stop the countdown interval
    useEffect(() => {
        if (isRunning) {
            timerIntervalRef.current = window.setInterval(() => {
                setTime((prevTime) => {
                    if (prevTime <= 1) {
                        // Timer completed
                        clearInterval(timerIntervalRef.current);
                        timerIntervalRef.current = null; // Clear the ref
                        handleTimerComplete(); // Handles mode transition and setting new time
                        return 0; // Set time to 0 immediately
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else {
            // If isRunning is false, ensure no interval is active
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        // Cleanup interval on unmount or when isRunning changes
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [isRunning, handleTimerComplete]); // handleTimerComplete is a dependency as it's called inside

    // Effect to update time when mode changes if timer is not running/paused.
    // This is primarily for when settings are changed, or handleTimerComplete
    // finishes and sets a new mode but not necessarily auto-starts.
    useEffect(() => {
        // Only update time if the timer is not actively running or paused.
        // If it's running, the main useEffect (above) is handling time updates.
        // If it's paused, we want to maintain the paused time.
        if (!isRunning && !isPaused) {
            setTime(getTotalDuration());
        }
    }, [mode, settings, isRunning, isPaused, getTotalDuration]);

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom">
            <Tooltip content="Pomodoro timer">
                <div>
                    <PopoverTrigger>
                        <Button
                            variant="flat"
                            isIconOnly={!isRunning && !isPaused} // Show icon only if not running and not paused
                            startContent={<RiTimerLine className="text-xl" />}
                        >
                            {(isRunning || isPaused) && formatTimeShort(time)}{' '}
                            {/* Show time if running or paused */}
                            {isRunning && (
                                <>
                                    {mode === 'focus' && (
                                        <RiFocusFill className="text-md text-success animate-pulse" />
                                    )}
                                    {(mode === 'shortBreak' || mode === 'longBreak') && (
                                        <RiCupFill className="text-lg text-primary-400 " />
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
