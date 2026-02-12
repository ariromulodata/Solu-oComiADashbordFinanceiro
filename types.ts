
export interface MonthlyExpense {
  month: string;
  value: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  department: string;
}

export interface Transaction {
  id: string;
  date: string;
  importDate?: string;
  sourceFile?: string;
  collaborator: Collaborator;
  costCenter: string;
  category: string;
  value: number;
  status: 'Aprovado' | 'Em análise' | 'Rejeitado';
  paymentMethod: string;
  unit: string;
  approvalTimeDays: number;
  sla: {
    text: string;
    status: 'on-time' | 'atraso' | 'today';
    detail?: string;
  };
}

export interface VexpensesDashboardData {
  summary: {
    totalExpenses: number;
    pendingRefunds: { value: number; trend: string };
    savingsGenerated: { value: number; trend: string };
    corporateCardExpenses: number;
    avgApprovalTime: string;
  };
  monthlyExpenses: MonthlyExpense[];
  categories: CategoryDistribution[];
  recentTransactions: Transaction[];
}
