import { logger, task } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import { toUTC } from '../utils/dateUtils';
import ky from 'ky';
import { markdownToTipTap } from '../utils/editorUtils';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const mondaySync = task({
    id: 'monday-sync',
    maxDuration: 3600, // 60 minutes max duration
    run: async (payload: any) => {
        logger.log('Starting Monday.com sync task');

        try {
            // Update the last_sync timestamp
            await supabase
                .from('user_integrations')
                .update({
                    last_sync: toUTC(),
                })
                .eq('id', payload.id);

            const access_token = payload.access_token;

            // Get project_id from integration config if available
            const project_id = payload.config?.project_id || null;

            // Get boards the user has access to
            const boardsQuery = `
                query {
                    boards {
                        id
                        name
                        description
                        items {
                            id
                            name
                            column_values {
                                id
                                title
                                text
                                value
                            }
                        }
                    }
                }
            `;

            const boardsResponse = await ky.post('https://api.monday.com/v2', {
                json: {
                    query: boardsQuery,
                },
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            }).json();

            const boards = boardsResponse.data?.boards || [];

            // Process and store items from all boards
            if (boards && Array.isArray(boards)) {
                const allItems = [];

                // Collect all items from all boards
                boards.forEach(board => {
                    if (board.items && Array.isArray(board.items)) {
                        board.items.forEach(item => {
                            // Add board info to each item for reference
                            item.board = {
                                id: board.id,
                                name: board.name,
                            };
                            allItems.push(item);
                        });
                    }
                });

                // Process and store items
                const upsertPromises = allItems.map(item => {
                    // Convert description to Tiptap format if available
                    const descriptionColumn = item.column_values.find(
                        col => col.title.toLowerCase() === 'description' || col.id === 'description'
                    );
                    const tiptapDescription = descriptionColumn?.text ? markdownToTipTap(descriptionColumn.text) : null;

                    return supabase.from('tasks').upsert(
                        {
                            name: item.name,
                            description: tiptapDescription,
                            workspace_id: payload.workspace_id,
                            integration_source: 'monday',
                            external_id: item.id,
                            external_data: {
                                ...item,
                                board_id: item.board.id,
                                board_name: item.board.name,
                            },
                            host: `https://monday.com/boards/${item.board.id}/pulses/${item.id}`,
                            assignee: payload.user_id,
                            creator: payload.user_id,
                            project_id: project_id,
                        },
                        {
                            onConflict: 'integration_source, external_id, host, workspace_id',
                        },
                    );
                });

                const results = await Promise.all(upsertPromises);

                let itemSuccessCount = 0;
                let itemFailCount = 0;

                results.forEach((result, index) => {
                    if (result.error) {
                        logger.error(
                            `Upsert error for item ${allItems[index].id}: ${result.error.message}`,
                        );
                        itemFailCount++;
                    } else {
                        itemSuccessCount++;
                    }
                });

                logger.log(
                    `Processed ${allItems.length} items for workspace ${payload.workspace_id}: ${itemSuccessCount} succeeded, ${itemFailCount} failed`,
                );
            }

            logger.log(
                `Successfully synced Monday.com integration for workspace ${payload.workspace_id}`,
            );
        } catch (error) {
            console.log(error);
            logger.error(
                `Error syncing Monday.com integration for workspace ${payload.workspace_id}: ${error.message}`,
            );
        }

        return {
            success: true,
        };
    },
});