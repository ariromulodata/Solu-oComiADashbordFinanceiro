
import { VexpensesDashboardData, Collaborator } from './types';

export const INITIAL_COLLABORATORS: Collaborator[] = [
  { id: 'c1', name: 'Ana Oliveira', avatar: 'https://i.pravatar.cc/150?u=ana', department: 'Marketing' },
  { id: 'c2', name: 'Lucas Santos', avatar: 'https://i.pravatar.cc/150?u=lucas', department: 'Filial SP' },
  { id: 'c3', name: 'Maria Pereira', avatar: 'https://i.pravatar.cc/150?u=maria', department: 'Vendas' },
  { id: 'c4', name: 'Pedro Costa', avatar: 'https://i.pravatar.cc/150?u=pedro', department: 'Financeiro' },
  { id: 'c5', name: 'André Lima', avatar: 'https://i.pravatar.cc/150?u=andre', department: 'Logística' },
  { id: 'c6', name: 'Laura Martins', avatar: 'https://i.pravatar.cc/150?u=laura', department: 'Marketing' },
];

export const VEXPENSES_DATA: VexpensesDashboardData = {
  summary: {
    totalExpenses: 310780,
    pendingRefunds: { value: 150, trend: '5,1%' },
    savingsGenerated: { value: 52, trend: '8,9%' },
    corporateCardExpenses: 84120,
    avgApprovalTime: '1,2 dias'
  },
  monthlyExpenses: [
    { month: 'Apr', value: 8000 },
    { month: 'Mai', value: 12000 },
    { month: 'Jun', value: 11000 },
    { month: 'Jul', value: 15000 },
    { month: 'Ago', value: 16000 },
    { month: 'Sep', value: 15000 },
    { month: 'Out', value: 19000 },
    { month: 'Nov', value: 25000 },
    { month: 'Dez', value: 30000 },
    { month: 'Jan', value: 32000 },
    { month: 'Fev', value: 38000 },
    { month: 'Mar', value: 41000 },
  ],
  categories: [
    { name: 'Alimentação', value: 36, color: '#3b82f6' },
    { name: 'Transporte', value: 25, color: '#10b981' },
    { name: 'Hospedagem', value: 18, color: '#f59e0b' },
    { name: 'Outros', value: 18, color: '#94a3b8' },
  ],
  recentTransactions: [
    {
      id: 'EXP-10492',
      date: '2024-03-15',
      collaborator: INITIAL_COLLABORATORS[0],
      costCenter: 'Marketing',
      category: 'Transporte',
      value: 528.50,
      status: 'Aprovado',
      paymentMethod: 'Cartão Corporativo',
      unit: 'Matriz',
      approvalTimeDays: 1,
      sla: { text: 'Dentro do prazo', status: 'on-time', detail: 'Dentro do prazo' }
    },
    {
      id: 'EXP-10493',
      date: '2024-03-18',
      collaborator: INITIAL_COLLABORATORS[1],
      costCenter: 'Filial SP',
      category: 'Alimentação',
      value: 330.00,
      status: 'Em análise',
      paymentMethod: 'Dinheiro',
      unit: 'Filial SP',
      approvalTimeDays: 0,
      sla: { text: 'Hoje', status: 'today', detail: '3d' }
    },
    {
      id: 'EXP-10494',
      date: '2024-03-20',
      collaborator: INITIAL_COLLABORATORS[2],
      costCenter: 'Vendas',
      category: 'Hospedagem',
      value: 1280.00,
      status: 'Aprovado',
      paymentMethod: 'Cartão Pessoal',
      unit: 'Filial RJ',
      approvalTimeDays: 2,
      sla: { text: 'Dentro do prazo', status: 'on-time', detail: 'Dentro do prazo' }
    }
  ]
};

export const PERIODS = ['Últimos 12 Meses', 'Este Mês', 'Este Trimestre', 'Este Ano'];
export const COST_CENTERS = ['Todos', 'Marketing', 'Vendas', 'Financeiro', 'Logística', 'Filial SP'];
export const UNITS = ['Todas', 'Matriz', 'Filial SP', 'Filial RJ'];
export const PAYMENT_METHODS = ['Cartão Corporativo', 'Cartão Pessoal', 'Dinheiro', 'Boleto'];
