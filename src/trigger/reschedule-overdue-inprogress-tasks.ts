import { logger, schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with necessary plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Initialize the Supabase client using environment variables
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

/**
 * This job runs daily to find tasks that are still "in progress" but have a date in the past.
 * It updates these tasks' dates to the current day, respecting the assignee's timezone.
 */
export const rescheduleOverdueTasks = schedules.task({
    id: 'reschedule-overdue-inprogress-tasks',
    cron: '0 * * * *', // Every hour
    maxDuration: 300, // 5 minutes max duration
    run: async () => {
        logger.log('Starting job: Reschedule Overdue "In Progress" Tasks.');

        const { data: profiles, error: tzError } = await supabase
            .from('profiles')
            .select('timezone')
            .not('timezone', 'is', null);

        if (tzError) {
            logger.error(`Error fetching user timezones: ${tzError.message}`);
            return { success: false, error: tzError.message };
        }

        const uniqueTimezones = [...new Set(profiles.map((p) => p.timezone))];
        logger.log(`Found ${uniqueTimezones.length} unique timezones to process.`);

        let totalUpdatedCount = 0;
        let totalFailedCount = 0;

        for (const tz of uniqueTimezones) {
            try {
                // This full timestamp represents the start of the current day in the user's timezone.
                // It will be used for both finding overdue tasks and updating them.
                const newDateForTimezone = dayjs().tz(tz).startOf('day').toISOString();

                logger.log(`Processing timezone: ${tz}. Start of day is ${newDateForTimezone}`);

                const { data: usersInTz, error: usersError } = await supabase
                    .from('profiles')
                    .select('user_id') // Using user_id as requested
                    .eq('timezone', tz);

                if (usersError) {
                    throw new Error(
                        `Failed to fetch users for timezone ${tz}: ${usersError.message}`,
                    );
                }
                if (!usersInTz || usersInTz.length === 0) {
                    logger.log(`No users found for timezone ${tz}.`);
                    continue;
                }
                const userIds = usersInTz.map((u) => u.user_id); // Using user_id as requested

                const { data: overdueTasks, error: tasksError } = await supabase
                    .from('tasks')
                    .select('id')
                    .in('assignee', userIds)
                    .eq('status', 'in progress')
                    .lt('date', newDateForTimezone);

                if (tasksError) {
                    throw new Error(
                        `Failed to fetch overdue tasks for timezone ${tz}: ${tasksError.message}`,
                    );
                }

                if (!overdueTasks || overdueTasks.length === 0) {
                    logger.log(`No overdue tasks to update for timezone ${tz}.`);
                    continue;
                }

                const overdueTaskIds = overdueTasks.map((t) => t.id);
                logger.log(
                    `Found ${overdueTaskIds.length} overdue tasks for timezone ${tz} to update.`,
                );

                // Perform a batch update using the full, timezone-aware timestamp
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update({ date: newDateForTimezone })
                    .in('id', overdueTaskIds);

                if (updateError) {
                    throw new Error(
                        `Failed to update tasks for timezone ${tz}: ${updateError.message}`,
                    );
                }

                totalUpdatedCount += overdueTaskIds.length;
                logger.log(
                    `Successfully updated ${overdueTaskIds.length} tasks for timezone ${tz}.`,
                );
            } catch (error) {
                totalFailedCount++;
                logger.error(`An error occurred while processing timezone ${tz}:`, error as any);
            }
        }

        logger.log('Finished rescheduling job.');
        return {
            success: true,
            updated: totalUpdatedCount,
            timezonesProcessed: uniqueTimezones.length,
            errors: totalFailedCount,
        };
    },
});
