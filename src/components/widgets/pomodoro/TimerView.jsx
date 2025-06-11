import { useState } from 'react';
import { Button, CircularProgress, Divider } from '@heroui/react';
import { RiPlayLine, RiPauseLine, RiStopLine, RiSkipForwardLine } from 'react-icons/ri';

export function TimerView({
    time,
    isRunning,
    isPaused,
    isBreak,
    progress,
    cycle,
    toggleTimer,
    resetTimer,
    skipTimer,
}) {
    // State to manage the visibility of the "How it Works" explanation
    const [showExplanation, setShowExplanation] = useState(false);

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative mb-6 flex items-center justify-center">
                <CircularProgress
                    aria-label="Timer progress"
                    classNames={{
                        svg: 'w-48 h-48',
                        track: 'stroke-default-200',
                        value: 'text-3xl font-semibold',
                    }}
                    value={progress}
                    strokeWidth={1}
                    showValueLabel={false}
                    // Color adjusted based on the initial version provided by the user
                    color={isBreak ? 'success' : 'primary'}
                />
                <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-semibold">{formatTime(time)}</span>
                    <span className="text-xs text-default-500">
                        {isBreak
                            ? cycle % 4 === 0 // Assuming long break is after 4 focus cycles
                                ? 'Long Break'
                                : 'Short Break'
                            : `Cycle ${cycle}`}
                    </span>
                </div>
            </div>

            <div className="flex w-full justify-center gap-2 mb-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-2 w-2 rounded-full ${
                            i <= ((cycle - 1) % 4) + 1 ? 'bg-primary' : 'bg-default-200'
                        }`}
                    />
                ))}
            </div>

            {!(isRunning || isPaused) ? (
                // Show "Start" button only when timer is completely stopped
                <Button
                    variant="shadow"
                    color="primary"
                    onPress={toggleTimer}
                    startContent={<RiPlayLine className="text-lg" />}
                    className="mb-6"
                >
                    Start
                </Button>
            ) : (
                // Show Pause/Resume, Reset (Stop), Skip buttons when timer is running or paused
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="light"
                        onPress={toggleTimer}
                        startContent={
                            isRunning ? (
                                <RiPauseLine className="text-lg" />
                            ) : (
                                <RiPlayLine className="text-lg" />
                            )
                        }
                    >
                        {isRunning ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                        size="sm"
                        variant="light"
                        color="default"
                        onPress={skipTimer}
                        startContent={<RiSkipForwardLine className="text-lg" />}
                    >
                        Skip
                    </Button>
                    <Button
                        size="sm"
                        variant="light"
                        color="default"
                        onPress={resetTimer}
                        startContent={<RiStopLine className="text-lg" />}
                    >
                        End
                    </Button>
                </div>
            )}

            <Divider className="my-3" />
            {/* "How does it work?" button and explanation */}
            <div className="w-full text-center">
                <Button
                    size="sm"
                    variant="light"
                    color="default"
                    onPress={() => setShowExplanation(!showExplanation)}
                    className="w-full"
                >
                    {showExplanation ? 'Hide Explanation' : 'How does it work?'}
                </Button>
                {showExplanation && (
                    <div className="mt-3 p-3 bg-default-100 rounded-lg text-left text-sm text-default-600">
                        <p className="mb-3">
                            The Pomodoro Technique helps you{' '}
                            <strong>focus and stay productive</strong>. It works in short, timed
                            intervals:
                        </p>
                        <ol className="list-inside space-y-2 list-decimal">
                            <li>
                                <strong>Focus:</strong> Start the timer and work on one task.
                            </li>
                            <li>
                                Take a <strong>short break: </strong> Relax and recharge (3-5 min).
                            </li>
                            <li>
                                Take a <strong>long break</strong> after 4 focus cycles (15-20 min).
                            </li>
                        </ol>
                        <p className="mt-3">
                            This rhythm helps prevent burnout and keeps your mind fresh.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
