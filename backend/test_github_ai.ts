import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: 'https://models.github.ai/inference',
    apiKey: process.env.OPENAI_API_KEY,
});

async function testEmbedding() {
    try {
        console.log('Testing GitHub AI API...');
        console.log('API Key:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');

        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: 'Hello world',
            encoding_format: 'float',
        });

        console.log('Success! Embedding generated:', response.data[0].embedding.slice(0, 5));
    } catch (error: any) {
        console.error('Error:', error.message);
        console.error('Details:', error);
    }
}

testEmbedding();
