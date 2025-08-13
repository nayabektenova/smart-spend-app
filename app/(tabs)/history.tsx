import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../assets/images/Smartspend-logo.png';
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
};

type RangeKey = 'all' | 'week' | 'month';

export default function HistoryScreen() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [range, setRange] = useState<RangeKey>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [category, setCategory] = useState<string>(''); // '' = all

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const data = await getTransactions();
        if (alive) setTxs(data);
      })();
      return () => { alive = false; };
    }, [])
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = startOfWeek(now);
  const fromDate = range === 'all' ? new Date(2000, 0, 1) : range === 'week' ? weekStart : monthStart;
  const toDate = now;

  // Unique categories for chips 
  const categories = useMemo(() => {
    const set = new Set<string>();
    txs.forEach(t => t.category && set.add(t.category));
    return Array.from(set).sort();
  }, [txs]);

  // Apply filters
  const filtered = useMemo(() => {
    return txs.filter(t => {
      const d = new Date(t.date);
      const inRange = d >= stripTime(fromDate) && d <= endOfDay(toDate);
      const catOK = !category || (t.category || '').toLowerCase() === category.toLowerCase();
      const typeOK = typeFilter === 'all' ? true : t.type === typeFilter;
      return inRange && catOK && typeOK;
    });
  }, [txs, fromDate, toDate, category, typeFilter]);

  // Summary values based on filtered list (both types)
  const totalSpent = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // ----- Expense statistics (based on filtered results, expenses only) -----
  const {
    expenseTxs,
    expenseTotal,
    expenseCount,
    avgExpense,
    largestExpense,
    dailyAvg,
    perCategory,
    topCategories,
    uniqueCatCount,
  } = useMemo(() => {
    const e = filtered.filter(t => t.type === 'expense');
    const total = e.reduce((s, t) => s + t.amount, 0);
    const count = e.length;
    const avg = count ? total / count : 0;

    // days in selected range (inclusive)
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.max(1, Math.ceil((stripTime(toDate).getTime() - stripTime(fromDate).getTime()) / msPerDay) + 1);
    const daily = total / days;

    // largest expense
    let largest: Transaction | null = null;
    for (const t of e) {
      if (!largest || t.amount > largest.amount) largest = t;
    }

    // per-category totals
    const map = new Map<string, number>();
    for (const t of e) {
      const key = t.category?.trim() || 'Uncategorized';
      map.set(key, (map.get(key) || 0) + t.amount);
    }
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const unique = entries.length;

    // show top 6 categories (or fewer)
    const top = entries.slice(0, 6);

    return {
      expenseTxs: e,
      expenseTotal: total,
      expenseCount: count,
      avgExpense: avg,
      largestExpense: largest,
      dailyAvg: daily,
      perCategory: entries,
      topCategories: top,
      uniqueCatCount: unique,
    };
  }, [filtered, fromDate, toDate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header with BIG logo */}
        <View style={styles.header}>
          <Image source={Logo} style={{ width: 250, height: 100 }} resizeMode="contain" />
          <Text style={styles.headerSub}>Transaction History</Text>
        </View>

      <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 20 }}>
        {/* Filters */}
        <View style={styles.card}>
          <Text style={styles.h3}>Filters</Text>

          {/* Date range display (auto from system) */}
          <View style={styles.grid2}>
            <Field label="From" value={formatInputDate(fromDate)} />
            <Field label="To" value={formatInputDate(toDate)} />
          </View>

          {/* Quick range chips */}
          <View style={styles.chipRow}>
            <Chip text="All" active={range==='all'} onPress={() => setRange('all')} />
            <Chip text="This Week" active={range==='week'} onPress={() => setRange('week')} />
            <Chip text="This Month" active={range==='month'} onPress={() => setRange('month')} />
          </View>

          {/* Type chips */}
          <View style={[styles.chipRow, { marginTop: 8 }]}>
            <Chip text="All Types" active={typeFilter==='all'} onPress={() => setTypeFilter('all')} />
            <Chip text="Expenses Only" active={typeFilter==='expense'} onPress={() => setTypeFilter('expense')} />
            <Chip text="Income Only" active={typeFilter==='income'} onPress={() => setTypeFilter('income')} />
          </View>

          {/* Category chips (from data) */}
          {!!categories.length && (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Category</Text>
              <View style={styles.chipRow}>
                <Chip text="All Categories" active={!category} onPress={() => setCategory('')} />
                {categories.map(c => (
                  <Chip key={c} text={c} active={category.toLowerCase()===c.toLowerCase()} onPress={() => setCategory(c)} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Summary (quick stats for the filtered list) */}
        <View style={styles.grid2}>
          <View style={styles.card}>
            <Text style={styles.sub}>Total Spent</Text>
            <Text style={[styles.total, { color: colors.danger }]}>-${totalSpent.toFixed(2)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sub}>Transactions</Text>
            <Text style={styles.total}>{filtered.length}</Text>
          </View>
        </View>

        {/* 🔎 Expense Statistics */}
        <View style={styles.card}>
          <Text style={styles.h3}>Expense Statistics</Text>

          <View style={styles.grid2}>
            <StatTile label="Avg per Expense" value={`$${avgExpense.toFixed(2)}`} />
            <StatTile label="Daily Avg Spend" value={`$${dailyAvg.toFixed(2)}`} />
          </View>

          <View style={styles.grid2}>
            <StatTile
              label="Largest Expense"
              value={
                expenseCount
                  ? `-$${(largestExpense?.amount ?? 0).toFixed(2)}`
                  : '$0.00'
              }
              subText={
                largestExpense
                  ? `${largestExpense.category || 'Expense'} • ${formatDate(largestExpense.date)}`
                  : undefined
              }
            />
            <StatTile label="Expense Categories" value={`${uniqueCatCount}`} />
          </View>

          {/* Category breakdown */}
          {!!expenseTxs.length && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.label, { marginBottom: 6 }]}>By Category</Text>
              {topCategories.map(([cat, amt], idx) => {
                const pct = expenseTotal > 0 ? (amt / expenseTotal) * 100 : 0;
                return (
                  <View key={cat} style={{ marginBottom: 10 }}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.bold}>{cat}</Text>
                      <Text style={styles.subSmall}>
                        ${amt.toFixed(2)} • {pct.toFixed(0)}%
                      </Text>
                    </View>
                    <View style={styles.catBarTrack}>
                      <View style={[styles.catBarFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })}
              {perCategory.length > topCategories.length && (
                <Text style={[styles.subSmall, { marginTop: 2 }]}>
                  + {perCategory.length - topCategories.length} more
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Transaction List */}
        <View style={styles.card}>
          <Text style={styles.h3}>Results</Text>
          {filtered.map((t, idx) => (
            <View key={t.id}>
              <View style={styles.txnRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[
                    styles.emojiCircle,
                    { backgroundColor: t.type === 'income' ? '#DCFCE7' : '#FEE2E2' },
                  ]}>
                    <Text>{pickEmoji(t.category, t.type)}</Text>
                  </View>
                  <View>
                    <Text style={styles.bold}>{t.category || (t.type === 'income' ? 'Income' : 'Expense')}</Text>
                    <Text style={styles.subSmall}>{formatDate(t.date)}</Text>
                  </View>
                </View>
                <Text style={{ fontWeight: '700', color: t.type === 'income' ? '#065F46' : colors.danger }}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                </Text>
              </View>
              {idx < filtered.length - 1 && <View style={styles.divider} />}
            </View>
          ))}

          <TouchableOpacity style={styles.loadMore}>
            <Text style={{ color: colors.primary, fontWeight: '600', marginTop: 16 }}>Load More Transactions</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----- Small UI bits ----- */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.input}><Text style={styles.text}>{value}</Text></View>
    </View>
  );
}

function Chip({ text, active, onPress }:{ text:string; active?:boolean; onPress?:()=>void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.chip, { backgroundColor: active ? colors.primary : '#F3F4F6' }]}>
        <Text style={{ color: active ? '#fff' : '#374151', fontSize: 12, fontWeight: '600' }}>{text}</Text>
      </View>
    </TouchableOpacity>
  );
}

function StatTile({ label, value, subText }: { label: string; value: string | number; subText?: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.sub}>{label}</Text>
      <Text style={styles.total}>{value}</Text>
      {!!subText && <Text style={[styles.subSmall, { marginTop: 2 }]}>{subText}</Text>}
    </View>
  );
}

