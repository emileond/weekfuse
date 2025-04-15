import { logger, schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { toUTC } from '../utils/dateUtils';
import ky from 'ky';
import { Octokit } from 'octokit';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const githubSync = schedules.task({
    id: 'github-sync',
    cron: '0 * * * *', // Run every hour
    maxDuration: 3000, // 50 minutes max duration
    run: async () => {
        logger.log('Starting GitHub sync task');

        // Calculate the timestamp for 8 hours ago in UTC
        const timeRange = dayjs().utc().subtract(8, 'hours').toISOString();

        // Fetch active workspace integrations that need syncing
        const { data: integrations, error: fetchError } = await supabase
            .from('workspace_integrations')
            .select('*')
            .eq('type', 'github')
            .eq('status', 'active')
            .lt('last_sync', timeRange);

        if (fetchError) {
            logger.error(`Error fetching GitHub integrations: ${fetchError.message}`);
            return { success: false, error: fetchError.message };
        }

        if (!integrations || integrations.length === 0) {
            logger.log('No GitHub integrations need syncing');
            return { success: true, synced: 0 };
        }

        logger.log(`Found ${integrations.length} GitHub integrations to sync`);

        let syncedCount = 0;
        let failedCount = 0;

        // Process each integration
        for (const integration of integrations) {
            try {
                logger.log(`Refreshing access_token`);
                const res = await ky
                    .post('https://github.com/login/oauth/access_token', {
                        searchParams: {
                            client_id: process.env.GITHUB_CLIENT_ID,
                            client_secret: process.env.GITHUB_CLIENT_SECRET,
                            grant_type: 'refresh_token',
                            refresh_token: integration.refresh_token,
                        },
                        headers: {
                            Accept: 'application/json',
                        },
                    })
                    .json();

                if (res.error) {
                    logger.error('Failed to refresh access token');
                    await supabase
                        .from('workspace_integrations')
                        .update({
                            status: 'error',
                        })
                        .eq('id', integration.id);
                }

                const { access_token, refresh_token } = res;

                const octokit = new Octokit({ auth: access_token });

                const issuesData = await octokit.paginate('GET /issues?state=open');

                // Process and store issues
                if (issuesData && Array.isArray(issuesData)) {
                    const upsertPromises = issuesData.map((issue) =>
                        supabase.from('tasks').upsert(
                            {
                                name: issue.title,
                                description: {
                                    type: 'doc',
                                    content: [
                                        {
                                            type: 'paragraph',
                                            content: [{ type: 'text', text: issue.body || '' }],
                                        },
                                    ],
                                },
                                workspace_id: integration.workspace_id,
                                integration_source: 'github',
                                external_id: issue.id,
                                external_data: issue,
                                created_at: issue.created_at,
                            },
                            {
                                onConflict: ['integration_source', 'external_id'],
                            },
                        ),
                    );

                    const results = await Promise.all(upsertPromises);

                    let issueSuccessCount = 0;
                    let issueFailCount = 0;

                    results.forEach((result, index) => {
                        if (result.error) {
                            logger.error(
                                `Upsert error for issue ${issuesData[index].id}: ${result.error.message}`,
                            );
                            issueFailCount++;
                        } else {
                            issueSuccessCount++;
                        }
                    });

                    logger.log(
                        `Processed ${issuesData.length} issues for workspace ${integration.workspace_id}: ${issueSuccessCount} succeeded, ${issueFailCount} failed`,
                    );
                }

                // Update the last_sync timestamp
                await supabase
                    .from('workspace_integrations')
                    .update({
                        access_token,
                        refresh_token,
                        last_sync: toUTC(),
                    })
                    .eq('id', integration.id);

                syncedCount++;
                logger.log(
                    `Successfully synced GitHub integration for workspace ${integration.workspace_id}`,
                );
            } catch (error) {
                console.log(error);
                failedCount++;
                logger.error(
                    `Error syncing GitHub integration for workspace ${integration.workspace_id}: ${error.message}`,
                );
            }
        }

        return {
            success: true,
            synced: syncedCount,
            failed: failedCount,
            total: integrations.length,
        };
    },
});
