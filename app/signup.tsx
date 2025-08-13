// SmartSpend Tracker - React Native app for tracking expenses with add, view, and manage features.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUser, setLoggedIn } from './utils/auth';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Please fill all fields'); return;
    }
   await createUser({ name: name.trim(), email: email.trim(), password });
await setLoggedIn(email.trim()); 
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Image
            source={require('../assets/images/Smartspend-logo.png')}
            style={{ width: 300, height: 120, resizeMode: 'contain' }}
          />
        </View>

        <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 18,color: '#0f172a' }}>Create account</Text>

        <TextInput placeholder="Name" value={name} onChangeText={setName}
          style={styles.input} />
        <TextInput placeholder="Email" value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword}
          secureTextEntry style={styles.input} />

        <TouchableOpacity onPress={onSignup} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={{ color: '#0ea5e9' }}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  primaryBtn: {
  backgroundColor: '#10b981',
  padding: 16,
  borderRadius: 10,
  alignItems: 'center',
  marginTop: 6,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});


