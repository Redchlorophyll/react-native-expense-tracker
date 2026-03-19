import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Sparkles,
  Info,
  Lock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { TransactionCard } from '@/components/TransactionCard';
import { TransactionDetailModal } from '@/components/TransactionDetailModal';
import { PieChart } from '@/components/PieChart';
import type { PieSlice } from '@/components/PieChart';
import { SourceInfoModal } from '@/components/SourceInfoModal';
import type { Transaction, RootStackParamList } from '@/types';
import {
  useTransactions,
  useCycles,
  useConfig,
} from '@/hooks/useStore';
import {
  generateCycleSummary,
  detectTransferTransactions,
  formatCurrency,
  getCycleLabel,
  groupTransactionsByCycle,
  getCategoryColor,
} from '@/lib/utils';
import { mockCycleSources } from '@/data/mockData';

type RouteProps = RouteProp<RootStackParamList, 'CycleDetail'>;

export function CycleDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cycleId } = route.params;

  const { transactions, updateTransaction } = useTransactions();
  const { cycles, updateCycle } = useCycles();
  const { config } = useConfig();

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSourceModalVisible, setIsSourceModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Re-use the same processing pipeline as ExpensesScreen
  const processedTransactions = useMemo(
    () => detectTransferTransactions(transactions),
    [transactions],
  );

  const groupedData = useMemo(() => {
    const groups = groupTransactionsByCycle(processedTransactions, cycles, config.cutoffDay);
    return groups.map(group => ({
      ...group,
      summary: generateCycleSummary(group.transactions, config.banks),
    }));
  }, [processedTransactions, cycles, config.cutoffDay, config.banks]);

  const group = groupedData.find(g => g.cycle.id === cycleId);

  // Build pie data from expense category breakdown
  const pieData: PieSlice[] = useMemo(() => {
    if (!group) return [];
    return Object.entries(group.summary.categoryBreakdown)
      .filter(([, value]) => value > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([label, value]) => ({
        label,
        value,
        color: getCategoryColor(config.categories, label),
      }));
  }, [group, config.categories]);

  // Build pie data from income category breakdown
  const incomePieData: PieSlice[] = useMemo(() => {
    if (!group) return [];
    const breakdown: Record<string, number> = {};
    group.transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const label = t.category || 'Pemasukan';
        breakdown[label] = (breakdown[label] || 0) + t.amount;
      });
    return Object.entries(breakdown)
      .filter(([, value]) => value > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([label, value]) => ({
        label,
        value,
        color: getCategoryColor(config.categories, label),
      }));
  }, [group, config.categories]);

  const cycleSources = mockCycleSources[cycleId] ?? [];

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6b7280' }}>Siklus tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  const { cycle, summary } = group;
  const cycleLabel = getCycleLabel(cycle.startDate, cycle.endDate);
  const isPositive = summary.netAmount >= 0;

  const handleCloseCycle = () => {
    Alert.alert(
      'Tutup Siklus',
      `Tutup siklus ${cycleLabel}? Siklus yang ditutup tidak dapat dibuka kembali.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tutup Siklus',
          style: 'destructive',
          onPress: () => {
            updateCycle({
              id: cycleId,
              updates: { isClosed: true, closedAt: new Date().toISOString() },
            });
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleEditNotes = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalVisible(true);
  };

  const handleSaveNotes = (id: string, updates: Partial<Transaction>) => {
    updateTransaction({ id, updates });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <StatusBar style="light" />

      {/* ── Top Header ── */}
      <View style={{ backgroundColor: '#7c3aed' }}>
        {/* Nav row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 4,
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
              marginRight: 12,
            }}
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 17 }}>Detail Siklus</Text>
            <Text style={{ color: '#ede9fe', fontSize: 13 }}>{cycleLabel}</Text>
          </View>

          {/* Info / source button */}
          <TouchableOpacity
            onPress={() => setIsSourceModalVisible(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Info size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 20,
            gap: 10,
          }}
        >
          {/* Income */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 14,
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <TrendingUp size={14} color="#6ee7b7" />
              <Text style={{ color: '#a7f3d0', fontSize: 11, fontWeight: '500' }}>Pemasukan</Text>
            </View>
            <Text style={{ color: '#ecfdf5', fontWeight: '700', fontSize: 15 }}>
              {formatCurrency(summary.totalIncome)}
            </Text>
          </View>

          {/* Expense */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 14,
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <TrendingDown size={14} color="#fca5a5" />
              <Text style={{ color: '#fecaca', fontSize: 11, fontWeight: '500' }}>Pengeluaran</Text>
            </View>
            <Text style={{ color: '#fff1f2', fontWeight: '700', fontSize: 15 }}>
              {formatCurrency(summary.totalExpense)}
            </Text>
          </View>

          {/* Net */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ddd6fe', fontSize: 11, fontWeight: '500', marginBottom: 4 }}>
              Sisa
            </Text>
            <Text
              style={{
                fontWeight: '700',
                fontSize: 15,
                color: isPositive ? '#6ee7b7' : '#fca5a5',
              }}
            >
              {formatCurrency(summary.netAmount)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Insight card */}
        <View
          style={{
            margin: 16,
            backgroundColor: '#ede9fe',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#ddd6fe',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: '#7c3aed',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
              }}
            >
              <Sparkles size={16} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: '#5b21b6', fontSize: 14, marginBottom: 4 }}>
                Analisis AI
              </Text>
              <Text style={{ color: '#4c1d95', fontSize: 13, lineHeight: 20 }}>
                {summary.aiInsight}
              </Text>
            </View>
          </View>
        </View>

        {/* Expense pie chart */}
        {pieData.length > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: '#f3f4f6',
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#111827',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Distribusi Pengeluaran
            </Text>
            <PieChart data={pieData} size={220} />
          </View>
        )}

        {/* Income pie chart */}
        {incomePieData.length > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: '#f3f4f6',
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#111827',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Distribusi Pemasukan
            </Text>
            <PieChart data={incomePieData} size={220} />
          </View>
        )}

        {/* Transaction list */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
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
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 14, color: '#111827' }}>
              Daftar Transaksi
            </Text>
            <View
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>
                {group.transactions.length} transaksi
              </Text>
            </View>
          </View>

          {group.transactions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>Belum ada transaksi</Text>
            </View>
          ) : (
            group.transactions.map(transaction => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                banks={config.banks}
                categories={config.categories}
                onEditNotes={handleEditNotes}
              />
            ))
          )}
        </View>

      </ScrollView>

      {/* Sticky close button / closed indicator */}
      <View
        style={{
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        {!cycle.isClosed ? (
          <TouchableOpacity
            onPress={handleCloseCycle}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: 'white',
              borderWidth: 1.5,
              borderColor: '#7c3aed',
              borderRadius: 16,
              paddingVertical: 14,
            }}
          >
            <Lock size={16} color="#7c3aed" />
            <Text style={{ color: '#7c3aed', fontWeight: '700', fontSize: 15 }}>
              Tutup Siklus Ini
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Lock size={14} color="#9ca3af" />
              <Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 13 }}>
                Siklus telah ditutup
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Edit Notes Modal */}
      <TransactionDetailModal
        isVisible={isEditModalVisible}
        transaction={editingTransaction}
        categories={config.categories}
        banks={config.banks}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveNotes}
      />

      {/* Source Info Modal */}
      <SourceInfoModal
        isVisible={isSourceModalVisible}
        cycleLabel={cycleLabel}
        sources={cycleSources}
        onClose={() => setIsSourceModalVisible(false)}
      />
    </SafeAreaView>
  );
}
