import { Button } from '@heroui/react';
import { RiArrowLeftLine } from 'react-icons/ri';

export function StatsView({ stats, onBack }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-medium bg-content2 p-3">
                    <div className="text-xs text-default-500">Focus Sessions</div>
                    <div className="text-2xl font-semibold">{stats.completedPomodoros}</div>
                </div>
                <div className="rounded-medium bg-content2 p-3">
                    <div className="text-xs text-default-500">Total Focus Time</div>
                    <div className="text-2xl font-semibold">
                        {Math.round(stats.totalFocusTime / 60)} min
                    </div>
                </div>
                <div className="rounded-medium bg-content2 p-3">
                    <div className="text-xs text-default-500">Breaks Taken</div>
                    <div className="text-2xl font-semibold">{stats.completedBreaks}</div>
                </div>
                <div className="rounded-medium bg-content2 p-3">
                    <div className="text-xs text-default-500">Daily Streak</div>
                    <div className="text-2xl font-semibold">{stats.dailyStreak} days</div>
                </div>
            </div>

            <div className="mt-2">
                <Button
                    variant="flat"
                    color="default"
                    onPress={onBack}
                    startContent={<RiArrowLeftLine />}
                    className="w-full"
                >
                    Back
                </Button>
            </div>
        </div>
    );
}
