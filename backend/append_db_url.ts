import fs from 'fs';
const dbUrl = '\nDATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/qna_db"';
fs.appendFileSync('.env', dbUrl);
console.log('Appended DATABASE_URL to .env');
