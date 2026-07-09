const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('vecino', 'admin', 'guardia'),
    allowNull: false,
    defaultValue: 'vecino'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'activo'
  }
}, {
  tableName: 'users',
  timestamps: true
});

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  subscription_plan: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'comunitario_basic'
  }
}, {
  tableName: 'tenants',
  timestamps: true
});

// Relación muchos a muchos para multi-inquilino
const UserTenant = sequelize.define('UserTenant', {
  role_in_tenant: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'vecino'
  }
}, {
  tableName: 'user_tenants',
  timestamps: false
});

User.belongsToMany(Tenant, { through: UserTenant, foreignKey: 'user_id' });
Tenant.belongsToMany(User, { through: UserTenant, foreignKey: 'tenant_id' });

module.exports = {
  sequelize,
  User,
  Tenant,
  UserTenant
};
