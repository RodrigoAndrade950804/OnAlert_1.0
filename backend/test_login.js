const testLogin = async () => {
  try {
    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@onalert.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);
    
    if (loginData.token) {
      const meRes = await fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      console.log('Me status:', meRes.status);
      const meData = await meRes.json();
      console.log('Me data:', meData);
    }
  } catch(e) {
    console.error(e);
  }
};
testLogin();
