import {  User  } from '@onalert/shared';
import { getApiGatewayUrl } from '@onalert/shared';
import { saveUser, saveToken } from '@onalert/shared';
import { UserService } from './UserService';

export class AuthService {
  static async login(email: string, password: string): Promise<{ user: User; token: string | null; isOffline: boolean }> {
    const API_GATEWAY_URL = getApiGatewayUrl();
    const cleanEmail = email.toLowerCase().trim();

    // Súper Administrador Hardcoded Offline-First
    if (cleanEmail === 'rodrigo@onalert.com' && password === 'rodrigo123') {
      const superAdminUser: User = {
        id: 'superadmin_1',
        name: 'Rodrigo Andrade',
        email: cleanEmail,
        role: 'superadmin',
        community: 'Global'
      };
      await saveUser(superAdminUser);
      return { user: superAdminUser, token: null, isOffline: true };
    }

    try {
      console.log('🌐 Intentando login en servidor central...');
      const loginRes = await fetch(`${API_GATEWAY_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      if (loginRes.ok) {
        const authData = await loginRes.json();
        const authenticatedUser: User = {
          id: authData.user.id,
          name: authData.user.name,
          email: cleanEmail,
          role: authData.user.role.toLowerCase(),
          community: authData.user.community
        };
        await saveUser(authenticatedUser);
        if (authData.token) {
          await saveToken(authData.token);
        }
        console.log('✅ Login exitoso en la nube. Token JWT guardado.');
        return { user: authenticatedUser, token: authData.token, isOffline: false };
      } else {
        throw new Error('Credenciales incorrectas o usuario no encontrado');
      }
    } catch (err: any) {
      console.warn('⚠️ Fallo en el login de red:', err.message);
      
      try {
        // Simulación de login offline para usuarios creados localmente
        const localUsers = await UserService.getAllUsers();
        const foundUser = localUsers.find((u: User) => u.email === cleanEmail);
        
        if (foundUser) {
          console.log('✅ Login offline exitoso (Mock Local).');
          await saveUser(foundUser);
          return { user: foundUser, token: null, isOffline: true };
        }
      } catch(e) {
        console.warn('Error leyendo localUsers', e);
      }

      // Simulación de login offline genérico para demo
      if (password === 'demo123') {
        const demoUser: User = {
          id: `demo_${Date.now()}`,
          name: email.split('@')[0],
          email: cleanEmail,
          role: 'vecino',
          community: 'Carapungo'
        };
        await saveUser(demoUser);
        return { user: demoUser, token: null, isOffline: true };
      }
      throw new Error('Credenciales incorrectas o usuario no registrado localmente.');
    }
  }
}
