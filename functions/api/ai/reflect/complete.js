import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { session_id, ai_insights, user_notes } = body;

        if (!session_id || !ai_insights || !user_notes) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const ai = new GoogleGenAI({ apiKey: context.env.GEMINI_API_KEY });
        const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

        const { data: session, error: sessionFetchError } = await supabase
            .from('reflect_sessions')
            .select('*')
            .eq('id', session_id)
            .single();

        if (sessionFetchError) {
            console.error('Error fetching session:', sessionFetchError);
            return new Response(JSON.stringify({ error: 'Failed to fetch reflection session' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- Improved Prompt ---
        const prompt = `You are an insightful Productivity Coach AI. Your purpose is to empower users by analyzing their reflections and offering supportive, practical advice.

Review the following AI insights and the user's personal reflection:

AI Insights: ${JSON.stringify(ai_insights)}

User Reflection:
- What went well: ${user_notes.went_well}
- What could have gone better: ${user_notes.could_be_better}
- Ideas for improvement: ${user_notes.ideas}

Based on this information, generate an encouraging summary and 1-3 specific, actionable recommendations.

Your response MUST be a valid JSON object with the following structure:

{
  "summary": "A short (1-3 sentences), analysis of the reflection session that serves as a segue to display the recommendations, i.e. '23 tasks were completed during this period of time, which indicates a highly productive pace, there are still some things that can be improved, but overall it was good, here are some recommendations for the future' ",
  "recommendations": [
    {
      "title": "A short, catchy title for the recommendation (max 5 words).",
      "description": "A concise (1-2 sentences) explanation of the recommendations, *why* this helps and *how* to start implementing it.",
      "category": "One of: 'Productivity', 'Well-being', 'Focus', 'Planning', 'Learning', or another relevant category."
    }
  ]
}

Guidelines:
- Generate 1-3 *highly relevant* and *actionable* recommendations. Quality over quantity.
- Be specific and actionable - each recommendation should be something the user can implement right away.
- The tone should be **positive, supportive, and encouraging**. Avoid verbose language.
- Base your recommendations on both the AI insights and the user's own reflection
- Ensure the final output is a single, valid JSON object.`;

        // Send data to Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', // Consider 'gemini-1.5-flash' if 2.0 isn't available or for cost/speed
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                // --- Updated Response Schema ---
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            // Added summary field
                            type: Type.STRING,
                            description: 'A short (1-2 sentences) summary of the results.',
                        },
                        recommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: {
                                        type: Type.STRING,
                                        description: 'A short, catchy title (max 5 words).',
                                    },
                                    description: {
                                        type: Type.STRING,
                                        description:
                                            'A concise (1-2 sentences) explanation and how-to.',
                                    },
                                    category: {
                                        type: Type.STRING,
                                        description: 'The category of the recommendation.',
                                    },
                                },
                                required: ['title', 'description', 'category'],
                            },
                            description: 'A list of 1-3 concise recommendations',
                        },
                    },
                    required: ['summary', 'recommendations'],
                },
            },
        });
        
        let ai_summary;
        try {
            // Check if response.text exists and is a string
            const responseText = response?.text; // Use optional chaining
            if (typeof responseText === 'string') {
                ai_summary = JSON.parse(responseText);
            } else {
                console.error('AI response text is not available or not a string:', response);
                throw new Error('AI response text not available');
            }
        } catch (e) {
            console.error('Error parsing AI response:', e, 'Raw response:', response?.text);
            ai_summary = {
                error: 'Failed to parse AI response',
                raw: response?.text || 'No raw text',
            };
        }

        // Update session data
        const { data: updatedSession, error: updateError } = await supabase
            .from('reflect_sessions')
            .update({
                ai_summary, // This now contains { summary: "...", recommendations: [...] }
                user_notes,
                status: 'completed',
            })
            .eq('id', session_id)
            .select('id')
            .single();

        if (updateError) {
            console.error('Error updating session:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to update reflection session' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return Response.json({
            id: updatedSession.id,
            message: 'Reflection session completed successfully',
            summary: ai_summary, // Optionally return the summary directly
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
