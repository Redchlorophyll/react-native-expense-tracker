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
import { Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react-native';
import type { AuthStackParamList } from '@/types';

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (username.trim().length < 3) e.username = 'Username minimal 3 karakter';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email tidak valid';
    if (password.length < 6) e.password = 'Password minimal 6 karakter';
    if (password !== confirmPassword) e.confirmPassword = 'Password tidak cocok';
    return e;
  };

  const canSubmit =
    username.trim().length >= 3 &&
    email.includes('@') &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleRegister = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setIsLoading(true);

    // Demo: simulate sending verification email
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);

    navigation.navigate('Verification', {
      email: email.trim(),
      username: username.trim(),
      password,
    });
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: {
      keyboardType?: 'default' | 'email-address';
      secure?: boolean;
      showToggle?: boolean;
      onToggle?: () => void;
      errorKey: string;
      placeholder: string;
    },
  ) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 13,
            paddingRight: options.showToggle ? 48 : 14,
            fontSize: 14,
            color: '#111827',
            borderWidth: 1,
            borderColor: errors[options.errorKey] ? '#ef4444' : '#e5e7eb',
          }}
          placeholder={options.placeholder}
          placeholderTextColor="#d1d5db"
          value={value}
          onChangeText={v => {
            onChange(v);
            if (errors[options.errorKey]) setErrors(prev => ({ ...prev, [options.errorKey]: '' }));
          }}
          secureTextEntry={options.secure}
          autoCapitalize="none"
          keyboardType={options.keyboardType ?? 'default'}
        />
        {options.showToggle && (
          <TouchableOpacity
            onPress={options.onToggle}
            style={{ position: 'absolute', right: 14, top: 13 }}
          >
            {options.secure
              ? <Eye size={20} color="#9ca3af" />
              : <EyeOff size={20} color="#9ca3af" />
            }
          </TouchableOpacity>
        )}
      </View>
      {errors[options.errorKey] ? (
        <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
          {errors[options.errorKey]}
        </Text>
      ) : null}
    </View>
  );

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
          {/* Back button */}
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

          <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 }}>
            Buat Akun
          </Text>
          <Text style={{ fontSize: 14, color: '#9ca3af', marginBottom: 28 }}>
            Isi form di bawah untuk mendaftar
          </Text>

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
            {field('Username', username, setUsername, {
              placeholder: 'Minimal 3 karakter',
              errorKey: 'username',
            })}
            {field('Email', email, setEmail, {
              placeholder: 'contoh@email.com',
              keyboardType: 'email-address',
              errorKey: 'email',
            })}
            {field('Password', password, setPassword, {
              placeholder: 'Minimal 6 karakter',
              secure: !showPassword,
              showToggle: true,
              onToggle: () => setShowPassword(v => !v),
              errorKey: 'password',
            })}
            {field('Ulangi Password', confirmPassword, setConfirmPassword, {
              placeholder: 'Ulangi password Anda',
              secure: !showConfirm,
              showToggle: true,
              onToggle: () => setShowConfirm(v => !v),
              errorKey: 'confirmPassword',
            })}

            <TouchableOpacity
              onPress={handleRegister}
              activeOpacity={canSubmit ? 0.85 : 1}
              style={{
                backgroundColor: canSubmit ? '#7c3aed' : '#e5e7eb',
                borderRadius: 16,
                paddingVertical: 15,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="white" />
                : <UserPlus size={18} color={canSubmit ? 'white' : '#9ca3af'} />
              }
              <Text style={{ color: canSubmit ? 'white' : '#9ca3af', fontWeight: '700', fontSize: 15 }}>
                {isLoading ? 'Mengirim kode...' : 'Daftar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Sudah punya akun?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ fontSize: 14, color: '#7c3aed', fontWeight: '700' }}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
