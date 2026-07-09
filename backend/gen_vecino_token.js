const jwt = require('jsonwebtoken');
const JWT_SECRET = 'onalert_super_secret_jwt_key_123';

const token = jwt.sign({
  sub: 'some-vecino-id',
  name: 'vecino_test',
  role: 'VECINO',
  tenant_id: '02cecc29-318e-43de-b60c-307c1a4ef43e', // Assuming same tenant ID
  community: 'Cochapamba'
}, JWT_SECRET, { expiresIn: '24h' });

console.log("TOKEN:", token);