/* ----- helpers ----- */

function pickEmoji(category?: string, type?: string) {
  const key = (category || '').toLowerCase();
  if (type === 'income') return '💰';
  if (key.includes('food') || key.includes('dining')) return '🍕';
  if (key.includes('coffee')) return '☕';
  if (key.includes('transport') || key.includes('gas')) return '⛽';
  if (key.includes('shop')) return '🛍️';
  if (key.includes('entertain')) return '🎬';
  if (key.includes('grocery')) return '🏪';
  return '💳';
}

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}
function formatInputDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

function startOfWeek(d: Date) {
  const tmp = new Date(d);
  const day = (tmp.getDay()+6) % 7; // make Monday=0
  tmp.setDate(tmp.getDate() - day);
  return stripTime(tmp);
}
function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
}

/* ----- styles ----- */

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: { fontSize: 12, color: colors.subtext, marginTop: 2 },

  h3: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  sub: { fontSize: 12, color: colors.subtext },
  subSmall: { fontSize: 12, color: colors.subtext },
  text: { fontSize: 14, color: colors.text },
  bold: { fontSize: 14, color: colors.text, fontWeight: '700' },
  total: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  label: { fontSize: 12, color: colors.text, fontWeight: '600', marginBottom: 6 },

  card: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16 },
  grid2: { flexDirection: 'row', gap: 12, marginTop: 8 },
  input: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minWidth: 140 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },

  // stats tiles
  statTile: { flex: 1, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 12 },

  // category bars
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBarTrack: { height: 10, borderRadius: 999, backgroundColor: '#E5E7EB', marginTop: 6, overflow: 'hidden' },
  catBarFill: { height: 10, borderRadius: 999, backgroundColor: colors.primary },

  // list
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  emojiCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  divider: { height: 1, backgroundColor: colors.border },
  loadMore: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
});
