const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, User, Tenant, UserTenant } = require('./models');

const app = express();
const PORT = process.env.PORT || 8001;
const JWT_SECRET = process.env.JWT_SECRET || 'onalert_super_secret_jwt_key_123';

app.use(cors());
app.use(express.json());

// Registro de Usuario
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role, communityName } = req.body;

  if (!email || !password || !name || !communityName) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const transaction = await sequelize.transaction();
  try {
    // Buscar o crear la comunidad (Tenant)
    const [tenant] = await Tenant.findOrCreate({
      where: { name: communityName },
      defaults: { name: communityName, subscription_plan: 'comunitario_basic' },
      transaction
    });

    // Validar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await User.create({
      email,
      name,
      password_hash: passwordHash,
      role: role || 'vecino',
      status: 'activo'
    }, { transaction });

    // Asociar usuario con la comunidad (Tenant)
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
});

// Login de Usuario
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'El correo y la contraseña son obligatorios' });
  }

  try {
    // Buscar usuario con su Tenant asociado
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

    const tenant = user.Tenants[0]; // Tomamos la primera comunidad asociada
    if (!tenant) {
      return res.status(400).json({ error: 'Usuario no asociado a ninguna comunidad' });
    }

    // Crear Payload del JWT
    const payload = {
      sub: user.id,
      name: user.name,
      role: user.role.toUpperCase(),
      tenant_id: tenant.id,
      community: tenant.name
    };

    // Firmar Token (1 día de expiración)
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
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'User Service' });
});

// Sincronizar Base de Datos y levantar servidor
sequelize.sync().then(() => {
  console.log('✅ Base de datos PostgreSQL sincronizada');
  app.listen(PORT, () => {
    console.log(`🚀 Servicio de Usuarios corriendo en puerto ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Error al sincronizar base de datos PostgreSQL:', err);
});
