const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://onalert_admin:admin_password@localhost:5433/onalert_auth', { logging: false });
sequelize.query('SELECT u.name, u.role, u.email, ut.tenant_id FROM users u LEFT JOIN user_tenants ut ON u.id = ut.user_id').then(res => {
  console.table(res[0]);
  process.exit(0);
});
