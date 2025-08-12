import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSession } from './auth';

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  method?: string;
  date: string; // ISO
};

// key is scoped to the logged-in email
const keyFor = (email: string | null) => `ss_transactions_${email ?? 'anon'}`;

export const getTransactions = async (): Promise<Transaction[]> => {
  const email = await getSession();
  const raw = await AsyncStorage.getItem(keyFor(email));
  try { return raw ? (JSON.parse(raw) as Transaction[]) : []; }
  catch { return []; }
};

export const saveTransaction = async (tx: Transaction) => {
  const email = await getSession();
  const list = await getTransactions();
  list.unshift(tx);
  await AsyncStorage.setItem(keyFor(email), JSON.stringify(list));
};

export const clearTransactions = async () => {
  const email = await getSession();
  await AsyncStorage.removeItem(keyFor(email));
};
