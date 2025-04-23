import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const body = await context.request.json();
    const { startDate, endDate, scheduledTasks, workspace_id } = body;
    const ai = new GoogleGenAI({ apiKey: context.env.GEMINI_API_KEY });

    // fetch backlog form supabase
    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    const { data: backlog, error } = await supabase
        .from('tasks')
        .select('name, description, id')
        .eq('workspace_id', workspace_id)
        .is('date', null)
        .eq('status', 'pending')
        .order('order')
        .limit(20);

    const prompt = `You are a planning assistant. Generate a balanced, multi-project schedule for the user between ${startDate} and ${endDate}.  

Inputs:
- scheduledTasks: an array of tasks the user has already scheduled: ${JSON.stringify(scheduledTasks)}
- backlog: an array of unscheduled tasks: ${JSON.stringify(backlog)}
- dateRange: from ${startDate} to ${endDate}.

Requirements:
1. **Preserve** every scheduledTask on its assigned date.
2. **Distribute** backlog tasks across open slots between startDate and endDate:
   - Respect each task’s priority (higher-priority tasks go earlier).
   - Match tasks to days based on context—e.g. group coding tasks on days with fewer meetings.
   - Do not exceed a daily capacity of 8 hours.
   - Balance workload week-to-week: aim for ~40 hours/week.
3. **Honor milestones**: for each project/milestone, ensure its tasks are spaced so that milestone due dates (if provided) are met.
4. **Workdays only**: schedule tasks Monday–Friday; leave weekends free.
5. **Output** as JSON array of all tasks (both originally scheduled and newly assigned), each with:
   {
     id: string,          // task ID, use the original id from each task
     date: timestampz (UTC),  // assigned date
   }

Return only the JSON array as the model’s output.`;

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
                        date: { type: Type.STRING, description: 'Assigned date, timestampz UTC' },
                    },
                    required: [
                        'id',
                        'date',
                    ],
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
            const updatePromises = parsedResponse.map(task => {
                // Only update tasks that are not in scheduledTasks
                const isScheduledTask = scheduledTasks.some(scheduledTask => scheduledTask.id === task.id);
                if (!isScheduledTask) {
                    return supabase
                        .from('tasks')
                        .update({ date: task.date })
                        .eq('id', task.id);
                }
                return Promise.resolve({ data: null, error: null });
            });

            // Execute all updates concurrently
            const results = await Promise.all(updatePromises);

            // Log any errors that occurred during updates
            results.forEach((result, index) => {
                if (result.error) {
                    console.error(`Failed to update task ${parsedResponse[index].id}:`, result.error);
                }
            });
        }
    } catch (e) {
        console.error('Error parsing AI response:', e);
        parsedResponse = response.text;
    }

    return Response.json(parsedResponse);
}
