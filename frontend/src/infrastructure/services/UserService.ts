import AsyncStorage from '@react-native-async-storage/async-storage';
import {  User, UserRole  } from '@onalert/shared';

const USERS_KEY = '@onalert_v2_users_list';

export class UserService {
  static async getAllUsers(): Promise<User[]> {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  static async saveUsers(users: User[]): Promise<void> {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  static async createUser(user: User): Promise<void> {
    const users = await this.getAllUsers();
    users.push(user);
    await this.saveUsers(users);
  }

  static async deleteUser(userId: string): Promise<void> {
    let users = await this.getAllUsers();
    users = users.filter((u) => u.id !== userId);
    await this.saveUsers(users);
  }

  static async updateUser(userId: string, data: Partial<User>): Promise<void> {
    let users = await this.getAllUsers();
    users = users.map((u) => (u.id === userId ? { ...u, ...data } : u));
    await this.saveUsers(users);
  }

  static async getUsersByRole(role: UserRole): Promise<User[]> {
    const users = await this.getAllUsers();
    return users.filter((u) => u.role === role);
  }

  static async getUsersByCommunity(community: string): Promise<User[]> {
    const users = await this.getAllUsers();
    return users.filter((u) => u.community === community);
  }
}
