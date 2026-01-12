
import dns from 'node:dns';

try {
    dns.setDefaultResultOrder('ipv4first');
    console.log('Applied DNS IPv4 First fix');
} catch (e) {
    console.log('Node version too old for dns.setDefaultResultOrder, ignoring.');
}
