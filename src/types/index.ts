export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment';

export interface User {
  id: string;
  username: string;
  email: string;
}

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Verification: { email: string; username?: string; password: string; isLogin?: boolean };
};

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  fromBankId: string;
  toBankId?: string;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string;
  isTransferMatch?: boolean;
  matchedTransactionId?: string;
  /** Account holder / sender name (e.g. "Dhonni AHS") */
  fromAccountName?: string;
  /** Beneficiary / recipient name (e.g. "Herman") */
  toAccountName?: string;
  /** Override payment method label for the source when it's not a bank (e.g. "QRIS", "GoPay") */
  fromPaymentMethod?: string;
  /** Override payment method label for the destination when it's not a bank (e.g. "QRIS", "OVO") */
  toPaymentMethod?: string;
}

export interface Bank {
  id: string;
  bankId: string; // External bank identifier for merge detection
  name: string;
  color: string;
  icon: string;
  balance: number;
}

export interface Cycle {
  id: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  closedAt?: string;
  transactionIds: string[];
}

export interface AppConfig {
  cutoffDay: number;
  banks: Bank[];
  categories: Category[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface CycleSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  categoryBreakdown: Record<string, number>;
  topExpenseCategory: string;
  aiInsight: string;
}

export interface GroupedTransactions {
  cycle: Cycle;
  transactions: Transaction[];
  summary: CycleSummary;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncAt?: string;
  error?: string;
}

export interface CycleSource {
  email: string;
  bankName: string;
  reportDate: string;
  pdfFileName: string;
  pdfSizeKb: number;
}

export interface InvestmentDistribution {
  id: string;
  label: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export type RootStackParamList = {
  Main: undefined;
  CycleDetail: { cycleId: string };
  InvestmentTransactions: undefined;
  StatementUpload: undefined;
};

export type UploadJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UploadRecord {
  id: string;
  fileName: string;
  bankName?: string;
  status: UploadJobStatus;
  transactionsImported: number;
  duplicatesSkipped: number;
  uploadedAt: string;
  errorMessage?: string;
}
