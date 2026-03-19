import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Eye, EyeOff, TrendingUp, LogIn } from 'lucide-react-native';
import type { AuthStackParamList } from '@/types';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = emailOrUsername.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setError('');
    setIsLoading(true);
    // Demo: simulate sending OTP email
    await new Promise(r => setTimeout(r, 700));
    setIsLoading(false);
    navigation.navigate('Verification', {
      email: emailOrUsername.trim(),
      password,
      isLogin: true,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / brand */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: '#7c3aed',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#7c3aed',
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <TrendingUp size={32} color="white" />
            </View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827' }}>Selamat Datang</Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 6 }}>
              Masuk ke akun Anda untuk melanjutkan
            </Text>
          </View>

          {/* Form card */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 24,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {/* Email / username */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
              Email atau Username
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 13,
                fontSize: 14,
                color: '#111827',
                borderWidth: 1,
                borderColor: '#e5e7eb',
                marginBottom: 16,
              }}
              placeholder="contoh@email.com atau username"
              placeholderTextColor="#d1d5db"
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            {/* Password */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
              Password
            </Text>
            <View style={{ position: 'relative', marginBottom: 24 }}>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  paddingRight: 48,
                  fontSize: 14,
                  color: '#111827',
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
                placeholder="Masukkan password"
                placeholderTextColor="#d1d5db"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 14, top: 13 }}
              >
                {showPassword
                  ? <EyeOff size={20} color="#9ca3af" />
                  : <Eye size={20} color="#9ca3af" />
                }
              </TouchableOpacity>
            </View>

            {error ? (
              <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={canSubmit ? 0.85 : 1}
              style={{
                backgroundColor: canSubmit ? '#7c3aed' : '#e5e7eb',
                borderRadius: 16,
                paddingVertical: 15,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="white" />
                : <LogIn size={18} color={canSubmit ? 'white' : '#9ca3af'} />
              }
              <Text style={{ color: canSubmit ? 'white' : '#9ca3af', fontWeight: '700', fontSize: 15 }}>
                {isLoading ? 'Mengirim kode...' : 'Masuk'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Belum punya akun?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ fontSize: 14, color: '#7c3aed', fontWeight: '700' }}>Daftar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
