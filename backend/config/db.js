const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Copy backend/.env.example to backend/.env and fill it in.');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected — database: ${mongoose.connection.name}`);
};

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, isDbConnected };
