import { GoogleGenAI, Type } from '@google/genai';

export async function onRequestPost(context) {
    const body = await context.request.json();
    const { taskName } = body;
    const ai = new GoogleGenAI({ apiKey: context.env.GEMINI_API_KEY });

    const prompt = `You are a helpful assistant that writes clear, concise, and detailed task descriptions.
    
Given the task name: "${taskName}", write a comprehensive description for this task.
The description should:
1. Explain what the task involves
2. Outline the key steps or components needed to complete it
3. Mention any potential dependencies or considerations
4. Be professional and actionable

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
