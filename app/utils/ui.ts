// app/utils/ui.ts
export const colors = {
  primary: '#10B981',
  secondary: '#059669',
  accent: '#34D399',
  danger: '#EF4444',
  warning: '#F59E0B',
  border: '#E5E7EB',
  text: '#111827',
  subtext: '#6B7280',
  bg: '#F9FAFB',
  white: '#FFFFFF',
};

export const card = {
  backgroundColor: colors.white,
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: 16,
  padding: 16,
};

export const header = {
  container: {
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.subtext, marginTop: 2 },
};
