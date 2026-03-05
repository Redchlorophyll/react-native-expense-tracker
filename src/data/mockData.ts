import type { Transaction, Cycle, Bank, Category } from '@/types';

export const mockBanks: Bank[] = [
  { 
    id: 'bank-1', 
    bankId: 'BCA-001', // External bank identifier for merge detection
    name: 'BCA', 
    color: '#0051A1', 
    icon: 'building-2', 
    balance: 15000000 
  },
  { 
    id: 'bank-2', 
    bankId: 'MANDIRI-001', // External bank identifier for merge detection
    name: 'Mandiri', 
    color: '#F4B932', 
    icon: 'landmark', 
    balance: 8500000 
  },
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Gaji', icon: 'briefcase', color: '#10b981', type: 'income' },
  { id: 'cat-2', name: 'Freelance', icon: 'laptop', color: '#3b82f6', type: 'income' },
  { id: 'cat-3', name: 'Investasi', icon: 'trending-up', color: '#8b5cf6', type: 'income' },
  { id: 'cat-4', name: 'Makanan', icon: 'utensils', color: '#ef4444', type: 'expense' },
  { id: 'cat-5', name: 'Transportasi', icon: 'car', color: '#f59e0b', type: 'expense' },
  { id: 'cat-6', name: 'Belanja', icon: 'shopping-bag', color: '#ec4899', type: 'expense' },
  { id: 'cat-7', name: 'Tagihan', icon: 'receipt', color: '#6366f1', type: 'expense' },
  { id: 'cat-8', name: 'Hiburan', icon: 'film', color: '#14b8a6', type: 'expense' },
  { id: 'cat-9', name: 'Kesehatan', icon: 'heart', color: '#ef4444', type: 'expense' },
  { id: 'cat-10', name: 'Transfer', icon: 'arrow-right-left', color: '#6b7280', type: 'expense' },
];

// Cycle 1: January 25 - February 24, 2025 (Closed)
export const mockCycle1: Cycle = {
  id: 'cycle-1',
  startDate: '2025-01-25',
  endDate: '2025-02-24',
  isClosed: true,
  closedAt: '2025-02-25T00:00:00Z',
  transactionIds: [],
};

// Cycle 2: February 25 - March 24, 2025 (Current/Open)
export const mockCycle2: Cycle = {
  id: 'cycle-2',
  startDate: '2025-02-25',
  endDate: '2025-03-24',
  isClosed: false,
  transactionIds: [],
};

// Transactions for Cycle 1 (January 25 - February 24, 2025)
export const mockTransactionsCycle1: Transaction[] = [
  // Income
  {
    id: 't1-1',
    amount: 15000000,
    description: 'Gaji Bulan Januari',
    fromBankId: 'bank-1',
    type: 'income',
    category: 'Gaji',
    date: '2025-01-25',
    notes: 'Gaji pokok + tunjangan',
  },
  {
    id: 't1-2',
    amount: 3500000,
    description: 'Project Freelance Website',
    fromBankId: 'bank-2',
    type: 'income',
    category: 'Freelance',
    date: '2025-02-05',
    notes: 'Pembayaran dari client A',
  },
  // Expenses
  {
    id: 't1-3',
    amount: 2500000,
    description: 'Sewa Apartemen',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Tagihan',
    date: '2025-01-28',
    notes: 'Apartemen Jakarta Selatan',
  },
  {
    id: 't1-4',
    amount: 850000,
    description: 'Belanja Mingguan',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Belanja',
    date: '2025-01-30',
    notes: 'Supermarket Indomaret',
  },
  {
    id: 't1-5',
    amount: 1200000,
    description: 'Makan di Luar',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Makanan',
    date: '2025-02-03',
    notes: 'Team lunch dan dinner',
  },
  {
    id: 't1-6',
    amount: 600000,
    description: 'Bensin Motor',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Transportasi',
    date: '2025-02-08',
    notes: 'Pertamina',
  },
  {
    id: 't1-7',
    amount: 450000,
    description: 'Nonton Bioskop',
    fromBankId: 'bank-2',
    type: 'expense',
    category: 'Hiburan',
    date: '2025-02-10',
    notes: 'Avatar 3 dengan teman',
  },
  {
    id: 't1-8',
    amount: 750000,
    description: 'Listrik & Internet',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Tagihan',
    date: '2025-02-15',
    notes: 'PLN dan Indihome',
  },
  {
    id: 't1-9',
    amount: 500000,
    description: 'Beli Obat',
    fromBankId: 'bank-2',
    type: 'expense',
    category: 'Kesehatan',
    date: '2025-02-18',
    notes: 'Flu dan vitamin',
  },
  // Transfer (BCA to Mandiri)
  {
    id: 't1-10',
    amount: 2000000,
    description: 'Transfer ke Mandiri',
    fromBankId: 'bank-1',
    toBankId: 'bank-2',
    type: 'transfer',
    category: 'Transfer',
    date: '2025-02-12',
    notes: 'Untuk tabungan',
    isTransferMatch: true,
    matchedTransactionId: 't1-11',
  },
  {
    id: 't1-11',
    amount: 2000000,
    description: 'Transfer dari BCA',
    fromBankId: 'bank-2',
    toBankId: 'bank-1',
    type: 'transfer',
    category: 'Transfer',
    date: '2025-02-12',
    notes: 'Diterima dari BCA',
    isTransferMatch: true,
    matchedTransactionId: 't1-10',
  },
];

