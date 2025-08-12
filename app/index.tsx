import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getSession } from './utils/auth';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session) router.replace('/(tabs)/home');
      else router.replace('/signup');
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
