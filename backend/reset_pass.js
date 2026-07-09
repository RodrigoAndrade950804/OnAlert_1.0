require('dotenv').config({ path: 'user-service/.env' });
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

async function resetPass() {
  const hash = await bcrypt.hash('password123', 10);
  await sequelize.query(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@onalert.com'`);
  console.log('Password reset for admin@onalert.com to password123');
  await sequelize.close();
}
resetPass();
