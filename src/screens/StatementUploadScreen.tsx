import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  X,
} from 'lucide-react-native';
import type { UploadRecord, UploadJobStatus } from '@/types';

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_RECORDS: UploadRecord[] = [
  {
    id: '1',
    fileName: 'BCA_Statement_June2025.pdf',
    bankName: 'BCA',
    status: 'completed',
    transactionsImported: 47,
    duplicatesSkipped: 3,
    uploadedAt: '2025-07-01T08:22:00Z',
  },
  {
    id: '2',
    fileName: 'Mandiri_eStatement_May2025.pdf',
    bankName: 'Mandiri',
    status: 'completed',
    transactionsImported: 31,
    duplicatesSkipped: 0,
    uploadedAt: '2025-06-03T14:05:00Z',
  },
  {
    id: '3',
    fileName: 'BNI_Tabungan_Apr2025.pdf',
    bankName: 'BNI',
    status: 'failed',
    transactionsImported: 0,
    duplicatesSkipped: 0,
    uploadedAt: '2025-05-04T09:11:00Z',
    errorMessage: 'Format PDF tidak dikenali. Pastikan file adalah e-statement resmi bank.',
  },
  {
    id: '4',
    fileName: 'BCA_Statement_May2025.pdf',
    bankName: 'BCA',
    status: 'processing',
    transactionsImported: 0,
    duplicatesSkipped: 0,
    uploadedAt: '2025-07-02T07:00:00Z',
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface PdfEntry {
  id: string;
  fileName: string | null;
  password: string;
  showPassword: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: UploadJobStatus }) {
  const config: Record<UploadJobStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    completed: { label: 'Selesai',    bg: '#d1fae5', text: '#065f46', icon: <CheckCircle size={12} color="#059669" /> },
    processing: { label: 'Diproses', bg: '#fef3c7', text: '#92400e', icon: <Clock       size={12} color="#d97706" /> },
    pending:    { label: 'Menunggu', bg: '#e0e7ff', text: '#3730a3', icon: <Clock       size={12} color="#6366f1" /> },
    failed:     { label: 'Gagal',    bg: '#fee2e2', text: '#991b1b', icon: <XCircle     size={12} color="#dc2626" /> },
  };
  const { label, bg, text, icon } = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

// ─── Upload Record Card ───────────────────────────────────────────────────────
function UploadRecordCard({ record }: { record: UploadRecord }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardIconWrap}>
          <FileText size={20} color="#8b5cf6" />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardFileName} numberOfLines={1}>{record.fileName}</Text>
          <Text style={styles.cardMeta}>{record.bankName ?? 'Bank tidak diketahui'} · {formatDate(record.uploadedAt)}</Text>
          {record.status === 'completed' && (
            <Text style={styles.cardImported}>
              {record.transactionsImported} transaksi diimpor
              {record.duplicatesSkipped > 0 ? `, ${record.duplicatesSkipped} duplikat dilewati` : ''}
            </Text>
          )}
          {record.status === 'failed' && record.errorMessage && (
            <Text style={styles.cardError} numberOfLines={2}>{record.errorMessage}</Text>
          )}
        </View>
        <StatusBadge status={record.status} />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function StatementUploadScreen() {
  const navigation = useNavigation();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [entries, setEntries] = useState<PdfEntry[]>([
    { id: '1', fileName: null, password: '', showPassword: false },
  ]);

  // ── Entry helpers ──────────────────────────────────────────────────────────
  const addEntry = () => {
    setEntries(prev => [
      ...prev,
      { id: String(Date.now()), fileName: null, password: '', showPassword: false },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, patch: Partial<PdfEntry>) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
  };

  // Simulate file pick — replace with expo-document-picker when installed
  const pickFile = (id: string) => {
    const sampleNames = [
      'BCA_Statement_July2025.pdf',
      'Mandiri_eStatement_July2025.pdf',
      'BNI_Tabungan_July2025.pdf',
      'BRI_Rekening_July2025.pdf',
    ];
    const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    updateEntry(id, { fileName: name });
  };

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadDone(true);
    }, 1500);
  };

  const handleCloseSheet = () => {
    setSheetVisible(false);
    setUploading(false);
    setUploadDone(false);
    setEntries([{ id: '1', fileName: null, password: '', showPassword: false }]);
  };

  const canUpload = entries.some(e => e.fileName !== null);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan Bank</Text>
        <View style={styles.backBtn} />
      </View>

      {/* History list */}
      <FlatList
        data={MOCK_RECORDS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>Riwayat Upload</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <FileText size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Belum ada laporan yang diunggah</Text>
          </View>
        }
        renderItem={({ item }) => <UploadRecordCard record={item} />}
      />

      {/* Sticky Upload Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.85}
        >
          <Upload size={18} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.uploadBtnText}>Upload Laporan Baru</Text>
        </TouchableOpacity>
      </View>

      {/* ── Upload Bottom Sheet ── */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSheet}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.sheetContainer}
          >
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Upload Laporan Bank</Text>
                <Text style={styles.sheetSubtitle}>Maksimal 10 file PDF sekaligus</Text>
              </View>
              <TouchableOpacity onPress={handleCloseSheet} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {uploadDone ? (
              /* ── Success state ── */
              <View style={styles.successWrap}>
                <CheckCircle size={56} color="#10b981" />
                <Text style={styles.successTitle}>Upload Berhasil!</Text>
                <Text style={styles.successSub}>
                  File sedang diproses. Transaksi akan muncul dalam beberapa menit.
                </Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={handleCloseSheet} activeOpacity={0.85}>
                  <Text style={styles.uploadBtnText}>Selesai</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Entry list ── */
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {entries.map((entry, index) => (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryLabel}>File {index + 1}</Text>
                      {entries.length > 1 && (
                        <TouchableOpacity onPress={() => removeEntry(entry.id)} activeOpacity={0.7}>
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* File picker */}
                    <TouchableOpacity
                      style={[styles.filePicker, entry.fileName && styles.filePickerFilled]}
                      onPress={() => pickFile(entry.id)}
                      activeOpacity={0.7}
                    >
                      <FileText size={16} color={entry.fileName ? '#7c3aed' : '#9ca3af'} />
                      <Text
                        style={[styles.filePickerText, entry.fileName && styles.filePickerTextFilled]}
                        numberOfLines={1}
                      >
                        {entry.fileName ?? 'Pilih File PDF'}
                      </Text>
                    </TouchableOpacity>

                    {/* Password field */}
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Password PDF (opsional)"
                        placeholderTextColor="#9ca3af"
                        value={entry.password}
                        onChangeText={val => updateEntry(entry.id, { password: val })}
                        secureTextEntry={!entry.showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => updateEntry(entry.id, { showPassword: !entry.showPassword })}
                        style={styles.eyeBtn}
                        activeOpacity={0.7}
                      >
                        {entry.showPassword
                          ? <EyeOff size={18} color="#9ca3af" />
                          : <Eye     size={18} color="#9ca3af" />
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Add more */}
                {entries.length < 10 && (
                  <TouchableOpacity style={styles.addMoreBtn} onPress={addEntry} activeOpacity={0.7}>
                    <Plus size={16} color="#7c3aed" />
                    <Text style={styles.addMoreText}>Tambah PDF Lain</Text>
                  </TouchableOpacity>
                )}

                {/* Upload action */}
                <TouchableOpacity
                  style={[styles.uploadBtn, (!canUpload || uploading) && styles.uploadBtnDisabled]}
                  onPress={handleUpload}
                  disabled={!canUpload || uploading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.uploadBtnText}>
                    {uploading ? 'Mengupload…' : 'Mulai Upload'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseSheet} activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },

  // Header
  header: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn:     { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: 'white' },

  // List
  listContent:  { padding: 16, paddingBottom: 100 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Card
  card:        { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIconWrap:{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  cardBody:    { flex: 1 },
  cardFileName:{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  cardMeta:    { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  cardImported:{ fontSize: 12, color: '#059669' },
  cardError:   { fontSize: 12, color: '#dc2626' },

  // Badge
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Empty
  empty:     { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af' },

  // Sticky footer
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  uploadBtn:       { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  uploadBtnDisabled: { backgroundColor: '#c4b5fd' },
  uploadBtnText:   { color: 'white', fontSize: 16, fontWeight: '600' },

  // Modal overlay
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '50%' },

  dragHandle:   { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sheetTitle:   { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  sheetSubtitle:{ fontSize: 13, color: '#6b7280', marginTop: 2 },
  closeBtn:     { padding: 4 },

  sheetScroll:        { flex: 1 },
  sheetScrollContent: { padding: 20, gap: 12, paddingBottom: 32 },

  // Entry card
  entryCard:   { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, gap: 10 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryLabel:  { fontSize: 13, fontWeight: '600', color: '#374151' },

  filePicker:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed', borderRadius: 8, padding: 12, backgroundColor: '#f9fafb' },
  filePickerFilled: { borderColor: '#7c3aed', borderStyle: 'solid', backgroundColor: '#faf5ff' },
  filePickerText:       { flex: 1, fontSize: 14, color: '#9ca3af' },
  filePickerTextFilled: { color: '#7c3aed', fontWeight: '500' },

  passwordRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb' },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1f2937' },
  eyeBtn:        { padding: 10 },

  addMoreBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, justifyContent: 'center' },
  addMoreText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },

  cancelBtn:     { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#6b7280', fontSize: 15 },

  // Success
  successWrap:  { alignItems: 'center', padding: 32, gap: 16 },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  successSub:   { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});
