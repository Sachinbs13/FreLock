// Test-only stand-in for bcryptjs (sha256, NOT secure).
const crypto = require('crypto');
const h = (s) => 'h$' + crypto.createHash('sha256').update(String(s)).digest('hex');
module.exports = { hash: async (s) => h(s), compare: async (s, hash) => { if (typeof s !== 'string') throw new Error('Illegal arguments'); return h(s) === hash; } };
