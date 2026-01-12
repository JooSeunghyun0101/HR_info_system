
import dns from 'node:dns';
import 'dotenv/config';

// extract host from DATABASE_URL
const url = process.env.DATABASE_URL || '';
const match = url.match(/@([^:/]+)/);
if (match) {
    const host = match[1];
    console.log('Resolving host:', host);

    console.log('Lookup (default):');
    dns.lookup(host, { all: true }, (err, addresses) => {
        if (err) console.error(err);
        else console.log('Addresses:', addresses);
    });
} else {
    console.log('Could not parse host from DATABASE_URL');
}
