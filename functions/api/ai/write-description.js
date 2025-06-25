import { GoogleGenAI } from '@google/genai';

export async function onRequestPost(context) {
    const body = await context.request.json();
    const { taskName, tags = [], currentContent = null } = body;
    const ai = new GoogleGenAI({ apiKey: context.env.GEMINI_API_KEY });

    // Build the prompt with additional context if available
    let prompt = `You are a helpful assistant that writes clear, concise, and detailed task descriptions.

Given the task name: "${taskName}"`;

    // Add tags context if available
    if (tags && tags.length > 0) {
        prompt += `, with the following tags: ${tags.join(', ')}`;
    }

    // Add current content context if available
    if (currentContent) {
        prompt += `\n\nThe current description contains the following information (which you can expand upon or improve):\n${JSON.stringify(currentContent)}`;
    }

    prompt += `, write a comprehensive description for this task.
The description should:
1. Explain what the task involves
2. Outline the key steps or components needed to complete it
3. Mention any potential dependencies or considerations (optional)
4. Be professional and actionable
5. Avoid vague, unclear and jargon-filled language

Keep the description under 200 words and focus on clarity and usefulness.
Return only the description in markdown format`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: prompt,
    });

    // Extract the generated description from the response
    const generatedDescription = response.text;

    return Response.json({ description: generatedDescription });
}
