import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Upload } from 'lucide-react-native';
import { CycleCard } from '@/components/CycleCard';
import { TransactionDetailModal } from '@/components/TransactionDetailModal';
import type { Transaction, RootStackParamList } from '@/types';
import { 
  useTransactions, 
  useCycles, 
  useConfig, 
} from '@/hooks/useStore';
import { 
  groupTransactionsByCycle, 
  generateCycleSummary, 
  detectTransferTransactions,
  formatCurrency,
} from '@/lib/utils';

export function ExpensesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { transactions, updateTransaction } = useTransactions();
  const { cycles, updateCycle } = useCycles();
  const { config } = useConfig();
  const [refreshing, setRefreshing] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Detect and merge transfer transactions automatically
  const processedTransactions = useMemo(() => {
    return detectTransferTransactions(transactions);
  }, [transactions]);

  // Group transactions by cycle
  const groupedData = useMemo(() => {
    const groups = groupTransactionsByCycle(
      processedTransactions, 
      cycles, 
      config.cutoffDay
    );
    
    return groups.map(group => ({
      ...group,
      summary: generateCycleSummary(group.transactions, config.banks),
    }));
  }, [processedTransactions, cycles, config.cutoffDay, config.banks]);

  // Calculate total stats
  const totalStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    
    processedTransactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else if (t.type === 'expense') totalExpense += Math.abs(t.amount);
    });
    
    return { totalIncome, totalExpense, net: totalIncome - totalExpense };
  }, [processedTransactions]);

  const handleCloseCycle = (cycleId: string) => {
    updateCycle({ 
      id: cycleId, 
      updates: { 
        isClosed: true, 
        closedAt: new Date().toISOString() 
      } 
    });
  };

  const handleEditNotes = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalVisible(true);
  };

  const handleSaveNotes = (id: string, updates: Partial<Transaction>) => {
    updateTransaction({ id, updates });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="bg-violet-600 px-4 pt-4 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-white">Expense Tracker</Text>
            <Text className="text-violet-200 text-sm">Kelola keuangan Anda</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('StatementUpload')}
            style={{ padding: 8 }}
            activeOpacity={0.7}
          >
            <Upload size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1 bg-violet-500/50 rounded-lg p-3 items-center">
            <Text className="text-xs text-violet-200 mb-1">Pemasukan</Text>
            <Text className="font-semibold text-emerald-300 text-xs">
              {formatCurrency(totalStats.totalIncome)}
            </Text>
          </View>
          <View className="flex-1 bg-violet-500/50 rounded-lg p-3 items-center">
            <Text className="text-xs text-violet-200 mb-1">Pengeluaran</Text>
            <Text className="font-semibold text-rose-300 text-xs">
              {formatCurrency(totalStats.totalExpense)}
            </Text>
          </View>
          <View className="flex-1 bg-violet-500/50 rounded-lg p-3 items-center">
            <Text className="text-xs text-violet-200 mb-1">Sisa</Text>
            <Text className={`font-semibold text-xs ${totalStats.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {formatCurrency(totalStats.net)}
            </Text>
          </View>
        </View>
      </View>

      {/* Cycles List */}
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8b5cf6"
          />
        }
      >
        {groupedData.map(({ cycle, transactions, summary }) => (
          <CycleCard
            key={cycle.id}
            cycle={cycle}
            transactions={transactions}
            summary={summary}
            banks={config.banks}
            categories={config.categories}
            onCloseCycle={() => handleCloseCycle(cycle.id)}
            onEditNotes={handleEditNotes}
            onViewDetail={() => navigation.navigate('CycleDetail', { cycleId: cycle.id })}
          />
        ))}
      </ScrollView>

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
    </SafeAreaView>
  );
}
