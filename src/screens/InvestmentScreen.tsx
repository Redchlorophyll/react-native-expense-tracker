import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TrendingUp, Plus, Trash2, ChevronRight } from 'lucide-react-native';
import { CreateDistributionModal } from '@/components/CreateDistributionModal';
import type { InvestmentDistribution, RootStackParamList } from '@/types';
import {
  useTransactions,
  useInvestmentDistributions,
} from '@/hooks/useStore';
import { detectTransferTransactions, formatCurrency } from '@/lib/utils';

export function InvestmentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { transactions } = useTransactions();
  const { distributions, addDistribution, deleteDistribution } = useInvestmentDistributions();

  const [isCreateDistModalVisible, setIsCreateDistModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const processedTransactions = useMemo(
    () => detectTransferTransactions(transactions),
    [transactions],
  );

  const investmentTransactions = useMemo(
    () => processedTransactions.filter(t => t.type === 'investment'),
    [processedTransactions],
  );

  const totalInvestment = useMemo(
    () => investmentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [investmentTransactions],
  );

  const totalAllocated = useMemo(
    () => distributions.reduce((sum, d) => sum + d.amount, 0),
    [distributions],
  );

  const allocationPercent = totalInvestment > 0
    ? Math.min((totalAllocated / totalInvestment) * 100, 100)
    : 0;

  const handleDeleteDistribution = (dist: InvestmentDistribution) => {
    Alert.alert(
      'Hapus Distribusi',
      `Hapus "${dist.label}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteDistribution(dist.id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: '#7c3aed',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
        }}
      >
        <Text style={{ color: '#ddd6fe', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>
          Total Dana Investasi
        </Text>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: '800' }}>
          {formatCurrency(totalInvestment)}
        </Text>
        <Text style={{ color: '#c4b5fd', fontSize: 13, marginTop: 4 }}>
          {investmentTransactions.length} transaksi investasi
        </Text>

        {/* View transactions button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('InvestmentTransactions')}
          activeOpacity={0.8}
          style={{
            marginTop: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 11,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
            Lihat Transaksi Investasi
          </Text>
          <ChevronRight size={16} color="white" />
        </TouchableOpacity>

        {/* Allocation progress bar */}
        {totalInvestment > 0 && (
          <View style={{ marginTop: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <Text style={{ color: '#ddd6fe', fontSize: 12 }}>
                Teralokasi ({allocationPercent.toFixed(0)}%)
              </Text>
              <Text style={{ color: '#ddd6fe', fontSize: 12 }}>
                {formatCurrency(totalAllocated)} / {formatCurrency(totalInvestment)}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 3,
              }}
            >
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'white',
                  width: `${allocationPercent}%`,
                }}
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Distribution section ── */}
        <View
          style={{
            margin: 16,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: '#f3f4f6',
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View>
              <Text style={{ fontWeight: '700', fontSize: 15, color: '#111827' }}>
                Distribusi Dana
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                Alokasi manual portofolio investasi
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsCreateDistModalVisible(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#7c3aed',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
              }}
            >
              <Plus size={14} color="white" />
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {distributions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: '#f5f3ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <TrendingUp size={24} color="#c4b5fd" />
              </View>
              <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600' }}>
                Belum ada distribusi
              </Text>
              <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Catat alokasi investasimu{'\n'}dengan menekan tombol Tambah
              </Text>
            </View>
          ) : (
            distributions.map((dist, index) => (
              <View
                key={dist.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: index < distributions.length - 1 ? 1 : 0,
                  borderBottomColor: '#f9fafb',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#ede9fe',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <TrendingUp size={16} color="#7c3aed" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14 }}>
                    {dist.label}
                  </Text>
                  {dist.notes ? (
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {dist.notes}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontWeight: '700',
                    color: '#7c3aed',
                    fontSize: 14,
                    marginRight: 10,
                  }}
                >
                  {formatCurrency(dist.amount)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteDistribution(dist)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: '#fef2f2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <CreateDistributionModal
        isVisible={isCreateDistModalVisible}
        onClose={() => setIsCreateDistModalVisible(false)}
        onSave={addDistribution}
        totalInvestment={totalInvestment}
        totalAllocated={totalAllocated}
      />
    </SafeAreaView>
  );
}
