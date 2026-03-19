import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { TransactionCard } from '@/components/TransactionCard';
import { TransactionDetailModal } from '@/components/TransactionDetailModal';
import type { Transaction, RootStackParamList } from '@/types';
import { useTransactions, useConfig } from '@/hooks/useStore';
import { detectTransferTransactions, formatCurrency } from '@/lib/utils';

const PAGE_SIZE = 20;

export function InvestmentTransactionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { transactions, updateTransaction } = useTransactions();
  const { config } = useConfig();

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [page, setPage] = useState(1);

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

  const pagedTransactions = useMemo(
    () => investmentTransactions.slice(0, page * PAGE_SIZE),
    [investmentTransactions, page],
  );

  const hasMore = pagedTransactions.length < investmentTransactions.length;

  const handleEditNotes = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalVisible(true);
  };

  const handleSave = (id: string, updates: Partial<Transaction>) => {
    updateTransaction({ id, updates });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ backgroundColor: '#7c3aed' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 16,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 17 }}>
              Transaksi Investasi
            </Text>
            <Text style={{ color: '#c4b5fd', fontSize: 13, marginTop: 1 }}>
              {investmentTransactions.length} transaksi · {formatCurrency(totalInvestment)}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={pagedTransactions}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600' }}>
              Belum ada transaksi investasi
            </Text>
            <Text
              style={{ color: '#d1d5db', fontSize: 12, marginTop: 6, textAlign: 'center' }}
            >
              Buka detail transaksi pengeluaran{'\n'}dan ubah tipenya menjadi Investasi
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            banks={config.banks}
            categories={config.categories}
            onEditNotes={handleEditNotes}
          />
        )}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (hasMore) setPage(p => p + 1);
        }}
        ListFooterComponent={
          hasMore ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ color: '#9ca3af', fontSize: 13 }}>Memuat lebih banyak...</Text>
            </View>
          ) : investmentTransactions.length > 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ color: '#d1d5db', fontSize: 12 }}>
                Semua {investmentTransactions.length} transaksi ditampilkan
              </Text>
            </View>
          ) : null
        }
      />

      <TransactionDetailModal
        isVisible={isEditModalVisible}
        transaction={editingTransaction}
        categories={config.categories}
        banks={config.banks}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingTransaction(null);
        }}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
