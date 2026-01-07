import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
    if (!openai) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openai = new OpenAI({
            baseURL: 'https://models.github.ai/inference',
            apiKey,
        });
    }
    return openai;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    // Replace newlines with spaces for better embedding results
    const input = text.replace(/\n/g, ' ');

    const client = getOpenAIClient();
    const response = await client.embeddings.create({
        model: 'text-embedding-3-large',
        input,
        encoding_format: 'float',
    });

    return response.data[0].embedding;
}
