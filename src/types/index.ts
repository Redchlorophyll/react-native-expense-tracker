export type TransactionType = 'income' | 'expense' | 'transfer';

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
