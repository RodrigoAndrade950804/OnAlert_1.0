const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onalert_incidents';
    await mongoose.connect(MONGO_URI);
    console.log('? Conectado a MongoDB');
  } catch (err) {
    console.error('? Error al conectar a MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
