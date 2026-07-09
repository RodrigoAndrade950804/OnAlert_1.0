const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, User, Tenant, UserTenant } = require('../../models');

const JWT_SECRET = process.env.JWT_SECRET || 'onalert_super_secret_jwt_key_123';

exports.register = async (req, res) => {
  const { email, password, name, role, communityName } = req.body;

  if (!email || !password || !name || !communityName) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
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
      await transaction.rollback();
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
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

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor al registrar el usuario' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'El correo y la contraseña son obligatorios' });
  }

  try {
    const user = await User.findOne({
      where: { email },
      include: [Tenant]
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tenant = user.Tenants[0];
    if (!tenant) {
      return res.status(400).json({ error: 'Usuario no asociado a ninguna comunidad' });
    }

    const payload = {
      sub: user.id,
      name: user.name,
      role: user.role.toUpperCase(),
      tenant_id: tenant.id,
      community: tenant.name
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        community: tenant.name,
        tenant_id: tenant.id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await UserTenant.destroy({ where: { user_id: id } });
    const deleted = await User.destroy({ where: { id } });
    if (deleted) {
      res.json({ message: 'Usuario eliminado exitosamente' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado por otro usuario' });
      }
    }

    await user.update({ 
      name: name || user.name, 
      email: email || user.email, 
      role: role || user.role 
    });
    
    res.json({ message: 'Usuario actualizado exitosamente', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

exports.getMe = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.sub);
    if (!user) {
      return res.status(404).json({ error: 'El usuario ya no existe en la base de datos' });
    }
    
    const userTenant = await UserTenant.findOne({ where: { user_id: user.id } });
    let communityName = 'Desconocida';
    if (userTenant) {
      const tenant = await Tenant.findByPk(userTenant.tenant_id);
      if (tenant) communityName = tenant.name;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        community: communityName,
        tenant_id: userTenant ? userTenant.tenant_id : null
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
