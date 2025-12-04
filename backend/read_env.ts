import fs from 'fs';
try {
    const content = fs.readFileSync('.env', 'utf8');
    console.log(content);
} catch (err) {
    console.error(err);
}
