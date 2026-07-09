require('dotenv').config({ path: 'user-service/.env' });
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'onalert_super_secret_jwt_key_123';

const token = jwt.sign({
  id: '5cc9219a-80e1-4f99-9212-6b76ad9b7794', // admin id
  name: 'admin',
  role: 'ADMIN',
  tenant_id: '123',
  community: 'test'
}, JWT_SECRET, { expiresIn: '24h' });

const testMe = async () => {
  const meRes = await fetch('http://localhost:8000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Me status:', meRes.status);
  const meData = await meRes.json();
  console.log('Me data:', meData);
};
testMe();
