import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Setup dayjs with UTC plugin
dayjs.extend(utc);

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { start_date, end_date, projects, user_id, workspace_id } = body;

        if (!start_date || !end_date || !user_id || !workspace_id) {
            return new Response(
                JSON.stringify({
                    error: 'Missing required fields',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        // Initialize Gemini API client
        const ai = new GoogleGenAI({ apiKey: context.env.GEMINI_API_KEY });

        // Initialize Supabase client
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        // Fetch tasks data based on date range and projects
        let query = supabase
            .from('tasks')
            .select('id, name, description, priority, project_id, date, completed_at, status')
            .eq('workspace_id', workspace_id)
            .or(
                `date.gte.${start_date},date.lte.${end_date},completed_at.gte.${start_date},completed_at.lte.${end_date}`,
            );

        // Filter by projects if provided
        if (projects && projects.length > 0) {
            query = query.in('project_id', projects);
        }

        const { data: tasks, error } = await query;

        if (error) {
            console.error('Error fetching tasks:', error);
            return new Response(
                JSON.stringify({
                    error: 'Failed to fetch tasks',
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        if (!tasks || tasks.length === 0) {
            return new Response(
                JSON.stringify({
                    error: 'No tasks found for the selected date range and projects',
                }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        // Prepare prompt for Gemini API
        const prompt = `You are a Productivity Coach AI. Your goal is to help users reflect on their work by analyzing their completed tasks and providing clear, actionable insights in a supportive tone.

Analyze the following task data for the period between ${dayjs(start_date).format('YYYY-MM-DD')} and ${dayjs(end_date).format('YYYY-MM-DD')}.

Tasks data: ${JSON.stringify(tasks)}

**Important:** Assume the 'tasks' array contains objects with at least these keys: 'id', 'title', date, 'completion_date' (optional), 'due_date' (optional), 'project' (optional), 'tags' (optional, array), 'priority' (optional).

Generate a concise analysis. Your response MUST be a valid JSON object with the following structure:

{
  "key_metrics": {
    "total_tasks": ${JSON.stringify(tasks.length)},
    "on_time_percentage": "Calculate the percentage of tasks completed on or before their due_date (ignore tasks without a due_date).",
    "top_focus_area": "Identify the project or tag with the most completed tasks. State the area and the count/percentage.",
    "overdue_tasks": "Count the number of tasks completed *after* their due_date."
  },
  "achievements": [
    "List 1-3 significant accomplishments or positive outcomes observed from the tasks (e.g., completing a major project phase, high output in a key area)."
  ],
  "patterns": [
    "List 1-2 Identify a distinct work pattern (e.g., 'Focus on X Project', 'High Volume of Small Tasks', 'Emphasis on Y Skill').",
  ],
  "challenges": [
    "List 1-2 potential challenges or area for improvement (e.g., 'Risk of Burnout', 'Planning Gaps', 'Project Bottleneck')."
  ]
}

**Guidelines:**
- Be concise and to the point.
- Ensure all text is supportive and constructive.
- Base your analysis *only* on the provided task data.
- If data for a metric (like due_dates) is largely missing, indicate that or return 'N/A'.
- Ensure the final output is a single, valid JSON object.`;

        // Send tasks data to Gemini API to generate insights
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        key_metrics: {
                            type: Type.OBJECT,
                            properties: {
                                total_completed: {
                                    type: Type.NUMBER, // Or Type.STRING if you prefer it as text
                                    description: 'The total number of tasks completed.',
                                },
                                on_time_percentage: {
                                    type: Type.STRING, // String to handle 'N/A' or '%'
                                    description:
                                        "The percentage of tasks completed on time (e.g., '85%' or 'N/A').",
                                },
                                overdue_tasks: {
                                    type: Type.NUMBER, // Or Type.STRING
                                    description:
                                        'The count of tasks completed after their due date.',
                                },
                            },
                            required: [
                                'total_completed',
                                'on_time_percentage',
                                'top_focus_area',
                                'overdue_tasks',
                            ],
                        },
                        achievements: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                            },
                            description: 'A list of 1-3 key accomplishments.',
                        },
                        patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
                        challenges: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['key_metrics', 'achievements', 'patterns', 'challenges'],
                },
            },
        });

        // Parse the AI response
        let ai_insights;
        try {
            ai_insights = JSON.parse(response.text);
        } catch (e) {
            console.error('Error parsing AI response:', e);
            ai_insights = { error: 'Failed to parse AI response', raw: response.text };
        }

        // Save session data to the reflect_sessions table
        const { data: session, error: sessionError } = await supabase
            .from('reflect_sessions')
            .insert({
                ai_insights,
                start_date,
                end_date,
                projects,
                user_id,
                workspace_id,
            })
            .select('id')
            .single();

        if (sessionError) {
            console.error('Error saving session:', sessionError);
            return new Response(
                JSON.stringify({
                    error: 'Failed to save reflection session',
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        // Return success response with session ID
        return Response.json({
            id: session.id,
            message: 'Reflection session created successfully',
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({
                error: 'An unexpected error occurred',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
}
