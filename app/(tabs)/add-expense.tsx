import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Transaction, saveTransaction } from '../utils/storage';
 
import Logo from '../../assets/images/Smartspend-logo.png';

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

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Education',
  'Other',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Bonus',
  'Interest',
  'Investment',
  'Gift',
  'Refund',
  'Rental Income',
  'Freelance',
  'Other Income',
];

export default function AddExpenseScreen() {
  const router = useRouter();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [payment, setPayment] = useState<'cash' | 'card' | ''>('');

  // Dynamically choose categories based on type
  const CATEGORIES = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // When type changes, ensure category is valid for the new list
  useEffect(() => {
    if (!CATEGORIES.includes(category)) {
      setCategory(CATEGORIES[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const submit = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    const tx: Transaction = {
      id: Date.now().toString(),
      type,
      category,
      description: description?.trim(),
      amount: val,
      date: date.toISOString(),
    };

    try {
      await saveTransaction(tx);
      router.back();
    } catch (e) {
      Alert.alert('Save failed', 'Could not save the transaction.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header with BIG logo */}
      <View style={styles.header}>
        <Image source={Logo} style={{ width: 250, height: 100 }} resizeMode="contain" />
        <Text style={styles.headerSub}>Add New {type === 'income' ? 'Income' : 'Expense'}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 16 }}>
        {/* Type toggle */}
        <View style={styles.card}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.segment}>
            <SegmentBtn
              text="Expense"
              active={type === 'expense'}
              onPress={() => setType('expense')}
            />
            <SegmentBtn
              text="Income"
              active={type === 'income'}
              onPress={() => setType('income')}
            />
          </View>
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.dollar}>$</Text>
            <TextInput
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              style={styles.amountInput}
            />
          </View>
        </View>

        {/* Category (dynamic) */}
        <View style={styles.card}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Chip key={c} text={c} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder={type === 'income' ? 'What is the income source?' : 'What did you spend on?'}
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />
        </View>

        {/* Date + Payment */}
        <View style={styles.grid2}>
          <View style={styles.card}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.input}>
              <Text>{formatInputDate(date)}</Text>
            </View>
            {/* Hook up a date picker later if you want */}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.segment}>
              <SegmentBtn text="Cash" active={payment === 'cash'} onPress={() => setPayment('cash')} />
              <SegmentBtn text="Card" active={payment === 'card'} onPress={() => setPayment('card')} />
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity onPress={submit} style={styles.primaryBtn} activeOpacity={0.8}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Add Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.secondaryBtn} activeOpacity={0.8}>
          <Text style={{ color: '#374151', fontWeight: '700' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* helpers + ui bits */

function formatInputDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function SegmentBtn({ text, active, onPress }:{ text:string; active?:boolean; onPress:()=>void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{text}</Text>
    </TouchableOpacity>
  );
}

function Chip({ text, active, onPress }:{ text:string; active?:boolean; onPress:()=>void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.chip, { backgroundColor: active ? colors.primary : '#F3F4F6' }]}>
        <Text style={{ color: active ? '#fff' : '#374151', fontSize: 12, fontWeight: '600' }}>{text}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* styles */

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

  card: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16 },
  label: { fontSize: 12, color: colors.text, fontWeight: '600', marginBottom: 6 },

  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  dollar: { fontSize: 18, color: colors.subtext, marginRight: 6 },
  amountInput: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },

  input: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },

  grid2: { flexDirection: 'row', gap: 12 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 6 },

  segment: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4 },
  segmentBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  segmentBtnActive: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  segmentText: { fontWeight: '600', color: '#374151' },
  segmentTextActive: { color: colors.primary },

  primaryBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  secondaryBtn: { backgroundColor: '#F3F4F6', padding: 14, borderRadius: 10, alignItems: 'center' },
});
