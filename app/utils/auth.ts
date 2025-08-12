import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'ss_users';       // array of users
const SESSION_KEY = 'ss_session';   // email of logged-in user

export type User = { name: string; email: string; password: string };

// ---- helpers
const getUsers = async (): Promise<User[]> => {
  // migrate old single-user storage if it ever existed
  const arrRaw = await AsyncStorage.getItem(USERS_KEY);
  const arr = arrRaw ? (JSON.parse(arrRaw) as User[]) : [];
  return Array.isArray(arr) ? arr : [];
};

const setUsers = async (list: User[]) => {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(list));
};

export const findUser = async (email: string): Promise<User | undefined> => {
  const list = await getUsers();
  return list.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const createUser = async (user: User) => {
  const list = await getUsers();
  if (list.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
    throw new Error('Account already exists');
  }
  list.push(user);
  await setUsers(list);
};

export const updateUser = async (email: string, changes: Partial<User>) => {
  const list = await getUsers();
  const idx = list.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...changes, email: list[idx].email }; // email immutable
    await setUsers(list);
  }
};

// ---- session
export const setLoggedIn = async (email: string | null) => {
  if (email) await AsyncStorage.setItem(SESSION_KEY, email);
  else await AsyncStorage.removeItem(SESSION_KEY);
};

export const getSession = async (): Promise<string | null> => {
  return (await AsyncStorage.getItem(SESSION_KEY)) || null;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const email = await getSession();
  if (!email) return null;
  return (await findUser(email)) ?? null;
};

export const signOut = async () => setLoggedIn(null);
