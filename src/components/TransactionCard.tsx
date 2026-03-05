import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Building2, 
  Landmark,
  Briefcase,
  Laptop,
  TrendingUp,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  Heart,
  Circle,
  Edit3,
} from 'lucide-react-native';
import type { Transaction, Bank, Category } from '@/types';
import { formatCurrency, formatDateShort, getBankById, getCategoryIcon, getCategoryColor } from '@/lib/utils';

// Map of icon names to components
const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'briefcase': Briefcase,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'utensils': Utensils,
  'car': Car,
  'shopping-bag': ShoppingBag,
  'receipt': Receipt,
  'film': Film,
  'heart': Heart,
  'arrow-right-left': ArrowRightLeft,
  'circle': Circle,
};

interface TransactionCardProps {
  transaction: Transaction;
  banks: Bank[];
  categories: Category[];
  onEditNotes?: (transaction: Transaction) => void;
}

export function TransactionCard({ transaction, banks, categories, onEditNotes }: TransactionCardProps) {
  const fromBank = getBankById(banks, transaction.fromBankId);
  const toBank = transaction.toBankId ? getBankById(banks, transaction.toBankId) : null;
  
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';
  
  const amountColor = isIncome ? 'text-emerald-500' : isExpense ? 'text-rose-500' : 'text-gray-500';
  const Icon = isIncome ? ArrowDownLeft : isExpense ? ArrowUpRight : ArrowRightLeft;
  
  // Get category icon
  const categoryIconName = getCategoryIcon(categories, transaction.category);
  const CategoryIcon = iconMap[categoryIconName] || Circle;
  const categoryColor = getCategoryColor(categories, transaction.category);

  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        {/* Left: Icon and Info */}
        <View className="flex-row items-center gap-3 flex-1">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            <CategoryIcon size={20} color={categoryColor} />
          </View>
          
          <View className="flex-1">
            <Text className="font-medium text-gray-900 text-sm">
              {transaction.description || transaction.category}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Text className="text-xs text-gray-500">{formatDateShort(transaction.date)}</Text>
              <Text className="text-xs text-gray-400">•</Text>
              <View className="flex-row items-center gap-1">
                {fromBank?.icon === 'building-2' ? (
                  <Building2 size={12} color={fromBank?.color || '#666'} />
                ) : (
                  <Landmark size={12} color={fromBank?.color || '#666'} />
                )}
                <Text className="text-xs text-gray-500">{fromBank?.name}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right: Amount and Edit */}
        <View className="items-end">
          <View className={`flex-row items-center gap-1 ${amountColor}`}>
            <Icon size={16} color={isIncome ? '#10b981' : isExpense ? '#ef4444' : '#6b7280'} />
            <Text className={`font-semibold ${amountColor}`}>
              {isExpense ? '-' : ''}{formatCurrency(Math.abs(transaction.amount))}
            </Text>
          </View>
          {isTransfer && (
            <Text className="text-xs text-gray-400 mt-0.5">Transfer</Text>
          )}
        </View>
      </View>

      {/* Notes (if exists) */}
      {transaction.notes && (
        <View className="mt-2 pt-2 border-t border-gray-100">
          <Text className="text-xs text-gray-500 italic">{transaction.notes}</Text>
        </View>
      )}

      {/* Transfer indicator */}
      {isTransfer && toBank && (
        <View className="mt-2 flex-row items-center gap-2">
          <ArrowRightLeft size={12} color="#6b7280" />
          <Text className="text-xs text-gray-500">Transfer ke {toBank.name}</Text>
        </View>
      )}

      {/* Edit Notes Button */}
      <TouchableOpacity 
        onPress={() => onEditNotes?.(transaction)}
        className="absolute top-2 right-2 p-1"
      >
        <Edit3 size={14} color="#8b5cf6" />
      </TouchableOpacity>
    </View>
  );
}
