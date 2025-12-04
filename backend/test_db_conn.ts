import { Client } from 'pg';

const client = new Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:5433/qna_db",
});

async function test() {
    try {
        await client.connect();
        console.log('Connected successfully');
        await client.end();
    } catch (err) {
        console.error('Connection failed', err);
    }
}

test();
