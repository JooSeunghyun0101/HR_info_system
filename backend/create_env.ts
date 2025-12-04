import fs from 'fs';

const content = `DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/qna_db"`;

fs.writeFileSync('.env', content, { encoding: 'utf8' });
console.log('.env created with UTF-8 encoding');
