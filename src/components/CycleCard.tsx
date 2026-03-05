import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Wallet, Sparkles, Lock } from 'lucide-react-native';
import { TransactionCard } from './TransactionCard';
import type { Transaction, Cycle, Bank, Category, CycleSummary } from '@/types';
import { formatCurrency, getCycleLabel } from '@/lib/utils';

interface CycleCardProps {
  cycle: Cycle;
  transactions: Transaction[];
  summary: CycleSummary;
  banks: Bank[];
  categories: Category[];
  onCloseCycle?: () => void;
  onEditNotes?: (transaction: Transaction) => void;
}

export function CycleCard({ 
  cycle, 
  transactions, 
  summary, 
  banks, 
  categories, 
  onCloseCycle,
  onEditNotes,
}: CycleCardProps) {
  const [isExpanded, setIsExpanded] = useState(!cycle.isClosed);

  const cycleLabel = getCycleLabel(cycle.startDate, cycle.endDate);
  const isPositive = summary.netAmount >= 0;

  return (
    <View className="mb-4">
      {/* Cycle Header */}
      <View className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
        <TouchableOpacity 
          className="p-4"
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                isPositive ? 'bg-emerald-100' : 'bg-rose-100'
              }`}>
                {isPositive ? (
                  <TrendingUp size={20} color="#10b981" />
                ) : (
                  <TrendingDown size={20} color="#ef4444" />
                )}
              </View>
              <View>
                <Text className="font-semibold text-gray-900">{cycleLabel}</Text>
                <Text className="text-xs text-gray-500">
                  {transactions.length} transaksi{cycle.isClosed && ' • Ditutup'}
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center gap-2">
              {!cycle.isClosed && onCloseCycle && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onCloseCycle();
                  }}
                  className="flex-row items-center px-2 py-1 bg-violet-50 rounded-lg"
                >
                  <Lock size={14} color="#8b5cf6" />
                  <Text className="text-xs text-violet-600 ml-1">Tutup</Text>
                </TouchableOpacity>
              )}
              {isExpanded ? (
                <ChevronUp size={20} color="#9ca3af" />
              ) : (
                <ChevronDown size={20} color="#9ca3af" />
              )}
            </View>
          </View>

          {/* Summary Row */}
          <View className="mt-4 flex-row gap-4">
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500 mb-1">Pemasukan</Text>
              <Text className="font-semibold text-emerald-600">{formatCurrency(summary.totalIncome)}</Text>
            </View>
            <View className="flex-1 items-center border-x border-gray-100">
              <Text className="text-xs text-gray-500 mb-1">Pengeluaran</Text>
              <Text className="font-semibold text-rose-600">{formatCurrency(summary.totalExpense)}</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500 mb-1">Sisa</Text>
              <Text className={`font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(summary.netAmount)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View className="border-t border-gray-100">
            {/* AI Insight */}
            <View className="p-4 bg-violet-50 border-b border-violet-100">
              <View className="flex-row items-start gap-2">
                <Sparkles size={16} color="#8b5cf6" className="mt-0.5" />
                <View className="flex-1">
                  <Text className="text-xs font-medium text-violet-700 mb-1">Analisis AI</Text>
                  <Text className="text-sm text-violet-800">{summary.aiInsight}</Text>
                </View>
              </View>
            </View>

            {/* Top Category */}
            {summary.topExpenseCategory !== 'None' && (
              <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-gray-500">Pengeluaran Terbesar</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-medium text-gray-700">{summary.topExpenseCategory}</Text>
                    <Text className="text-sm text-rose-600">
                      {formatCurrency(summary.categoryBreakdown[summary.topExpenseCategory] || 0)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Transactions List */}
            <View className="p-4">
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Daftar Transaksi
              </Text>
              {transactions.length === 0 ? (
                <View className="items-center py-8">
                  <Wallet size={48} color="#d1d5db" />
                  <Text className="text-sm text-gray-400 mt-2">Belum ada transaksi</Text>
                </View>
              ) : (
                transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    banks={banks}
                    categories={categories}
                    onEditNotes={onEditNotes}
                  />
                ))
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
