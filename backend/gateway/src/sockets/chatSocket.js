const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'onalert_super_secret_jwt_key_123';

exports.setupSocketIO = (io) => {
  // Autenticación de Sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 Cliente conectado via WebSocket: ${socket.user.name} (Tenant: ${socket.user.tenant_id})`);
    
    // Unirse a la "sala" de la comunidad (tenant)
    socket.join(socket.user.tenant_id);

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.user.name}`);
    });

    // Relay de mensajes de chat en tiempo real
    socket.on('send_chat_message', (msgData) => {
      // Retransmitir a todos los demás en el mismo tenant
      socket.to(socket.user.tenant_id).emit('new_chat_message', msgData);
    });
  });
};
