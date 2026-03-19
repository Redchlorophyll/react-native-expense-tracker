import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Transaction, Bank, Cycle, AppConfig, Category, SyncState, InvestmentDistribution } from '@/types';
import { mockTransactions, mockCycles, mockBanks, mockCategories } from '@/data/mockData';

const STORAGE_KEYS = {
  transactions: '@expense-tracker/transactions',
  cycles: '@expense-tracker/cycles',
  config: '@expense-tracker/config',
  syncState: '@expense-tracker/sync-state',
  investmentDistributions: '@expense-tracker/investment-distributions',
};

// Query keys
export const queryKeys = {
  transactions: 'transactions',
  cycles: 'cycles',
  config: 'config',
  syncState: 'syncState',
  investmentDistributions: 'investmentDistributions',
};

// Default config
const defaultConfig: AppConfig = {
  cutoffDay: 25,
  banks: mockBanks,
  categories: mockCategories,
};

// Load data from AsyncStorage
async function loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return defaultValue;
  }
}

// Save data to AsyncStorage
async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

// Simulate sync with external API
async function syncWithApi(): Promise<{ transactions: Transaction[]; cycles: Cycle[] }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock data (in real app, this would fetch from server)
  return {
    transactions: mockTransactions,
    cycles: mockCycles,
  };
}

// Hook for transactions
export function useTransactions() {
  const queryClient = useQueryClient();
  
  const { data: transactions = mockTransactions, isLoading } = useQuery({
    queryKey: [queryKeys.transactions],
    queryFn: () => loadFromStorage(STORAGE_KEYS.transactions, mockTransactions),
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const current = await loadFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockTransactions);
      const updated = current.map(t => t.id === id ? { ...t, ...updates } : t);
      await saveToStorage(STORAGE_KEYS.transactions, updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([queryKeys.transactions], data);
    },
  });

  return {
    transactions,
    isLoading,
    updateTransaction: updateTransaction.mutate,
    isUpdating: updateTransaction.isPending,
  };
}

// Hook for cycles
export function useCycles() {
  const queryClient = useQueryClient();
  
  const { data: cycles = mockCycles, isLoading } = useQuery({
    queryKey: [queryKeys.cycles],
    queryFn: () => loadFromStorage(STORAGE_KEYS.cycles, mockCycles),
  });

  const updateCycle = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Cycle> }) => {
      const current = await loadFromStorage<Cycle[]>(STORAGE_KEYS.cycles, mockCycles);
      const updated = current.map(c => c.id === id ? { ...c, ...updates } : c);
      await saveToStorage(STORAGE_KEYS.cycles, updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([queryKeys.cycles], data);
    },
  });

  return {
    cycles,
    isLoading,
    updateCycle: updateCycle.mutate,
    isUpdating: updateCycle.isPending,
  };
}

// Hook for config
export function useConfig() {
  const queryClient = useQueryClient();
  
  const { data: config = defaultConfig, isLoading } = useQuery({
    queryKey: [queryKeys.config],
    queryFn: () => loadFromStorage<AppConfig>(STORAGE_KEYS.config, defaultConfig),
  });

  const updateBanks = useMutation({
    mutationFn: async (banks: Bank[]) => {
      const current = await loadFromStorage<AppConfig>(STORAGE_KEYS.config, defaultConfig);
      const updated = { ...current, banks };
      await saveToStorage(STORAGE_KEYS.config, updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([queryKeys.config], data);
    },
  });

  const updateCutoffDay = useMutation({
    mutationFn: async (cutoffDay: number) => {
      const current = await loadFromStorage<AppConfig>(STORAGE_KEYS.config, defaultConfig);
      const updated = { ...current, cutoffDay };
      await saveToStorage(STORAGE_KEYS.config, updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([queryKeys.config], data);
    },
  });

  return {
    config,
    isLoading,
    updateBanks: updateBanks.mutate,
    updateCutoffDay: updateCutoffDay.mutate,
    isUpdating: updateBanks.isPending || updateCutoffDay.isPending,
  };
}

// Hook for sync state and manual sync
export function useSync() {
  const queryClient = useQueryClient();
  
  const { data: syncState = { isSyncing: false }, isLoading } = useQuery({
    queryKey: [queryKeys.syncState],
    queryFn: () => loadFromStorage<SyncState>(STORAGE_KEYS.syncState, { isSyncing: false }),
  });

  const sync = useMutation({
    mutationFn: async () => {
      // Update sync state to syncing
      const syncingState: SyncState = { isSyncing: true };
      await saveToStorage(STORAGE_KEYS.syncState, syncingState);
      queryClient.setQueryData([queryKeys.syncState], syncingState);
      
      try {
        // Call sync API
        const { transactions, cycles } = await syncWithApi();
        
        // Save synced data
        await saveToStorage(STORAGE_KEYS.transactions, transactions);
        await saveToStorage(STORAGE_KEYS.cycles, cycles);
        
        // Update sync state to completed
        const completedState: SyncState = { 
          isSyncing: false, 
          lastSyncAt: new Date().toISOString() 
        };
        await saveToStorage(STORAGE_KEYS.syncState, completedState);
        
        return { transactions, cycles, syncState: completedState };
      } catch (error) {
        const errorState: SyncState = { 
          isSyncing: false, 
          error: error instanceof Error ? error.message : 'Sync failed' 
        };
        await saveToStorage(STORAGE_KEYS.syncState, errorState);
        throw error;
      }
    },
    onSuccess: ({ transactions, cycles, syncState }) => {
      queryClient.setQueryData([queryKeys.transactions], transactions);
      queryClient.setQueryData([queryKeys.cycles], cycles);
      queryClient.setQueryData([queryKeys.syncState], syncState);
    },
    onError: (error) => {
      queryClient.setQueryData([queryKeys.syncState], { 
        isSyncing: false, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      });
    },
  });

  return {
    syncState,
    isLoading,
    sync: sync.mutate,
    isSyncing: sync.isPending,
  };
}

// Hook for investment distributions
export function useInvestmentDistributions() {
  const queryClient = useQueryClient();

  const { data: distributions = [], isLoading } = useQuery({
    queryKey: [queryKeys.investmentDistributions],
    queryFn: () => loadFromStorage<InvestmentDistribution[]>(STORAGE_KEYS.investmentDistributions, []),
  });

  const addDistribution = useMutation({
    mutationFn: async (dist: InvestmentDistribution) => {
      const current = await loadFromStorage<InvestmentDistribution[]>(STORAGE_KEYS.investmentDistributions, []);
      const updated = [...current, dist];
      await saveToStorage(STORAGE_KEYS.investmentDistributions, updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([queryKeys.investmentDistributions], data);
    },
  });

  const deleteDistribution = useMutation({
    mutationFn: async (id: string) => {
      const current = await loadFromStorage<InvestmentDistribution[]>(STORAGE_KEYS.investmentDistributions, []);
      const updated = current.filter(d => d.id !== id);
      await saveToStorage(STORAGE_KEYS.investmentDistributions, updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([queryKeys.investmentDistributions], data);
    },
  });

  return {
    distributions,
    isLoading,
    addDistribution: addDistribution.mutate,
    deleteDistribution: deleteDistribution.mutate,
    isAdding: addDistribution.isPending,
  };
}
