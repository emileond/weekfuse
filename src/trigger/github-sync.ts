import { logger, task } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { toUTC, calculateExpiresAt } from '../utils/dateUtils';
import ky from 'ky';
import { Octokit } from 'octokit';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const githubSync = task({
    id: 'github-sync',
    maxDuration: 3000, // 50 minutes max duration
    run: async (payload: any) => {
        logger.log('Starting GitHub sync task');

        try {
            // Check if token has expired
            const currentTime = dayjs().utc();
            const tokenExpired =
                !payload.expires_at || currentTime.isAfter(dayjs(payload.expires_at));

            let access_token = payload.access_token;
            let refresh_token = payload.refresh_token;
            let expires_at = payload.expires_at;

            // Only refresh token if it has expired
            if (tokenExpired) {
                logger.log(`Access token expired, refreshing`);
                const res = await ky
                    .post('https://github.com/login/oauth/access_token', {
                        searchParams: {
                            client_id: process.env.GITHUB_CLIENT_ID,
                            client_secret: process.env.GITHUB_CLIENT_SECRET,
                            grant_type: 'refresh_token',
                            refresh_token: payload.refresh_token,
                        },
                        headers: {
                            Accept: 'application/json',
                        },
                    })
                    .json();

                if (res.error) {
                    logger.error('Failed to refresh access token', res.error);
                    await supabase
                        .from('user_integrations')
                        .update({
                            status: 'error',
                        })
                        .eq('id', payload.id);
                } else {
                    // Update token information
                    access_token = res.access_token;
                    refresh_token = res.refresh_token;
                    expires_at = calculateExpiresAt(res.expires_in);

                    // Update the database with new token information
                    await supabase
                        .from('user_integrations')
                        .update({
                            access_token,
                            refresh_token,
                            expires_at,
                            last_sync: toUTC(),
                        })
                        .eq('id', payload.id);
                }
            } else {
                // Token is still valid, just update the last_sync timestamp
                await supabase
                    .from('user_integrations')
                    .update({
                        last_sync: toUTC(),
                    })
                    .eq('id', payload.id);
            }

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
                            workspace_id: payload.workspace_id,
                            integration_source: 'github',
                            external_id: issue.id,
                            external_data: issue,
                            host: issue.url,
                            assignee: payload.user_id,
                            creator: payload.user_id,
                        },
                        {
                            onConflict: 'integration_source, external_id, host, workspace_id',
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
                    `Processed ${issuesData.length} issues for workspace ${payload.workspace_id}: ${issueSuccessCount} succeeded, ${issueFailCount} failed`,
                );
            }

            logger.log(
                `Successfully synced GitHub integration for workspace ${payload.workspace_id}`,
            );
        } catch (error) {
            console.log(error);
            logger.error(
                `Error syncing GitHub integration for workspace ${payload.workspace_id}: ${error.message}`,
            );
        }

        return {
            success: true,
        };
    },
});
