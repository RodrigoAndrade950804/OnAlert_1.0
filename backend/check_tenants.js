const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://onalert_admin:admin_password@localhost:5433/onalert_auth', { logging: false });
sequelize.query('SELECT * FROM tenants').then(res => {
  console.log(res[0]);
  process.exit(0);
});
