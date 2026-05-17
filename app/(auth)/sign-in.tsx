import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { signInWithGoogle, signInWithApple } from '../../src/services/auth';

export default function SignInScreen() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  async function handleGoogle() {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('Sign-in failed', err.message ?? 'Unknown error');
    } finally {
      setLoading(null);
    }
  }

  async function handleApple() {
    setLoading('apple');
    try {
      await signInWithApple();
    } catch (err: any) {
      Alert.alert('Sign-in failed', err.message ?? 'Unknown error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.shield}>🛡️</Text>
        <Text style={styles.title}>PTSD Shield</Text>
        <Text style={styles.subtitle}>
          A real-time acoustic protection layer for your nervous system
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.googleBtn]}
          onPress={handleGoogle}
          disabled={loading !== null}
        >
          {loading === 'google' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.btn, styles.appleBtn]}
            onPress={handleApple}
            disabled={loading !== null}
          >
            {loading === 'apple' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}> Sign in with Apple</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.disclaimer}>
        All audio processing is performed on-device. No audio is ever recorded
        or transmitted.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  header: {
    alignItems: 'center',
    gap: 16,
  },
  shield: {
    fontSize: 72,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: 14,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  googleBtn: {
    backgroundColor: '#4285F4',
  },
  appleBtn: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
});
