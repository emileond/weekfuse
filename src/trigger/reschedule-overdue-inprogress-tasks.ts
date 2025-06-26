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
 * It updates these tasks' dates to the current day, respecting the user's timezone.
 */
export const rescheduleOverdueTasks = schedules.task({
    // A unique ID for this job
    id: 'reschedule-overdue-inprogress-tasks',
    // Runs once every day at 2:00 AM UTC.
    // This time is chosen to ensure all timezones have passed midnight.
    cron: '0 2 * * *',
    maxDuration: 300, // 5 minutes max duration
    run: async () => {
        logger.log('Starting job: Reschedule Overdue "In Progress" Tasks.');

        // 1. Fetch all unique timezones from user profiles to process users in batches.
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

        // 2. Process tasks for each timezone individually.
        for (const tz of uniqueTimezones) {
            try {
                // Determine the current date string (e.g., "2024-10-27") for this timezone.
                const todayForTimezone = dayjs().tz(tz).format('YYYY-MM-DD');
                logger.log(`Processing timezone: ${tz}. Today's date is ${todayForTimezone}.`);

                // Find all users who belong to the current timezone.
                const { data: usersInTz, error: usersError } = await supabase
                    .from('profiles')
                    .select('id')
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
                const userIds = usersInTz.map((u) => u.id);

                // Find all tasks for these users that are "in progress" and have a date before today.
                const { data: overdueTasks, error: tasksError } = await supabase
                    .from('tasks')
                    .select('id')
                    .in('creator', userIds)
                    .eq('status', 'in progress')
                    .lt('date', todayForTimezone);

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
                logger.log(`Found ${overdueTaskIds.length} overdue tasks for timezone ${tz}.`);

                // 3. Perform a batch update to move the tasks to the current date.
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update({ date: todayForTimezone })
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
                logger.error(`An error occurred while processing timezone ${tz}:`, error);
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
