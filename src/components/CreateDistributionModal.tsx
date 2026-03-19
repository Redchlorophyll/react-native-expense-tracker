import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Save, TrendingUp, AlertCircle } from 'lucide-react-native';
import type { InvestmentDistribution } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CreateDistributionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (dist: InvestmentDistribution) => void;
  totalInvestment: number;
  totalAllocated: number;
}

export function CreateDistributionModal({
  isVisible,
  onClose,
  onSave,
  totalInvestment,
  totalAllocated,
}: CreateDistributionModalProps) {
  const [label, setLabel] = useState('');
  const [amountText, setAmountText] = useState('');
  const [notes, setNotes] = useState('');

  const amount = parseFloat(amountText.replace(/[^0-9]/g, '')) || 0;
  const remaining = totalInvestment - totalAllocated;
  const isOverAllocated = amount > remaining && remaining > 0;
  const canSave = label.trim().length > 0 && amount > 0;

  const handleClose = () => {
    setLabel('');
    setAmountText('');
    setNotes('');
    onClose();
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: `dist-${Date.now()}`,
      label: label.trim(),
      amount,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    handleClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />

        <View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '90%',
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
                <TrendingUp size={18} color="#7c3aed" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                Tambah Distribusi
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
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

          {/* Remaining budget banner */}
          {totalInvestment > 0 && (
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 16,
                backgroundColor: '#f5f3ff',
                borderRadius: 14,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TrendingUp size={14} color="#7c3aed" />
              <Text style={{ fontSize: 13, color: '#5b21b6', flex: 1 }}>
                Sisa belum dialokasikan:{' '}
                <Text style={{ fontWeight: '700' }}>{formatCurrency(remaining)}</Text>
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          >
            {/* Label */}
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
              Nama Instrumen <Text style={{ color: '#ef4444' }}>*</Text>
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 13,
                color: '#111827',
                fontSize: 14,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                marginBottom: 20,
              }}
              placeholder="Contoh: Emas, Reksa Dana, Saham BBCA..."
              placeholderTextColor="#d1d5db"
              value={label}
              onChangeText={setLabel}
              returnKeyType="next"
            />

            {/* Amount */}
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
              Jumlah (Rp) <Text style={{ color: '#ef4444' }}>*</Text>
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 13,
                color: '#111827',
                fontSize: 14,
                borderWidth: 1,
                borderColor: isOverAllocated ? '#ef4444' : '#e5e7eb',
                marginBottom: isOverAllocated ? 6 : 20,
              }}
              placeholder="Contoh: 500000"
              placeholderTextColor="#d1d5db"
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="numeric"
              returnKeyType="next"
            />
            {isOverAllocated && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={13} color="#ef4444" />
                <Text style={{ fontSize: 12, color: '#ef4444' }}>
                  Melebihi sisa tidak dialokasikan ({formatCurrency(remaining)})
                </Text>
              </View>
            )}

            {/* Notes */}
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
              Catatan{' '}
              <Text style={{ fontWeight: '400', color: '#9ca3af' }}>(opsional)</Text>
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingTop: 12,
                paddingBottom: 12,
                color: '#111827',
                fontSize: 14,
                minHeight: 80,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                textAlignVertical: 'top',
                marginBottom: 8,
              }}
              multiline
              numberOfLines={3}
              placeholder="Contoh: Beli 2 gram emas antam di Pegadaian..."
              placeholderTextColor="#d1d5db"
              value={notes}
              onChangeText={setNotes}
            />
          </ScrollView>

          {/* Save button */}
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
              activeOpacity={canSave ? 0.85 : 1}
              style={{
                backgroundColor: canSave ? '#7c3aed' : '#e5e7eb',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Save size={18} color={canSave ? 'white' : '#9ca3af'} />
              <Text
                style={{ color: canSave ? 'white' : '#9ca3af', fontWeight: '700', fontSize: 15 }}
              >
                Simpan Distribusi
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
