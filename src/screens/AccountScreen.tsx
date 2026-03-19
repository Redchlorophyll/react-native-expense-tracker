import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff, LogOut, Lock, Check } from 'lucide-react-native';
import { useAuth, getInitials } from '@/context/AuthContext';

export function AccountScreen() {
  const { user, logout, updatePassword } = useAuth();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  if (!user) return null;

  const initials = getInitials(user.username);
  const canChangePassword =
    currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmNewPassword;

  const handleChangePassword = async () => {
    if (!canChangePassword) return;
    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter');
      return;
    }
    setPasswordError('');
    setPasswordLoading(true);
    await updatePassword(currentPassword, newPassword);
    setPasswordLoading(false);
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  const passwordField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    toggleShow: () => void,
    placeholder: string,
  ) => (
    <View style={{ marginBottom: 14 }}>
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
            paddingRight: 48,
            fontSize: 14,
            color: '#111827',
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}
          placeholder={placeholder}
          placeholderTextColor="#d1d5db"
          value={value}
          onChangeText={v => { onChange(v); setPasswordError(''); setPasswordSuccess(false); }}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={{ position: 'absolute', right: 14, top: 13 }}
          onPress={toggleShow}
        >
          {show ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header bar */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
          backgroundColor: 'white',
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>Akun Saya</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            marginBottom: 20,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#7c3aed',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              shadowColor: '#7c3aed',
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>
              {initials}
            </Text>
          </View>

          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 }}>
            {user.username}
          </Text>
          <Text style={{ fontSize: 14, color: '#9ca3af' }}>{user.email}</Text>
        </View>

        {/* Reset password card */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#ede9fe',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={18} color="#7c3aed" />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Ganti Password</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                Perbarui password akun Anda
              </Text>
            </View>
          </View>

          {passwordField(
            'Password Saat Ini',
            currentPassword,
            setCurrentPassword,
            showCurrent,
            () => setShowCurrent(v => !v),
            'Masukkan password lama',
          )}
          {passwordField(
            'Password Baru',
            newPassword,
            setNewPassword,
            showNew,
            () => setShowNew(v => !v),
            'Minimal 6 karakter',
          )}
          {passwordField(
            'Ulangi Password Baru',
            confirmNewPassword,
            setConfirmNewPassword,
            showConfirm,
            () => setShowConfirm(v => !v),
            'Ulangi password baru',
          )}

          {passwordError ? (
            <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
              {passwordError}
            </Text>
          ) : null}

          {passwordSuccess ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#d1fae5',
                borderRadius: 12,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <Check size={15} color="#10b981" />
              <Text style={{ fontSize: 13, color: '#065f46', fontWeight: '600' }}>
                Password berhasil diperbarui!
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleChangePassword}
            activeOpacity={canChangePassword ? 0.85 : 1}
            style={{
              backgroundColor: canChangePassword ? '#7c3aed' : '#e5e7eb',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {passwordLoading
              ? <ActivityIndicator size="small" color="white" />
              : <Lock size={16} color={canChangePassword ? 'white' : '#9ca3af'} />
            }
            <Text style={{ color: canChangePassword ? 'white' : '#9ca3af', fontWeight: '700', fontSize: 14 }}>
              {passwordLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout button */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#fef2f2',
            borderRadius: 16,
            paddingVertical: 15,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: '#fecaca',
          }}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 15 }}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