// Transactions for Cycle 2 (February 25 - March 24, 2025)
export const mockTransactionsCycle2: Transaction[] = [
  // Income
  {
    id: 't2-1',
    amount: 15000000,
    description: 'Gaji Bulan Februari',
    fromBankId: 'bank-1',
    type: 'income',
    category: 'Gaji',
    date: '2025-02-25',
    notes: 'Gaji pokok + tunjangan',
  },
  {
    id: 't2-2',
    amount: 5200000,
    description: 'Dividen Saham',
    fromBankId: 'bank-2',
    type: 'income',
    category: 'Investasi',
    date: '2025-03-05',
    notes: 'Dividen Q1 2025',
  },
  {
    id: 't2-3',
    amount: 2800000,
    description: 'Project Mobile App',
    fromBankId: 'bank-1',
    type: 'income',
    category: 'Freelance',
    date: '2025-03-10',
    notes: 'Final payment project B',
  },
  // Expenses
  {
    id: 't2-4',
    amount: 2500000,
    description: 'Sewa Apartemen',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Tagihan',
    date: '2025-02-28',
    notes: 'Apartemen Jakarta Selatan',
  },
  {
    id: 't2-5',
    amount: 1500000,
    description: 'Belanja Bulanan',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Belanja',
    date: '2025-03-02',
    notes: 'Supermarket dan kebutuhan rumah',
  },
  {
    id: 't2-6',
    amount: 950000,
    description: 'Makan di Restoran',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Makanan',
    date: '2025-03-04',
    notes: 'Anniversary dinner',
  },
  {
    id: 't2-7',
    amount: 800000,
    description: 'Grab & Gojek',
    fromBankId: 'bank-2',
    type: 'expense',
    category: 'Transportasi',
    date: '2025-03-06',
    notes: 'Transportasi online',
  },
  {
    id: 't2-8',
    amount: 1200000,
    description: 'Streaming & Game',
    fromBankId: 'bank-2',
    type: 'expense',
    category: 'Hiburan',
    date: '2025-03-08',
    notes: 'Netflix, Spotify, Steam',
  },
  {
    id: 't2-9',
    amount: 650000,
    description: 'Listrik',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Tagihan',
    date: '2025-03-12',
    notes: 'Tagihan PLN',
  },
  {
    id: 't2-10',
    amount: 350000,
    description: 'Check Up',
    fromBankId: 'bank-2',
    type: 'expense',
    category: 'Kesehatan',
    date: '2025-03-15',
    notes: 'Medical check up tahunan',
  },
  {
    id: 't2-11',
    amount: 750000,
    description: 'Coffee Shop',
    fromBankId: 'bank-1',
    type: 'expense',
    category: 'Makanan',
    date: '2025-03-18',
    notes: 'Starbucks dan kopi lokal',
  },
  // Transfer (Mandiri to BCA)
  {
    id: 't2-12',
    amount: 3000000,
    description: 'Transfer ke BCA',
    fromBankId: 'bank-2',
    toBankId: 'bank-1',
    type: 'transfer',
    category: 'Transfer',
    date: '2025-03-14',
    notes: 'Untuk bayar tagihan',
    isTransferMatch: true,
    matchedTransactionId: 't2-13',
  },
  {
    id: 't2-13',
    amount: 3000000,
    description: 'Transfer dari Mandiri',
    fromBankId: 'bank-1',
    toBankId: 'bank-2',
    type: 'transfer',
    category: 'Transfer',
    date: '2025-03-14',
    notes: 'Diterima dari Mandiri',
    isTransferMatch: true,
    matchedTransactionId: 't2-12',
  },
];

// Combine all transactions
export const mockTransactions: Transaction[] = [
  ...mockTransactionsCycle1,
  ...mockTransactionsCycle2,
];

// Combine all cycles
export const mockCycles: Cycle[] = [mockCycle1, mockCycle2];
