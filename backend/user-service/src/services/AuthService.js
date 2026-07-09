const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, User, Tenant, UserTenant } = require('../../models');

const JWT_SECRET = process.env.JWT_SECRET || 'onalert_super_secret_jwt_key_123';

class AuthService {
  static async registerUser({ email, password, name, role, communityName }) {
    if (!email || !password || !name || !communityName) {
      throw new Error('Todos los campos son obligatorios');
    }

    const transaction = await sequelize.transaction();
    try {
      const [tenant] = await Tenant.findOrCreate({
        where: { name: communityName },
        defaults: { name: communityName, subscription_plan: 'comunitario_basic' },
        transaction
      });

      const existingUser = await User.findOne({ where: { email }, transaction });
      if (existingUser) {
        throw new Error('El correo electrónico ya está registrado');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        name,
        password_hash: passwordHash,
        role: role || 'vecino',
        status: 'activo'
      }, { transaction });

      await UserTenant.create({
        user_id: user.id,
        tenant_id: tenant.id,
        role_in_tenant: role || 'vecino'
      }, { transaction });

      await transaction.commit();

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async loginUser({ email, password }) {
    if (!email || !password) {
      throw new Error('El correo y la contraseña son obligatorios');
    }

    const user = await User.findOne({
      where: { email },
      include: [Tenant]
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Credenciales inválidas');
    }

    const tenant = user.Tenants[0];
    if (!tenant) {
      throw new Error('Usuario no asociado a ninguna comunidad');
    }

    const payload = {
      sub: user.id,
      name: user.name,
      role: user.role.toUpperCase(),
      tenant_id: tenant.id,
      community: tenant.name
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        community: tenant.name,
        tenant_id: tenant.id
      }
    };
  }

  static async deleteUser(id) {
    await UserTenant.destroy({ where: { user_id: id } });
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) {
      throw new Error('Usuario no encontrado');
    }
    return true;
  }

  static async updateUser(id, { name, email, role }) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new Error('El correo electrónico ya está registrado por otro usuario');
      }
    }

    await user.update({ 
      name: name || user.name, 
      email: email || user.email, 
      role: role || user.role 
    });
    
    return user;
  }

  static async getMe(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.sub);
      if (!user) {
        throw new Error('El usuario ya no existe en la base de datos');
      }
      
      const userTenant = await UserTenant.findOne({ where: { user_id: user.id } });
      let communityName = 'Desconocida';
      let tenant_id = null;
      if (userTenant) {
        tenant_id = userTenant.tenant_id;
        const tenant = await Tenant.findByPk(tenant_id);
        if (tenant) communityName = tenant.name;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        community: communityName,
        tenant_id: tenant_id
      };
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        throw new Error('Token inválido o expirado');
      }
      throw err;
    }
  }
}

module.exports = AuthService;
