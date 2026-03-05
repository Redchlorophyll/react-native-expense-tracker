import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Landmark, Plus, Trash2, Calendar, Save, Info } from 'lucide-react-native';
import { useConfig } from '@/hooks/useStore';
import type { Bank } from '@/types';

const bankColors = [
  { value: '#8b5cf6', label: 'Ungu' },
  { value: '#3b82f6', label: 'Biru' },
  { value: '#10b981', label: 'Hijau' },
  { value: '#f59e0b', label: 'Kuning' },
  { value: '#ef4444', label: 'Merah' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#0051A1', label: 'BCA' },
  { value: '#F4B932', label: 'Mandiri' },
];

export function SettingsScreen() {
  const { config, updateBanks, updateCutoffDay, isUpdating } = useConfig();
  const [banks, setBanks] = useState<Bank[]>(config.banks);
  const [cutoffDay, setCutoffDay] = useState(config.cutoffDay.toString());
  const [hasChanges, setHasChanges] = useState(false);

  const handleAddBank = () => {
    const newBank: Bank = {
      id: `bank-${Date.now()}`,
      bankId: `BANK-${banks.length + 1}`,
      name: `Bank ${banks.length + 1}`,
      color: bankColors[banks.length % bankColors.length].value,
      icon: banks.length % 2 === 0 ? 'building-2' : 'landmark',
      balance: 0,
    };
    setBanks([...banks, newBank]);
    setHasChanges(true);
  };

  const handleUpdateBank = (id: string, updates: Partial<Bank>) => {
    setBanks(banks.map(b => b.id === id ? { ...b, ...updates } : b));
    setHasChanges(true);
  };

  const handleDeleteBank = (id: string) => {
    if (banks.length <= 1) {
      // Can't delete the last bank
      return;
    }
    setBanks(banks.filter(b => b.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateBanks(banks);
    updateCutoffDay(parseInt(cutoffDay) || 25);
    setHasChanges(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="bg-violet-600 px-4 pt-4 pb-6">
        <Text className="text-2xl font-bold text-white">Pengaturan</Text>
        <Text className="text-violet-200 text-sm">Konfigurasi akun Anda</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Cutoff Day Setting */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 bg-violet-100 rounded-full items-center justify-center">
              <Calendar size={20} color="#8b5cf6" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">Tanggal Cutoff Siklus</Text>
              <Text className="text-xs text-gray-500">
                Pengeluaran dikelompokkan dari tanggal {cutoffDay} sampai tanggal {parseInt(cutoffDay) - 1}
              </Text>
            </View>
          </View>
          
          <View>
            <Text className="text-sm text-gray-700 mb-2">Tanggal Cutoff (1-31)</Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
              keyboardType="number-pad"
              maxLength={2}
              value={cutoffDay}
              onChangeText={(text) => {
                const value = parseInt(text);
                if (text === '' || (value >= 1 && value <= 31)) {
                  setCutoffDay(text);
                  setHasChanges(true);
                }
              }}
              placeholder="25"
            />
            <Text className="text-xs text-gray-500 mt-2">
              Contoh: Jika diatur ke 25, siklus berjalan dari tanggal 25 sampai 24 bulan berikutnya
            </Text>
          </View>
        </View>

        {/* Banks Section */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">Bank Terhubung</Text>
            <TouchableOpacity
              onPress={handleAddBank}
              className="flex-row items-center px-3 py-2 bg-violet-100 rounded-lg"
            >
              <Plus size={16} color="#8b5cf6" />
              <Text className="text-sm text-violet-700 ml-1">Tambah</Text>
            </TouchableOpacity>
          </View>

          {banks.map((bank, index) => (
            <View key={bank.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
              {/* Bank Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${bank.color}20` }}
                  >
                    {bank.icon === 'building-2' ? (
                      <Building2 size={20} color={bank.color} />
                    ) : (
                      <Landmark size={20} color={bank.color} />
                    )}
                  </View>
                  <View>
                    <Text className="font-medium text-gray-900">Bank {index + 1}</Text>
                    <Text className="text-xs text-gray-500">ID: {bank.id.slice(-4)}</Text>
                  </View>
                </View>
                {banks.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleDeleteBank(bank.id)}
                    className="p-2"
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Bank Form */}
              <View className="gap-3">
                {/* Bank ID */}
                <View>
                  <Text className="text-xs text-gray-500 mb-1">Bank ID (untuk deteksi transfer)</Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-3 py-2 text-gray-900"
                    value={bank.bankId}
                    onChangeText={(text) => handleUpdateBank(bank.id, { bankId: text })}
                    placeholder="contoh: BCA-001"
                  />
                </View>

                {/* Bank Name */}
                <View>
                  <Text className="text-xs text-gray-500 mb-1">Nama Bank</Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-3 py-2 text-gray-900"
                    value={bank.name}
                    onChangeText={(text) => handleUpdateBank(bank.id, { name: text })}
                    placeholder="contoh: BCA, Mandiri, dll"
                  />
                </View>

                {/* Icon Selection */}
                <View>
                  <Text className="text-xs text-gray-500 mb-1">Ikon</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleUpdateBank(bank.id, { icon: 'building-2' })}
                      className={`p-2 rounded-lg border ${
                        bank.icon === 'building-2' 
                          ? 'border-violet-500 bg-violet-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <Building2 size={20} color={bank.color} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUpdateBank(bank.id, { icon: 'landmark' })}
                      className={`p-2 rounded-lg border ${
                        bank.icon === 'landmark' 
                          ? 'border-violet-500 bg-violet-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <Landmark size={20} color={bank.color} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Color Selection */}
                <View>
                  <Text className="text-xs text-gray-500 mb-1">Warna</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {bankColors.map((color) => (
                      <TouchableOpacity
                        key={color.value}
                        onPress={() => handleUpdateBank(bank.id, { color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          bank.color === color.value 
                            ? 'border-gray-900' 
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View className="bg-violet-50 rounded-xl p-4 border border-violet-100 mb-20">
          <View className="flex-row items-start gap-2">
            <Info size={18} color="#8b5cf6" className="mt-0.5" />
            <View className="flex-1">
              <Text className="font-medium text-violet-900 mb-1">Tentang Deteksi Transfer</Text>
              <Text className="text-sm text-violet-700">
                Bank ID digunakan untuk mengidentifikasi transaksi transfer antar bank. 
                Sistem akan otomatis mendeteksi transfer ketika ada transaksi dengan jumlah 
                berlawanan antar bank dalam waktu 24 jam.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={handleSave}
            disabled={isUpdating}
            className="flex-row items-center justify-center py-3 bg-violet-600 rounded-xl"
          >
            <Save size={18} color="white" />
            <Text className="font-medium text-white ml-2">Simpan Perubahan</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
