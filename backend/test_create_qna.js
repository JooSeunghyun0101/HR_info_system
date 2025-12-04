import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3000/api';

// Login first to get token
async function testCreateQnA() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // Get categories to use a valid category ID
        console.log('Fetching categories...');
        const catRes = await axios.get(`${API_URL}/categories`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const categories = catRes.data;
        if (categories.length === 0) {
            console.error('No categories found. Cannot create Q&A.');
            return;
        }
        const categoryId = categories[0].id;
        console.log(`Using category ID: ${categoryId}`);

        // Create Q&A
        console.log('Creating Q&A...');
        const qnaData = {
            question_title: 'API Test Question',
            question_details: 'This is a test question created via script.',
            answer: 'Test answer.',
            categories: [categoryId],
            tags: ['api-test']
        };

        const createRes = await axios.post(`${API_URL}/qna`, qnaData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Q&A Created Successfully:', createRes.data);

    } catch (error) {
        console.error('Error creating Q&A:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testCreateQnA();
