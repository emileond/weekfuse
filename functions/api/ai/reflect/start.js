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
        const prompt = `You are an AI assistant that analyzes task data and generates a narrative summary of the work accomplished, highlighting key themes and trends.

Analyze the following tasks completed between ${dayjs(start_date).format('MMMM D,<ctrl3348>')} and ${dayjs(end_date).format('MMMM D,<ctrl3348>')}.

Tasks data: ${JSON.stringify(tasks)}

Provide a concise analysis with the following sections. Avoid verbose:
1. Achievements: Highlight 1-3 key accomplishments and completed milestones or positive trends.
3. Patterns: Identify 2-3 overarching themes or focus areas that emerged during this period based on the tasks completed (e.g., a strong push on a specific project, a focus on a particular type of task, a period of high-volume but shorter tasks). Explain why these themes are significant based on the data..
4. Challenges: Identify 1-2 potential challenges or bottlenecks identified from the task data. Explain the data points that suggest these areas.

Format your response as a structured JSON object with these sections as keys.`;

        // Send tasks data to Gemini API to generate insights
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
                        patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
                        challenges: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['achievements', 'patterns', 'challenges'],
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
