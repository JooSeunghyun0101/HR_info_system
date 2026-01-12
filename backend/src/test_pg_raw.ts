
import { Client } from 'pg';
import 'dotenv/config';
import dns from 'node:dns';
try {
    dns.setDefaultResultOrder('ipv4first');
} catch (e) {
    console.log('Node version too old for dns.setDefaultResultOrder, ignoring.');
}

console.log('Testing raw PG connection...');
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        await client.connect();
        console.log('PG Client connected successfully');
        const res = await client.query('SELECT NOW()');
        console.log('Query result:', res.rows[0]);
        await client.end();
    } catch (err: any) {
        console.error('PG Connection error:', err.message);
        // console.error(err.stack);
    }
}
main();
