
import 'dotenv/config';
console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    // console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 13));
    const match = process.env.DATABASE_URL.match(/@([^:/]+)/);
    if (match) console.log('DB Host:', match[1]);
    const portMatch = process.env.DATABASE_URL.match(/:(\d+)(\/|\?|$)/);
    if (portMatch) console.log('DB Port:', portMatch[1]);
} else {
    console.log('DATABASE_URL is NOT set');
}
