const AuthService = require('../services/AuthService');

exports.register = async (req, res) => {
  try {
    const user = await AuthService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user
    });
  } catch (err) {
    console.error('[UserController - Register]', err.message);
    const statusCode = err.message.includes('obligatorios') || err.message.includes('registrado') ? 400 : 500;
    res.status(statusCode).json({ success: false, error: err.message || 'Error interno del servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await AuthService.loginUser(req.body);
    res.json({
      success: true,
      ...data
    });
  } catch (err) {
    console.error('[UserController - Login]', err.message);
    const statusCode = err.message.includes('Credenciales') ? 401 : 400;
    res.status(statusCode).json({ success: false, error: err.message || 'Error interno del servidor' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await AuthService.deleteUser(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('[UserController - Delete]', err.message);
    const statusCode = err.message.includes('encontrado') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: err.message || 'Error interno del servidor' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await AuthService.updateUser(req.params.id, req.body);
    res.json({ success: true, message: 'Usuario actualizado exitosamente', user });
  } catch (err) {
    console.error('[UserController - Update]', err.message);
    let statusCode = 500;
    if (err.message.includes('encontrado')) statusCode = 404;
    if (err.message.includes('registrado')) statusCode = 400;
    res.status(statusCode).json({ success: false, error: err.message || 'Error interno del servidor' });
  }
};

exports.getMe = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token no proporcionado' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const user = await AuthService.getMe(token);
    res.json({ success: true, user });
  } catch (err) {
    console.error('[UserController - getMe]', err.message);
    const statusCode = err.message.includes('inválido') ? 401 : 404;
    res.status(statusCode).json({ success: false, error: err.message || 'Error interno del servidor' });
  }
};
