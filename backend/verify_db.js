require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const mongoose = require('mongoose');

const POSTGRES_URI = process.env.DATABASE_URL || 'postgres://onalert_admin:admin_password@localhost:5433/onalert_auth';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onalert_incidents';

async function checkDatabases() {
  console.log('--- Verificando PostgreSQL ---');
  const sequelize = new Sequelize(POSTGRES_URI, { logging: false });
  try {
    await sequelize.authenticate();
    const [users] = await sequelize.query('SELECT id, name, email, role FROM users');
    console.log('Usuarios encontrados:', users.length);
    console.table(users);
  } catch (err) {
    console.error('Error en Postgres:', err.message);
  } finally {
    await sequelize.close();
  }

  console.log('\n--- Verificando MongoDB ---');
  try {
    await mongoose.connect(MONGO_URI);
    const incidents = await mongoose.connection.collection('incidents').find({}).toArray();
    console.log('Incidentes encontrados:', incidents.length);
    console.table(incidents.map(i => ({ 
      id: i._id, 
      title: i.title, 
      status: i.status, 
      reporter: i.reporter_name 
    })));
  } catch (err) {
    console.error('Error en MongoDB:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabases();
