import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Save,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Building2,
  Landmark,
  Check,
  Tag,
  StickyNote,
  Smartphone,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import type { Transaction, Bank, Category, TransactionType } from '@/types';
import { formatCurrency, formatDateShort, getBankById, getCategoryColor } from '@/lib/utils';

const bankIconMap: Record<string, LucideIcon> = {
  'building-2': Building2,
  'landmark': Landmark,
};

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

function PartyChip({ icon, label, sub, color }: { icon: React.ReactNode; label: string; sub: string | null; color: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: `${color}15`,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
      }}
    >
      {icon}
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>
        {label}{sub ? ` · ${sub}` : ''}
      </Text>
    </View>
  );
}

interface TransactionDetailModalProps {
  isVisible: boolean;
  transaction: Transaction | null;
  categories: Category[];
  banks: Bank[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<Transaction>) => void;
}

export function TransactionDetailModal({
  isVisible,
  transaction,
  categories,
  banks,
  onClose,
  onSave,
}: TransactionDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');

  useEffect(() => {
    if (transaction) {
      setNotes(transaction.notes || '');
      setSelectedCategory(transaction.category || '');
      setSelectedType(transaction.type);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isIncome = selectedType === 'income';
  const isExpense = selectedType === 'expense';
  const isTransfer = selectedType === 'transfer';
  const isInvestment = selectedType === 'investment';

  const fromBank = getBankById(banks, transaction.fromBankId);
  const toBank = transaction.toBankId ? getBankById(banks, transaction.toBankId) : null;

  const from = buildPartyLabel(transaction.fromPaymentMethod, fromBank, transaction.fromAccountName);
  const to = buildPartyLabel(transaction.toPaymentMethod, toBank, transaction.toAccountName);

  const FromBankIcon = (!transaction.fromPaymentMethod && fromBank) ? (bankIconMap[fromBank.icon] || Building2) : Smartphone;
  const ToBankIcon = (!transaction.toPaymentMethod && toBank) ? (bankIconMap[toBank.icon] || Building2) : Smartphone;

  const typeConfig = isIncome
    ? { label: 'Pemasukan', bgColor: '#d1fae5', iconColor: '#10b981', Icon: ArrowDownLeft, amountPrefix: '+', amountColor: '#10b981' }
    : isExpense
    ? { label: 'Pengeluaran', bgColor: '#fee2e2', iconColor: '#ef4444', Icon: ArrowUpRight, amountPrefix: '-', amountColor: '#ef4444' }
    : isInvestment
    ? { label: 'Investasi', bgColor: '#ede9fe', iconColor: '#7c3aed', Icon: TrendingUp, amountPrefix: '-', amountColor: '#7c3aed' }
    : { label: 'Transfer', bgColor: '#f3f4f6', iconColor: '#6b7280', Icon: ArrowRightLeft, amountPrefix: '', amountColor: '#6b7280' };

  // Show only categories matching the transaction type
  const availableCategories = categories.filter(c =>
    isIncome ? c.type === 'income' : isExpense ? c.type === 'expense' : false
  );

  const handleSave = () => {
    const updates: Partial<Transaction> = { notes: notes.trim() };
    if (selectedCategory) updates.category = selectedCategory;
    if (selectedType !== transaction.type) updates.type = selectedType;
    onSave(transaction.id, updates);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}>
        {/* Tappable backdrop above the sheet */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        {/* Sheet pinned to the bottom */}
        <View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '92%',
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb' }} />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
              Detail Transaksi
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#f3f4f6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Scrollable content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* ── Transaction info card ── */}
            <View
              style={{
                marginHorizontal: 20,
                backgroundColor: '#f9fafb',
                borderRadius: 20,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#f3f4f6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                {/* Type icon */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: typeConfig.bgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <typeConfig.Icon size={22} color={typeConfig.iconColor} />
                </View>

                <View style={{ flex: 1 }}>
                  {/* Description */}
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', lineHeight: 22 }}>
                    {transaction.description || 'Transaksi'}
                  </Text>

                  {/* Amount */}
                  <Text
                    style={{ fontSize: 22, fontWeight: '800', color: typeConfig.amountColor, marginTop: 4 }}
                  >
                    {typeConfig.amountPrefix}{formatCurrency(Math.abs(transaction.amount))}
                  </Text>

                  {/* Type badge + Date */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: typeConfig.bgColor,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: typeConfig.iconColor }}>
                        {typeConfig.label}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      {formatDateShort(transaction.date)}
                    </Text>
                  </View>

                  {/* Bank flow */}
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 10 }}
                  >
                    {isTransfer ? (
                      <>
                        <PartyChip icon={<FromBankIcon size={13} color={from.color} />} label={from.label} sub={from.sub} color={from.color} />
                        <ArrowRightLeft size={13} color="#9ca3af" />
                        <PartyChip icon={<ToBankIcon size={13} color={to.color} />} label={to.label} sub={to.sub} color={to.color} />
                      </>
                    ) : (
                      <>
                        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                          {isIncome ? 'Diterima di' : isInvestment ? 'Diinvestasikan dari' : 'Dibayar dari'}
                        </Text>
                        <PartyChip icon={<FromBankIcon size={13} color={from.color} />} label={from.label} sub={from.sub} color={from.color} />
                        {to.label !== 'Unknown' && (
                          <>
                            <Text style={{ fontSize: 12, color: '#9ca3af' }}>ke</Text>
                            <PartyChip icon={<ToBankIcon size={13} color={to.color} />} label={to.label} sub={to.sub} color={to.color} />
                          </>
                        )}
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* ── Type toggle (expense ↔ investment) ── */}
            {(transaction.type === 'expense' || transaction.type === 'investment') && (
              <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <TrendingUp size={15} color="#7c3aed" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Tipe Transaksi</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['expense', 'investment'] as TransactionType[]).map(type => {
                    const isSelected = selectedType === type;
                    const label = type === 'expense' ? 'Pengeluaran' : 'Investasi';
                    const activeColor = type === 'expense' ? '#ef4444' : '#7c3aed';
                    const activeBg = type === 'expense' ? '#fee2e2' : '#ede9fe';
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setSelectedType(type)}
                        activeOpacity={0.75}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 11,
                          borderRadius: 14,
                          borderWidth: 1.5,
                          borderColor: isSelected ? activeColor : '#e5e7eb',
                          backgroundColor: isSelected ? activeBg : 'white',
                        }}
                      >
                        {isSelected && <Check size={13} color={activeColor} />}
                        <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '500', color: isSelected ? activeColor : '#9ca3af' }}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Category picker ── */}
            {isIncome || isExpense ? (
              <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Tag size={15} color="#7c3aed" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Kategori</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
                  {isIncome
                    ? 'Pilih sumber penghasilan untuk transaksi ini'
                    : 'Pilih jenis pengeluaran untuk transaksi ini'}
                </Text>

                {/* Chip grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {/* Default: Tidak Dikategorikan */}
                  {(() => {
                    const isSelected = selectedCategory === '';
                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedCategory('')}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: 999,
                          borderWidth: 1.5,
                          borderColor: isSelected ? '#6b7280' : '#e5e7eb',
                          backgroundColor: isSelected ? '#f3f4f6' : 'white',
                        }}
                      >
                        {isSelected && <Check size={12} color="#6b7280" />}
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? '#374151' : '#9ca3af',
                          }}
                        >
                          Tidak Dikategorikan
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}

                  {availableCategories.map(cat => {
                    const isSelected = selectedCategory === cat.name;
                    const catColor = getCategoryColor(categories, cat.name);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setSelectedCategory(isSelected ? '' : cat.name)}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: 999,
                          borderWidth: 1.5,
                          borderColor: isSelected ? catColor : '#e5e7eb',
                          backgroundColor: isSelected ? `${catColor}18` : 'white',
                        }}
                      >
                        {isSelected && <Check size={12} color={catColor} />}
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? catColor : '#6b7280',
                          }}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : isInvestment ? (
              <View
                style={{
                  marginHorizontal: 20,
                  marginBottom: 20,
                  backgroundColor: '#ede9fe',
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <TrendingUp size={16} color="#7c3aed" />
                <Text style={{ fontSize: 13, color: '#5b21b6', flex: 1 }}>
                  Transaksi investasi tidak dikategorikan dalam pengeluaran
                </Text>
              </View>
            ) : (
              <View
                style={{
                  marginHorizontal: 20,
                  marginBottom: 20,
                  backgroundColor: '#f9fafb',
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <ArrowRightLeft size={16} color="#9ca3af" />
                <Text style={{ fontSize: 13, color: '#9ca3af', flex: 1 }}>
                  Transaksi transfer tidak memerlukan kategori
                </Text>
              </View>
            )}

            {/* ── Notes input ── */}
            <View style={{ marginHorizontal: 20, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <StickyNote size={15} color="#7c3aed" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Catatan</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
                Tambahkan keterangan tambahan (opsional)
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingTop: 12,
                  paddingBottom: 12,
                  color: '#111827',
                  fontSize: 14,
                  minHeight: 96,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  textAlignVertical: 'top',
                }}
                multiline
                numberOfLines={4}
                placeholder="Contoh: Pembayaran dari client proyek website..."
                placeholderTextColor="#d1d5db"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* ── Sticky save button (outside ScrollView) ── */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 36,
              borderTopWidth: 1,
              borderTopColor: '#f3f4f6',
              backgroundColor: 'white',
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#7c3aed',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Save size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
                Simpan Perubahan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
