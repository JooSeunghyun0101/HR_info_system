import 'dotenv/config';
import { execSync } from 'child_process';

try {
    console.log('Running prisma db push with DATABASE_URL:', process.env.DATABASE_URL);
    execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
} catch (error) {
    console.error('Failed to run prisma db push');
    process.exit(1);
}
