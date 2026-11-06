// Test-only stand-in for jsonwebtoken (unsigned, NOT secure).
module.exports = { sign: (p) => Buffer.from(JSON.stringify(p)).toString('base64'), verify: (t) => JSON.parse(Buffer.from(t, 'base64').toString()) };
