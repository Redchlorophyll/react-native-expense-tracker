import type { Transaction, Cycle, Bank, CycleSummary, Category } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

export function getCycleDates(cutoffDay: number, date: Date = new Date()): { startDate: string; endDate: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  let startDate: Date;
  let endDate: Date;

  if (day >= cutoffDay) {
    startDate = new Date(year, month, cutoffDay);
    endDate = new Date(year, month + 1, cutoffDay - 1);
  } else {
    startDate = new Date(year, month - 1, cutoffDay);
    endDate = new Date(year, month, cutoffDay - 1);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

export function getCycleLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startMonth = start.toLocaleDateString('id-ID', { month: 'short' });
  const endMonth = end.toLocaleDateString('id-ID', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

export function groupTransactionsByCycle(
  transactions: Transaction[],
  cycles: Cycle[],
  cutoffDay: number
): { cycle: Cycle; transactions: Transaction[] }[] {
  const sortedCycles = [...cycles].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const cycleMap = new Map<string, Transaction[]>();
  
  sortedCycles.forEach(cycle => {
    cycleMap.set(cycle.id, []);
  });

  const currentCycleDates = getCycleDates(cutoffDay);
  let currentCycle = sortedCycles.find(c => !c.isClosed);
  
  if (!currentCycle) {
    currentCycle = {
      id: 'current',
      ...currentCycleDates,
      isClosed: false,
      transactionIds: [],
    };
    cycleMap.set(currentCycle.id, []);
  }

  transactions.forEach(transaction => {
    const transDate = new Date(transaction.date);
    
    let assignedCycle = sortedCycles.find(cycle => {
      const start = new Date(cycle.startDate);
      const end = new Date(cycle.endDate);
      return transDate >= start && transDate <= end;
    });

    if (!assignedCycle) {
      assignedCycle = currentCycle;
    }

    const cycleTransactions = cycleMap.get(assignedCycle.id) || [];
    cycleTransactions.push(transaction);
    cycleMap.set(assignedCycle.id, cycleTransactions);
  });

  const result: { cycle: Cycle; transactions: Transaction[] }[] = [];
  
  if (currentCycle && (cycleMap.get(currentCycle.id)?.length || sortedCycles.length === 0)) {
    result.push({
      cycle: currentCycle,
      transactions: cycleMap.get(currentCycle.id) || [],
    });
  }

  sortedCycles.forEach(cycle => {
    if (cycle.id !== currentCycle?.id) {
      result.push({
        cycle,
        transactions: cycleMap.get(cycle.id) || [],
      });
    }
  });

  return result;
}

export function detectTransferTransactions(transactions: Transaction[]): Transaction[] {
  const updatedTransactions = [...transactions];
  
  for (let i = 0; i < updatedTransactions.length; i++) {
    const t1 = updatedTransactions[i];
    
    if (t1.isTransferMatch) continue;
    
    for (let j = i + 1; j < updatedTransactions.length; j++) {
      const t2 = updatedTransactions[j];
      
      if (t2.isTransferMatch) continue;
      
      const isOppositeAmount = Math.abs(t1.amount) === Math.abs(t2.amount);
      const isOppositeType = (t1.type === 'expense' && t2.type === 'income') || 
                             (t1.type === 'income' && t2.type === 'expense');
      const isDifferentBank = t1.fromBankId !== t2.fromBankId;
      const isCloseDate = Math.abs(
        new Date(t1.date).getTime() - new Date(t2.date).getTime()
      ) < 24 * 60 * 60 * 1000;
      
      if (isOppositeAmount && isOppositeType && isDifferentBank && isCloseDate) {
        updatedTransactions[i] = {
          ...t1,
          type: 'transfer',
          isTransferMatch: true,
          matchedTransactionId: t2.id,
        };
        updatedTransactions[j] = {
          ...t2,
          type: 'transfer',
          isTransferMatch: true,
          matchedTransactionId: t1.id,
        };
        break;
      }
    }
  }
  
  return updatedTransactions;
}

export function generateCycleSummary(
  transactions: Transaction[],
  _banks: Bank[]
): CycleSummary {
  const categoryBreakdown: Record<string, number> = {};
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'transfer') return;
    
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += Math.abs(t.amount);
    }

    const category = t.category || 'Uncategorized';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 
      (t.type === 'expense' ? Math.abs(t.amount) : 0);
  });

  let topExpenseCategory = 'None';
  let maxExpense = 0;
  
  Object.entries(categoryBreakdown).forEach(([category, amount]) => {
    if (amount > maxExpense) {
      maxExpense = amount;
      topExpenseCategory = category;
    }
  });

  const aiInsight = generateAIInsight(
    totalIncome,
    totalExpense,
    topExpenseCategory,
    categoryBreakdown
  );

  return {
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    categoryBreakdown,
    topExpenseCategory,
    aiInsight,
  };
}

function generateAIInsight(
  totalIncome: number,
  totalExpense: number,
  topExpenseCategory: string,
  _categoryBreakdown: Record<string, number>
): string {
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : '0';
  
  if (totalIncome === 0 && totalExpense === 0) {
    return "Belum ada transaksi. Mulai tambahkan pemasukan dan pengeluaran Anda!";
  }

  if (totalExpense > totalIncome) {
    return `Anda membelanjakan ${formatCurrency(totalExpense - totalIncome)} lebih banyak dari penghasilan. ${topExpenseCategory !== 'None' ? `Pengeluaran terbesar Anda adalah ${topExpenseCategory}. Pertimbangkan untuk mengurangi pengeluaran di kategori tersebut.` : ''}`;
  }

  if (Number(savingsRate) > 20) {
    return `Bagus! Anda menabung ${savingsRate}% dari penghasilan. ${topExpenseCategory !== 'None' ? `Kategori pengeluaran terbesar Anda adalah ${topExpenseCategory}.` : ''}`;
  }

  if (Number(savingsRate) > 0) {
    return `Anda menabung ${savingsRate}% dari penghasilan. Coba tingkatkan menjadi minimal 20%. ${topExpenseCategory !== 'None' ? `Perhatikan pengeluaran ${topExpenseCategory} Anda - itu pengeluaran terbesar.` : ''}`;
  }

  return `Anda impas (break even). ${topExpenseCategory !== 'None' ? `Pengeluaran ${topExpenseCategory} Anda tertinggi. Coba kurangi di sana.` : ''}`;
}

export function getBankById(banks: Bank[], id: string): Bank | undefined {
  return banks.find(b => b.id === id);
}

export function getCategoryIcon(categories: Category[], name: string): string {
  const category = categories.find(c => c.name === name);
  return category?.icon || 'circle';
}

export function getCategoryColor(categories: Category[], name: string): string {
  const category = categories.find(c => c.name === name);
  return category?.color || '#6b7280';
}
