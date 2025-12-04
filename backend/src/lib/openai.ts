import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: 'https://models.github.ai/inference',
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
    // Replace newlines with spaces for better embedding results
    const input = text.replace(/\n/g, ' ');

    const response = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input,
        encoding_format: 'float',
    });

    return response.data[0].embedding;
}
