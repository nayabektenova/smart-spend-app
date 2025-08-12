import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentUser } from '../utils/auth';
import { getTransactions, Transaction } from '../utils/storage';

const colors = {
  primary: '#10B981',
  secondary: '#059669',
  border: '#E5E7EB',
  text: '#111827',
  subtext: '#6B7280',
  bg: '#F9FAFB',
  white: '#FFFFFF',
  danger: '#EF4444',
  success: '#065F46',
};

export default function HomeScreen() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [name, setName] = useState<string>('User');

  // Initial load (runs once on mount)
  useEffect(() => {
    let alive = true;
    (async () => {
      const u = await getCurrentUser();
      if (alive && u?.name) setName(u.name);

      const list = await getTransactions();
      if (alive) setTxs(list);
    })();
    return () => { alive = false; };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const list = await getTransactions();
        if (alive) setTxs(list);
      })();
      return () => { alive = false; };
    }, [])
  );

  const { balance, income, expense } = useMemo(() => {
    const now = new Date();
    let _income = 0, _expense = 0, _balance = 0;
    for (const t of txs) {
      const d = new Date(t.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        if (t.type === 'income') _income += t.amount;
        else _expense += t.amount;
      }
      _balance += t.type === 'income' ? t.amount : -t.amount;
    }
    return { balance: _balance, income: _income, expense: _expense };
  }, [txs]);

  const totalMoved = Math.max(income + expense, 1);
  const spentPct = Math.min((expense / totalMoved) * 100, 100);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image
            source={require('../../assets/images/Smartspend-logo-small.png')}
            style={{ width: 48, height: 48, borderRadius: 16 }}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>SmartSpend</Text>
            <Text style={styles.headerSub}>Personal Expense Tracker</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 16 }}>
        <View>
          <Text style={styles.h2}>Welcome back, {name}!</Text>
          <Text style={styles.sub}>Here’s a summary of your spending this month</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <Text style={{ color: '#fff', opacity: 0.9 }}>Current Balance</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 }}>
            ${balance.toFixed(2)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.card, { flex: 1, backgroundColor: '#ECFDF5' }]}>
            <Text style={{ color: colors.success, fontSize: 12 }}>Income (this month)</Text>
            <Text style={{ color: colors.success, fontSize: 20, fontWeight: '700' }}>
              ${income.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, backgroundColor: '#FEF2F2' }]}>
            <Text style={{ color: '#991B1B', fontSize: 12 }}>Expenses (this month)</Text>
            <Text style={{ color: '#991B1B', fontSize: 20, fontWeight: '700' }}>
              ${expense.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.h3}>Monthly Activity</Text>
            <Text style={styles.sub}>{spentPct.toFixed(0)}% spent</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${spentPct}%` }]} />
          </View>
          <View style={[styles.rowBetween, { marginTop: 6 }]}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              ${Math.max(income - expense, 0).toFixed(2)} remaining from income
            </Text>
            <Text style={styles.sub}>
              ${expense.toFixed(2)} / ${totalMoved.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.h3}>Recent Transactions</Text>
            <Link href="/history" asChild>
              <TouchableOpacity><Text style={styles.link}>View All</Text></TouchableOpacity>
            </Link>
          </View>

          <View style={{ marginTop: 8 }}>
            {txs.slice(0, 8).map((t) => (
              <View key={t.id}>
                <View style={styles.txnRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={[
                        styles.emojiCircle,
                        { backgroundColor: t.type === 'income' ? '#DCFCE7' : '#FEE2E2' },
                      ]}
                    >
                      <Text style={{ fontSize: 14 }}>{pickEmoji(t.category, t.type)}</Text>
                    </View>
                    <View>
                      <Text style={styles.bold}>{t.category || (t.type === 'income' ? 'Income' : 'Expense')}</Text>
                      <Text style={styles.subSmall}>{formatDate(t.date)}</Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      fontWeight: '700',
                      color: t.type === 'income' ? colors.success : colors.danger,
                    }}
                  >
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.divider} />
              </View>
            ))}
          </View>

          <Link href="/add-expense" asChild>
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Add Transaction</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

function pickEmoji(category?: string, type?: string) {
  const key = (category || '').toLowerCase();
  if (type === 'income') return '💰';
  if (key.includes('food') || key.includes('dining')) return '🍕';
  if (key.includes('coffee')) return '☕';
  if (key.includes('transport') || key.includes('gas')) return '⛽';
  if (key.includes('shop')) return '🛍️';
  if (key.includes('entertain')) return '🎬';
  if (key.includes('grocery')) return '🏪';
  if (key.includes('health')) return '🏥';
  if (key.includes('util')) return '💡';
  return '💳';
}

function formatDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString();
  } catch {
    return d;
  }
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 12, color: colors.subtext, marginTop: 2 },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  h3: { fontSize: 16, fontWeight: '700', color: colors.text },
  bold: { fontSize: 14, color: colors.text, fontWeight: '700' },
  sub: { fontSize: 12, color: colors.subtext },
  subSmall: { fontSize: 12, color: colors.subtext },
  card: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 999, marginTop: 10 },
  fill: { height: 12, borderRadius: 999, backgroundColor: colors.primary },
  txnRow: { paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: colors.border },
  emojiCircle: { width: 40, height: 40, borderRadius: 20, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  link: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  primaryBtn: { marginTop: 12, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});
