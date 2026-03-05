import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity } from 'react-native';
import { X, Save } from 'lucide-react-native';
import type { Transaction } from '@/types';

interface EditNotesModalProps {
  isVisible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (id: string, notes: string) => void;
}

export function EditNotesModal({ isVisible, transaction, onClose, onSave }: EditNotesModalProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (transaction) {
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  const handleSave = () => {
    if (transaction) {
      onSave(transaction.id, notes);
    }
    onClose();
  };

  if (!transaction) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">Edit Catatan</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Transaction Info */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-sm font-medium text-gray-700">{transaction.description}</Text>
            <Text className="text-xs text-gray-500 mt-1">{transaction.category}</Text>
          </View>

          {/* Notes Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Catatan</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 text-gray-900 min-h-[100px]"
              multiline
              numberOfLines={4}
              placeholder="Tambahkan catatan..."
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
            >
              <Text className="font-medium text-gray-700">Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 py-3 bg-violet-600 rounded-xl items-center flex-row justify-center gap-2"
            >
              <Save size={18} color="white" />
              <Text className="font-medium text-white">Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
