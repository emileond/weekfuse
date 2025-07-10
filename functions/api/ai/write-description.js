import { GoogleGenAI } from '@google/genai';

export async function onRequestPost(context) {
    const body = await context.request.json();
    const { taskName, tags = [], currentContent = null } = body;
    const ai = new GoogleGenAI({ apiKey: context.env.GEMINI_API_KEY });

    // Build the prompt with additional context if available
    let prompt = `You are an expert project manager's assistant, skilled at crafting task descriptions that are clear and intuitive. Your purpose is to write task descriptions that are professional, clear, and purpose-driven, fully aligned with an ethos of "intentional work".

The name of the task is: "${taskName}"`;

    // Add tags context if available
    if (tags && tags.length > 0) {
        prompt += `\nIt is associated with these topics or tags: ${tags.join(', ')}`;
    }

    // Add current content context if available
    if (currentContent) {
        prompt += `\nHere is the current description, which you should aim to enhance or seamlessly integrate:\n${JSON.stringify(currentContent)}`;
    }

    prompt += `

Write a description for this task.

**Tone and Style Guidelines:**
- Write in a supportive and clear tone. The output should feel like it was written by a helpful human.
- Add markdown formatting to the output to make it look nice and professional.
- **Avoid:**
    - Corporate clichés and buzzwords.
    - Overly technical or opaque jargon.
    - Hype, fluff, or overly enthusiastic language.
    - Clichés like "Let's dive in!", "Your mission is...", or unnecessary exclamation points.

**Content and Formatting Rules:**
- **Do NOT** use the task name "${taskName}" as a heading or title.
- Start the description by immediately stating the task's primary goal or objective.
- Organically weave in the core components of the task, its purpose, and the necessary steps to get it done.
- If relevant, mention any dependencies or key considerations.
- The entire output must be only the markdown-formatted description, under 200 words.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: prompt,
    });

    // Extract the generated description from the response
    const generatedDescription = response.text;

    return Response.json({ description: generatedDescription });
}
