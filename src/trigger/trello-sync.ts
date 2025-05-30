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

export const trelloSync = task({
    id: 'trello-sync',
    maxDuration: 3600, // 60 minutes max duration
    run: async (payload: any) => {
        logger.log('Starting Trello sync task');

        try {
            // Update the last_sync timestamp
            await supabase
                .from('user_integrations')
                .update({
                    last_sync: toUTC(),
                })
                .eq('id', payload.id);

            const access_token = payload.access_token;

            // Get boards the member belongs to
            const boards = await ky
                .get(
                    `https://api.trello.com/1/members/me/boards?key=${process.env.TRELLO_API_KEY}&token=${access_token}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                )
                .json();

            // Get all cards from boards that are visible to the member
            let allCards = [];

            // Iterate through each board and get all cards
            if (boards && Array.isArray(boards)) {
                const cardPromises = boards.map((board) => {
                    const boardCardsUrl = `https://api.trello.com/1/boards/${board.id}/cards/open?key=${process.env.TRELLO_API_KEY}&token=${access_token}`;
                    return ky
                        .get(boardCardsUrl, {
                            headers: {
                                Accept: 'application/json',
                            },
                        })
                        .json();
                });

                const boardCardsResults = await Promise.all(cardPromises);

                // Combine all cards from all boards
                allCards = boardCardsResults.flat();
            }

            const cardsData = allCards;

            // Process and store cards
            if (cardsData && Array.isArray(cardsData)) {
                const upsertPromises = cardsData.map((card) => {
                    // Convert markdown description to Tiptap format
                    const tiptapDescription = card?.desc ? markdownToTipTap(card.desc) : null;

                    return supabase.from('tasks').upsert(
                        {
                            name: card.name,
                            description: tiptapDescription,
                            workspace_id: payload.workspace_id,
                            integration_source: 'trello',
                            external_id: card.id,
                            external_data: card,
                            host: card.url,
                        },
                        {
                            onConflict: ['integration_source', 'external_id, host'],
                        },
                    );
                });

                const results = await Promise.all(upsertPromises);

                let cardSuccessCount = 0;
                let cardFailCount = 0;

                results.forEach((result, index) => {
                    if (result.error) {
                        logger.error(
                            `Upsert error for card ${cardsData[index].id}: ${result.error.message}`,
                        );
                        cardFailCount++;
                    } else {
                        cardSuccessCount++;
                    }
                });

                logger.log(
                    `Processed ${cardsData.length} cards for workspace ${payload.workspace_id}: ${cardSuccessCount} succeeded, ${cardFailCount} failed`,
                );
            }

            logger.log(
                `Successfully synced Trello integration for workspace ${payload.workspace_id}`,
            );
        } catch (error) {
            console.log(error);
            logger.error(
                `Error syncing Trello integration for workspace ${payload.workspace_id}: ${error.message}`,
            );
        }

        return {
            success: true,
        };
    },
});
