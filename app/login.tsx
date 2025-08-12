import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { findUser, setLoggedIn } from './utils/auth';
import { StyleSheet } from 'react-native';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
  
    const saved = await findUser(email.trim());
if (!saved || saved.password !== password) { /* show error */ return; }
await setLoggedIn(saved.email);
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Image
            source={require('../assets/images/Smartspend-logo.png')}
            style={{ width: 300, height: 120, resizeMode: 'contain' }}
          />
        </View>

        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 16 }}>Welcome back</Text>

        <TextInput placeholder="Email" value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword}
          secureTextEntry style={styles.input} />

        <TouchableOpacity onPress={onLogin} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/signup')} style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={{ color: '#0ea5e9' }}>Create an account</Text>
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

