const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEMO_USERS = [
  { id: 'admin', email: 'admin@escrow.com', password: 'Admin@FintechEL2026', role: 'Admin', name: 'Platform Admin' },
  { id: 'user1', email: 'client@escrow.com', password: 'client123', role: 'Client', name: 'Demo Client' },
  { id: 'user2', email: 'freelancer@escrow.com', password: 'freelancer123', role: 'Freelancer', name: 'Demo Freelancer' },
  { id: 'user3', email: 'client2@escrow.com', password: 'client123', role: 'Client', name: 'Demo Client 2' },
];

// Seeds demo accounts only when the users collection is empty.
// Set SEED_DEMO_USERS=false to disable (e.g. in production).
const seedUsers = async () => {
  if (String(process.env.SEED_DEMO_USERS).toLowerCase() === 'false') return;

  const count = await User.countDocuments();
  if (count > 0) return;

  const hashedUsers = await Promise.all(
    DEMO_USERS.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
      status: 'ACTIVE',
    }))
  );

  await User.insertMany(hashedUsers);
  console.log('Demo users seeded');
};

module.exports = seedUsers;
