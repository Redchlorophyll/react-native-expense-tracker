import React, { useState, useRef, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import type { AuthStackParamList } from '@/types';

const CODE_LENGTH = 6;

export function VerificationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'Verification'>>();
  const { email, username, password, isLogin } = route.params;
  const { completeRegistration, login } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const fullCode = code.join('');
  const canSubmit = fullCode.length === CODE_LENGTH;

  const handleCodeChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError('');
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');
    // Demo: accept any 6-digit code
    await new Promise(r => setTimeout(r, 600));
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await completeRegistration(username!, email);
      }
      // Auth gate will redirect to main app
    } catch {
      setError('Verifikasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setResendTimer(30);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: 'white',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: '#ede9fe',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Mail size={34} color="#7c3aed" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 }}>
              Cek Email Anda
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 }}>
              Kode verifikasi 6 digit telah dikirim ke{'\n'}
              <Text style={{ fontWeight: '700', color: '#7c3aed' }}>{email}</Text>
            </Text>
          </View>

          {/* OTP inputs */}
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
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
              {code.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={ref => { inputRefs.current[i] = ref; }}
                  style={{
                    width: 46,
                    height: 54,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: digit ? '#7c3aed' : '#e5e7eb',
                    backgroundColor: digit ? '#f5f3ff' : '#f9fafb',
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#111827',
                  }}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={text => handleCodeChange(text, i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error ? (
              <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={canSubmit ? 0.85 : 1}
              style={{
                backgroundColor: canSubmit ? '#7c3aed' : '#e5e7eb',
                borderRadius: 16,
                paddingVertical: 15,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 20,
              }}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="white" />
                : <CheckCircle size={18} color={canSubmit ? 'white' : '#9ca3af'} />
              }
              <Text style={{ color: canSubmit ? 'white' : '#9ca3af', fontWeight: '700', fontSize: 15 }}>
                {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
              </Text>
            </TouchableOpacity>

            {/* Resend */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
              <Text style={{ fontSize: 13, color: '#9ca3af' }}>Tidak menerima kode?</Text>
              {resendTimer > 0 ? (
                <Text style={{ fontSize: 13, color: '#d1d5db' }}>
                  Kirim ulang ({resendTimer}s)
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={{ fontSize: 13, color: '#7c3aed', fontWeight: '700' }}>
                    Kirim Ulang
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
