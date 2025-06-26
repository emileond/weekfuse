import { logger, schedules } from '@trigger.dev/sdk/v3';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import ky, { HTTPError } from 'ky';

// Initialize dayjs plugins for robust timezone handling
dayjs.extend(utc);
dayjs.extend(timezone);

// --- Configuration ---
// CHANGE: The reminder hour is now a hardcoded constant instead of an env var.
const REMINDER_HOUR_LOCAL = 9; // Represents 9:00 AM in the user's local time.

// --- Client Initialization ---
const supabase: SupabaseClient = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

// --- Type Definitions ---
interface Profile {
    id: string;
    email: string;
    name?: string | null;
    planning_timezone: string | null;
    planning_day_of_week: number;
    planning_reminder_sent_at: string | null;
}

interface JobEnv {
    listmonkUrl: string;
    listmonkUsername: string;
    listmonkAccessToken: string;
    listmonkTemplateId: number;
    listmonkListUuid: string | null;
}

// --- Main Task Definition ---
export const sendPlanningReminder = schedules.task({
    id: 'send-planning-reminder',
    cron: '*/10 * * * *', // Every 10 minutes
    maxDuration: 300, // 5 minutes
    run: async (payload, io, ctx) => {
        logger.info('🚀 Starting weekly planning reminder task...');

        const oneWeekAgo = dayjs().utc().subtract(7, 'day').toISOString();

        // 2. Fetch all profiles that are due for a reminder.
        const { data: profiles, error: fetchError } = await supabase
            .from('profiles')
            .select(
                'id, email, name, planning_timezone, planning_day_of_week, planning_reminder_sent_at',
            )
            .eq('planning_reminder', true)
            .or(`planning_reminder_sent_at.is.null,planning_reminder_sent_at.lt.${oneWeekAgo}`)
            .limit(250);

        if (fetchError) {
            logger.error('🚨 Error fetching profiles from Supabase', { error: fetchError.message });
            throw new Error(`Supabase fetch error: ${fetchError.message}`);
        }

        if (!profiles || profiles.length === 0) {
            logger.info('✅ No profiles due for a reminder check at this time. Task complete.');
            return { success: true, sent: 0, failed: 0, skipped: 0 };
        }

        logger.info(`Fetched ${profiles.length} potential profiles to process.`);
        let sentCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        // 3. Process each profile individually.
        for (const profile of profiles) {
            try {
                const userLocalTime = dayjs().tz(profile.planning_timezone || 'UTC');

                // Check A: Is it the user's chosen planning day?
                if (userLocalTime.day() !== profile.planning_day_of_week) {
                    skippedCount++;
                    continue;
                }

                // Check B: Is it 9 AM in the user's local time?
                // CHANGE: Using the hardcoded constant here.
                if (userLocalTime.hour() !== REMINDER_HOUR_LOCAL) {
                    skippedCount++;
                    continue;
                }

                logger.info(`✅ Match found for profile ${profile.id}. Processing...`);

                // 4. Upsert subscriber, send email, and update database.
                await processAndSendReminder(profile);
                sentCount++;
                logger.log(`👍 Successfully sent reminder to profile ${profile.id}`);
            } catch (error) {
                failedCount++;
                if (error instanceof HTTPError) {
                    const responseBody = await error.response.text();
                    logger.error(`🚨 HTTP Error for profile ${profile.id}: ${error.message}`, {
                        statusCode: error.response.status,
                        responseBody,
                    });
                } else if (error instanceof Error) {
                    logger.error(`🚨 Error for profile ${profile.id}:`, {
                        errorMessage: error.message,
                    });
                } else {
                    logger.error(`🚨 An unknown error occurred for profile ${profile.id}:`, {
                        error,
                    });
                }
            }
        }

        logger.info('🎉 Planning reminder task finished.', {
            sent: sentCount,
            failed: failedCount,
            skipped: skippedCount,
            totalChecked: profiles.length,
        });

        return { success: true, sent: sentCount, failed: failedCount, skipped: skippedCount };
    },
});

// --- Helper Functions ---
/**
 * Handles the logic for a single user: upserts to Listmonk, sends email, and updates Supabase.
 */
async function processAndSendReminder(profile: Profile): Promise<void> {
    const subscriberPayload: Record<string, any> = {
        email: profile.email,
        name: profile.name || '',
        status: 'enabled',
        lists: [1],
        preconfirm_subscriptions: true,
    };
    try {
        await ky.post(`${process.env.LISTMONK_URL}/api/subscribers`, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `token ${process.env.LISTMONK_USERNAME}:${process.env.LISTMONK_ACCESS_TOKEN}`,
            },
            json: subscriberPayload,
        });
    } catch (error) {
        if (error.response && error.response.status === 409) {
            console.log('E-mail already exists, sending email invite.');
        }
    }

    await ky.post(`${process.env.LISTMONK_URL}/api/tx`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `token ${process.env.LISTMONK_USERNAME}:${process.env.LISTMONK_ACCESS_TOKEN}`,
        },
        json: {
            subscriber_email: profile.email,
            template_id: 6,
            data: { user_id: profile.id, name: profile.name },
            content_type: 'html',
        },
        timeout: 10000,
    });

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ planning_reminder_sent_at: dayjs().utc().toISOString() })
        .eq('id', profile.id);

    if (updateError) {
        throw new Error(
            `Failed to update timestamp for profile ${profile.id}: ${updateError.message}`,
        );
    }
}
