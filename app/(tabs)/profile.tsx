// app/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser, getSession, signOut, updateUser } from '../utils/auth';

const CURRENCY_KEY = 'pref_currency';
const WEEKSTART_KEY = 'pref_weekstart';           // 'Mon' | 'Sun'
const CONFIRM_DELETE_KEY = 'pref_confirm_delete'; // 'true' | 'false'

const colors = {
  primary: '#10B981',
  secondary: '#059669',
  border: '#E5E7EB',
  text: '#111827',
  subtext: '#6B7280',
  bg: '#F9FAFB',
  white: '#FFFFFF',
  danger: '#EF4444',
  card: '#FFFFFF',
  shadow: 'rgba(17,24,39,0.06)',
  inputBg: '#F3F4F6',
};

type Currency = 'CAD' | 'USD' | 'EUR';
type WeekStart = 'Mon' | 'Sun';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // preferences
  const [currency, setCurrency] = useState<Currency>('CAD');
  const [weekStart, setWeekStart] = useState<WeekStart>('Mon');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(true);

  // FAQ open state (multi-expand)
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set());

  const appVersion =
    (Constants?.expoConfig as any)?.version ||
    (Constants as any)?.manifest?.version ||
    '1.0.0';

  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
        if (u) {
          setName(u.name ?? '');
          setEmail(u.email ?? '');
        }
        const savedCurrency = await AsyncStorage.getItem(CURRENCY_KEY);
        if (savedCurrency === 'CAD' || savedCurrency === 'USD' || savedCurrency === 'EUR') {
          setCurrency(savedCurrency);
        }
        const savedWeekStart = await AsyncStorage.getItem(WEEKSTART_KEY);
        if (savedWeekStart === 'Mon' || savedWeekStart === 'Sun') {
          setWeekStart(savedWeekStart);
        }
        const savedConfirm = await AsyncStorage.getItem(CONFIRM_DELETE_KEY);
        if (savedConfirm === 'true' || savedConfirm === 'false') {
          setConfirmDelete(savedConfirm === 'true');
        }
      } catch (e) {
        console.warn('Profile init error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);
      const current = await getSession();
      if (!current) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login');
        return;
      }
      await updateUser(current, { name: trimmed });
      await AsyncStorage.setItem(CURRENCY_KEY, currency);
      await AsyncStorage.setItem(WEEKSTART_KEY, weekStart);
      await AsyncStorage.setItem(CONFIRM_DELETE_KEY, String(confirmDelete));
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    } finally {
      router.replace('/login');
    }
  };

  const contactSupport = () => {
    const mailto =
      'mailto:support@smartspend.app?subject=SmartSpend%20Support&body=Hi%20SmartSpend%20team,%0D%0A%0D%0A';
    Linking.openURL(mailto).catch(() => {
      Alert.alert('Unable to open email app', 'Please email support@smartspend.app');
    });
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const initials = useMemo(() => {
    if (!name?.trim()) return 'S';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }, [name]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scroll, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Profile</Text>
      </View>

      {/* Account */}
      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Account</Text>
            <Text style={styles.cardSub}>{email || '—'}</Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            style={styles.input}
            placeholderTextColor={colors.subtext}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput value={email} editable={false} style={[styles.input, styles.inputDisabled]} />
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        {/* Currency */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Default Currency</Text>
            <Text style={styles.rowSub}>Used for budgets and summaries</Text>
          </View>
          <View style={styles.segment}>
            {(['CAD', 'USD', 'EUR'] as Currency[]).map((c) => (
              <SegmentBtn key={c} text={c} active={currency === c} onPress={() => setCurrency(c)} />
            ))}
          </View>
        </View>

        {/* Start week on */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Start Week On</Text>
            <Text style={styles.rowSub}>Controls calendar & weekly charts</Text>
          </View>
          <View style={styles.segment}>
            {(['Mon', 'Sun'] as WeekStart[]).map((d) => (
              <SegmentBtn key={d} text={d} active={weekStart === d} onPress={() => setWeekStart(d)} />
            ))}
          </View>
        </View>

        {/* Confirm before deleting */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Confirm Before Deleting</Text>
            <Text style={styles.rowSub}>Show a confirmation dialog on delete</Text>
          </View>
          <TouchableOpacity
            onPress={() => setConfirmDelete((v) => !v)}
            style={[styles.segmentBtn, confirmDelete && styles.segmentBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, confirmDelete && styles.segmentTextActive]}>
              {confirmDelete ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Support & About + FAQ */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Support & About</Text>

        <View style={styles.row}>
          <Text style={styles.rowTitle}>App Version</Text>
          <Text style={styles.cardSub}>{appVersion}</Text>
        </View>

        <TouchableOpacity onPress={contactSupport} style={[styles.button, styles.buttonGhost]}>
          <Text style={[styles.buttonText, { color: colors.primary }]}>Contact Support</Text>
        </TouchableOpacity>

        {/* FAQ */}
        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>FAQ</Text>

          {FAQ_ITEMS.map((item, idx) => {
            const open = openFaq.has(idx);
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity style={styles.faqQuestion} onPress={() => toggleFaq(idx)} activeOpacity={0.8}>
                  <Text style={styles.faqQText}>{item.q}</Text>
                  <Ionicons
                    name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
                    size={18}
                    color={colors.subtext}
                  />
                </TouchableOpacity>
                {open && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAText}>{item.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity
        disabled={saving}
        onPress={onSave}
        style={[styles.button, styles.buttonPrimary, saving && { opacity: 0.7 }]}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onLogout} style={[styles.button, styles.buttonDanger]}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Where is my data stored?',
    a: 'All transactions are stored locally on your device. You can export them as CSV from the History page (coming soon).',
  },
  {
    q: 'How do I edit or delete a transaction?',
    a: 'Open the History tab, tap a transaction, then choose Edit or Delete. If confirmations are enabled, you’ll see a prompt before deletion.',
  },
  {
    q: 'How do I change my default currency?',
    a: 'Use the Default Currency setting above and tap Save Changes. New summaries will use your chosen currency.',
  },
  {
    q: 'What happens if I reinstall the app?',
    a: 'Local data may be lost. We recommend exporting your transactions regularly so you can restore them later.',
  },
  {
    q: 'I forgot my password. What can I do?',
    a: 'From the login screen, use “Forgot password?” to reset it. If you still need help, tap Contact Support above.',
  },
];

function SegmentBtn({
  text,
  active,
  onPress,
}: {
  text: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  header: {
    alignItems: 'center',
    marginBottom: 8,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardSub: {
    fontSize: 13,
    color: colors.subtext,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: colors.subtext,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.inputBg,
    color: colors.text,
  },
  inputDisabled: {
    backgroundColor: colors.bg,
    color: colors.subtext,
  },
  row: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 2,
  },

  // buttons
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonGhost: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
  },

  // segmented control
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  segmentText: {
    fontWeight: '600',
    color: '#374151',
  },
  segmentTextActive: {
    color: colors.primary,
  },

  // FAQ
  faqItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
    paddingRight: 8,
  },
  faqAnswer: {
    marginTop: 6,
  },
  faqAText: {
    color: colors.subtext,
    fontSize: 13,
    lineHeight: 18,
  },
});
