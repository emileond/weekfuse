import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Setup dayjs with UTC plugin
dayjs.extend(utc);

export async function onRequestPost(context) {
    const body = await context.request.json();
    const { startDate, endDate, availableDates, workspace_id } = body;
    const ai = new GoogleGenAI({ apiKey: context.env.GEMINI_API_KEY });

    // fetch backlog from supabase
    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    const { data: backlog } = await supabase
        .from('tasks')
        .select('id, name, description, priority, project_id, milestone_id')
        .eq('workspace_id', workspace_id)
        .is('date', null)
        .eq('status', 'pending')
        .order('order')
        .limit(50);

    const prompt = `You are a planning assistant. Your goal is to schedule tasks from a backlog onto a calendar, respecting user workload and constraints. Generate a balanced schedule for the user between ${startDate} and ${endDate}.

Inputs:
- availableDates: an array of objects containing UTC ISO-8601 datetimes (start-of-day) and weekday names on which you MAY place new tasks. Do NOT schedule tasks on any dates _not_ in this list: ${JSON.stringify(availableDates)} 
- backlog: An array of unscheduled tasks, ordered by priority (earlier items should be scheduled first): ${JSON.stringify(backlog)}
- dateRange: Schedule tasks from ${startDate} (inclusive) to ${endDate} (inclusive) in UTC.

Requirements:
1.  **Strict Whitelist**: You may only assign tasks to dates in \`availableDates\`. If a backlog item cannot fit on any of those dates, leave it unscheduled.
2.  **Max 3 Tasks per Day**: None of the provided availableDates have ≥3 existing tasks, so you only need to worry about distributing the backlog intelligently.
3.  **Context-Aware Distribution**: Instead of evenly distributing tasks, consider both the task context (name and description) and the day of the week. For example:
   - Schedule collaborative tasks on Mondays and Tuesdays when people are more energized after the weekend
   - Schedule deep work, coding, and creative tasks on Wednesdays and Thursdays when there are fewer interruptions
   - Schedule planning, reviews, and lighter tasks on Fridays when energy may be lower
   - Match task content with appropriate days (e.g., "weekly review" tasks on Fridays)

   Remember: do NOT add any dates outside of \`availableDates\`. Do NOT schedule on weekends or holidays—if they're not in \`availableDates\`, they're off-limits.


Output Format:
- Return ONLY a JSON array.
- The array should contain objects representing *only the tasks from the backlog that you were able to schedule*.
- Each object in the array must have:
  {
      "id": "string",          // The original task ID from the backlog im
      "date": "string"         // Assigned date as full UTC ISO-8601, e.g. "2025-05-15T00:00:00.00"
  }
Return only the valid JSON array as your response.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING, description: 'Task ID' },
                        date: {
                            type: Type.STRING,
                            description: 'Assigned date, full UTC ISO-8601 timestamp',
                        },
                    },
                    required: ['id', 'date'],
                },
            },
        },
    });

    // Parse the response text to get the actual JSON data
    let parsedResponse;
    try {
        parsedResponse = JSON.parse(response.text);

        // Update the dates of tasks in the database based on the AI's response
        if (Array.isArray(parsedResponse)) {
            // Create an array of update operations
            const updatePromises = parsedResponse.map((task) => {
                // Make sure we're using the date string, not the object
                const dateToUse = typeof task.date === 'string' ? task.date : task.date.date;
                return supabase.from('tasks').update({ date: dateToUse }).eq('id', task.id);
            });

            // Execute all updates concurrently
            const results = await Promise.all(updatePromises);

            // Log any errors that occurred during updates
            results.forEach((result, index) => {
                if (result.error) {
                    console.error(
                        `Failed to update task ${parsedResponse[index].id}:`,
                        result.error,
                    );
                }
            });
        }
    } catch (e) {
        console.error('Error parsing AI response:', e);
        parsedResponse = response.text;
    }

    return Response.json(parsedResponse);
}
