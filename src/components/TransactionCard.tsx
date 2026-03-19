import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Building2,
  Landmark,
  AlertCircle,
  Smartphone,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import type { Transaction, Bank, Category } from '@/types';
import { formatCurrency, formatDateShort, getBankById, getCategoryColor } from '@/lib/utils';

const bankIconMap: Record<string, LucideIcon> = {
  'building-2': Building2,
  'landmark': Landmark,
};

/** Returns "METHOD - Name" or just "METHOD" depending on available data */
function buildPartyLabel(
  paymentMethod: string | undefined,
  bank: Bank | null | undefined,
  accountName: string | undefined,
): { label: string; sub: string | null; color: string } {
  const method = paymentMethod || bank?.name || 'Unknown';
  const name = accountName || null;
  const color = paymentMethod ? '#6b7280' : (bank?.color || '#6b7280');
  return { label: method, sub: name, color };
}

/** Small pill showing METHOD and optional "- Name" sub-label */
function PartyChip({ icon, label, sub, color }: { icon: React.ReactNode; label: string; sub: string | null; color: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: `${color}15`,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
      }}
    >
      {icon}
      <Text style={{ fontSize: 11, fontWeight: '600', color }}>
        {label}{sub ? ` · ${sub}` : ''}
      </Text>
    </View>
  );
}

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
  const isInvestment = transaction.type === 'investment';

  const typeConfig = isIncome
    ? { label: 'Pemasukan', bgColor: '#d1fae5', iconColor: '#10b981', Icon: ArrowDownLeft, amountPrefix: '+', amountColor: '#10b981' }
    : isExpense
    ? { label: 'Pengeluaran', bgColor: '#fee2e2', iconColor: '#ef4444', Icon: ArrowUpRight, amountPrefix: '-', amountColor: '#ef4444' }
    : isInvestment
    ? { label: 'Investasi', bgColor: '#ede9fe', iconColor: '#7c3aed', Icon: TrendingUp, amountPrefix: '-', amountColor: '#7c3aed' }
    : { label: 'Transfer', bgColor: '#f3f4f6', iconColor: '#6b7280', Icon: ArrowRightLeft, amountPrefix: '', amountColor: '#6b7280' };

  const hasCategory = Boolean(transaction.category);
  const categoryColor = getCategoryColor(categories, transaction.category);

  const from = buildPartyLabel(transaction.fromPaymentMethod, fromBank, transaction.fromAccountName);
  const to = buildPartyLabel(transaction.toPaymentMethod, toBank, transaction.toAccountName);

  const FromBankIcon = (!transaction.fromPaymentMethod && fromBank) ? (bankIconMap[fromBank.icon] || Building2) : Smartphone;
  const ToBankIcon = (!transaction.toPaymentMethod && toBank) ? (bankIconMap[toBank.icon] || Building2) : Smartphone;

  return (
    <TouchableOpacity
      onPress={() => onEditNotes?.(transaction)}
      activeOpacity={0.7}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        {/* Type badge */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: typeConfig.bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          <typeConfig.Icon size={20} color={typeConfig.iconColor} />
        </View>

        {/* Main content */}
        <View style={{ flex: 1 }}>
          {/* Description + Amount */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Text
              style={{ fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, lineHeight: 20 }}
              numberOfLines={2}
            >
              {transaction.description || 'Transaksi'}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: typeConfig.amountColor }}>
              {typeConfig.amountPrefix}{formatCurrency(Math.abs(transaction.amount))}
            </Text>
          </View>

          {/* Type + Date */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: typeConfig.iconColor }}>
              {typeConfig.label}
            </Text>
            <Text style={{ fontSize: 11, color: '#d1d5db' }}>•</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>{formatDateShort(transaction.date)}</Text>
          </View>

          {/* Bank flow */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {isTransfer ? (
              <>
                <PartyChip icon={<FromBankIcon size={12} color={from.color} />} label={from.label} sub={from.sub} color={from.color} />
                <ArrowRightLeft size={10} color="#9ca3af" />
                <PartyChip icon={<ToBankIcon size={12} color={to.color} />} label={to.label} sub={to.sub} color={to.color} />
              </>
            ) : (
              <>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                  {isIncome ? 'Diterima di' : 'Dibayar dari'}
                </Text>
                <PartyChip icon={<FromBankIcon size={12} color={from.color} />} label={from.label} sub={from.sub} color={from.color} />
                {to.label !== 'Unknown' && (
                  <>
                    <Text style={{ fontSize: 11, color: '#9ca3af' }}>ke</Text>
                    <PartyChip icon={<ToBankIcon size={12} color={to.color} />} label={to.label} sub={to.sub} color={to.color} />
                  </>
                )}
              </>
            )}
          </View>

          {/* Category chip */}
          <View style={{ marginTop: 8 }}>
            {hasCategory ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: `${categoryColor}18`,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: categoryColor }} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: categoryColor }}>
                  {transaction.category}
                </Text>
              </View>
            ) : !isTransfer ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: '#fffbeb',
                  borderWidth: 1,
                  borderColor: '#fde68a',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <AlertCircle size={11} color="#d97706" />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#d97706' }}>
                  Belum dikategorikan — ketuk untuk melengkapi
                </Text>
              </View>
            ) : null}
          </View>

          {/* Notes */}
          {transaction.notes && (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }} numberOfLines={2}>
                "{transaction.notes}"
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
