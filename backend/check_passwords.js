require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const POSTGRES_URI = process.env.DATABASE_URL || 'postgres://onalert_admin:admin_password@localhost:5433/onalert_auth';

async function checkDatabases() {
  const sequelize = new Sequelize(POSTGRES_URI, { logging: false });
  try {
    await sequelize.authenticate();
    const [users] = await sequelize.query('SELECT id, name, email, password FROM users');
    console.table(users);
  } catch (err) {
    console.error('Error en Postgres:', err.message);
  } finally {
    await sequelize.close();
  }
}
checkDatabases();
