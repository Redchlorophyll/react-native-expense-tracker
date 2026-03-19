import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Mail, FileText, Download, Calendar } from 'lucide-react-native';
import type { CycleSource } from '@/types';
import { formatDate } from '@/lib/utils';

interface SourceInfoModalProps {
  isVisible: boolean;
  cycleLabel: string;
  sources: CycleSource[];
  onClose: () => void;
}

export function SourceInfoModal({ isVisible, cycleLabel, sources, onClose }: SourceInfoModalProps) {
  const handleDownload = (source: CycleSource) => {
    Alert.alert(
      'Unduh Laporan',
      `File "${source.pdfFileName}" akan diunduh.\n\n(Fitur unduh akan tersedia setelah integrasi backend.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        {/* Tappable backdrop above sheet */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        {/* Sheet */}
        <View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 32,
            maxHeight: '80%',
          }}
        >
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb' }} />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}
            >
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                  Sumber Data
                </Text>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  {cycleLabel}
                </Text>
              </View>
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

            {/* Content */}
            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              {sources.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14 }}>Tidak ada sumber data.</Text>
                </View>
              ) : (
                sources.map((source, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#f3f4f6',
                    }}
                  >
                    {/* Bank name */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: '#ede9fe',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: '#7c3aed', fontWeight: '600', fontSize: 13 }}>
                          {source.bankName}
                        </Text>
                      </View>
                    </View>

                    {/* Email */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <View style={{ marginTop: 1 }}>
                        <Mail size={15} color="#8b5cf6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>
                          Dikirim dari Email
                        </Text>
                        <Text style={{ fontSize: 13, color: '#374151', fontWeight: '500' }}>
                          {source.email}
                        </Text>
                      </View>
                    </View>

                    {/* Report date */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <View style={{ marginTop: 1 }}>
                        <Calendar size={15} color="#8b5cf6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>
                          Tanggal Laporan
                        </Text>
                        <Text style={{ fontSize: 13, color: '#374151', fontWeight: '500' }}>
                          {formatDate(source.reportDate)}
                        </Text>
                      </View>
                    </View>

                    {/* PDF file */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        marginTop: 4,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <FileText size={20} color="#ef4444" />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ fontSize: 12, color: '#111827', fontWeight: '500' }}
                            numberOfLines={1}
                          >
                            {source.pdfFileName}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                            PDF • {source.pdfSizeKb} KB
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDownload(source)}
                        style={{
                          backgroundColor: '#ede9fe',
                          borderRadius: 8,
                          padding: 8,
                          marginLeft: 8,
                        }}
                      >
                        <Download size={16} color="#7c3aed" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
      </View>
    </Modal>
  );
}
