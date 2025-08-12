// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { getSession } from '../utils/auth';

const UI = {
  primary: '#10B981',
  subtext: '#6B7280',
  card: '#FFFFFF',
  border: '#E5E7EB',
};

export default function TabsLayout() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    const checkSession = async () => {
      const session = await getSession();
      if (alive && !session) router.replace('/login');
    };

    checkSession();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkSession();
    });

    return () => {
      alive = false;
      sub.remove();
    };
  }, [router]);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: UI.primary,
        tabBarInactiveTintColor: UI.subtext,
        tabBarStyle: {
          backgroundColor: UI.card,
          borderTopColor: UI.border,
        },
        // avoids translucent white bleed on iOS
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: UI.card }]} />
        ),
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icon =
            route.name === 'home'
              ? (focused ? 'home' : 'home-outline')
              : route.name === 'history'
              ? (focused ? 'time' : 'time-outline')
              : route.name === 'add-expense'
              ? (focused ? 'add-circle' : 'add-circle-outline')
              : route.name === 'profile'
              ? (focused ? 'person' : 'person-outline')
              : 'ellipse-outline';
          return <Ionicons name={icon as any} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="add-expense" options={{ title: 'Add' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
