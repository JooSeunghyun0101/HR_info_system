import fs from 'fs';

try {
    const content = fs.readFileSync('.env', 'utf8');
    const lines = content.split('\n');
    let apiKey = '';
    for (const line of lines) {
        if (line.includes('OPENAI_API_KEY')) {
            apiKey = line.trim();
        }
    }

    const newContent = `
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/qna_db"
PORT=3000
JWT_SECRET="supersecretkey"
${apiKey}
`;

    fs.writeFileSync('.env', newContent.trim());
    console.log('Rewrote .env file');
    console.log(newContent);

} catch (err) {
    console.error(err);
}
