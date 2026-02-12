
import React, { useState, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ChevronDown, Filter, CreditCard, Clock, Wallet, PiggyBank, PieChart as PieIcon, 
  CheckCircle2, AlertCircle, XCircle, Plus, FileUp, X, Loader2, Search, Trash2, LayoutDashboard, Database, Users, Camera, ThumbsUp, ThumbsDown, Upload, Calendar, FileText
} from 'lucide-react';
import StatCard from './components/StatCard';
import { VEXPENSES_DATA, PERIODS, COST_CENTERS, UNITS, INITIAL_COLLABORATORS, PAYMENT_METHODS } from './constants';
import { Transaction, MonthlyExpense, CategoryDistribution, Collaborator } from './types';

const App: React.FC = () => {
  // --- Global State ---
  const [transactions, setTransactions] = useState<Transaction[]>(VEXPENSES_DATA.recentTransactions.map(t => ({...t, importDate: '2024-03-01', sourceFile: 'Sistema Inicial'})));
  const [collaborators, setCollaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'imports' | 'collaborators'>('dashboard');
  
  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);
  const [selectedCostCenter, setSelectedCostCenter] = useState(COST_CENTERS[0]);
  
  // Audit Specific Filters
  const [auditImportDate, setAuditImportDate] = useState<string>('');
  const [auditSourceFile, setAuditSourceFile] = useState<string>('Todos');

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  // Form Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarUploadRef = useRef<HTMLInputElement>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);

  // --- Helpers ---
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // --- Dynamic Dashboard Data Calculation ---
  const dynamicData = useMemo(() => {
    const totalExpenses = transactions.reduce((acc, curr) => acc + curr.value, 0);
    const categoryTotals: Record<string, number> = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.value;
    });

    const categories: CategoryDistribution[] = Object.entries(categoryTotals).map(([name, value]) => {
      const percentage = Math.round((value / (totalExpenses || 1)) * 100);
      const originalColor = VEXPENSES_DATA.categories.find(c => c.name === name)?.color || '#94a3b8';
      return { name, value: percentage, color: originalColor };
    });

    const monthlyExpenses: MonthlyExpense[] = VEXPENSES_DATA.monthlyExpenses.map((m) => {
        const scale = totalExpenses / (VEXPENSES_DATA.summary.totalExpenses || 1);
        return { ...m, value: m.value * scale };
    });

    const pendingCount = transactions.filter(t => t.status === 'Em análise').length;

    return {
      summary: {
        totalExpenses,
        pendingRefunds: { value: pendingCount, trend: 'Live' },
        savingsGenerated: VEXPENSES_DATA.summary.savingsGenerated,
        corporateCardExpenses: totalExpenses * 0.27,
        avgApprovalTime: '1.2 dias'
      },
      monthlyExpenses,
      categories,
      recentTransactions: transactions
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      return selectedCostCenter === 'Todos' || t.costCenter === selectedCostCenter;
    });
  }, [selectedCostCenter, transactions]);

  // Specific filtering for Audit Tab
  const auditFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSource = auditSourceFile === 'Todos' || t.sourceFile === auditSourceFile;
      const matchImportDate = !auditImportDate || t.importDate === auditImportDate;
      return matchSource && matchImportDate;
    });
  }, [transactions, auditSourceFile, auditImportDate]);

  const uniqueSourceFiles = useMemo(() => {
    const files = Array.from(new Set(transactions.map(t => t.sourceFile).filter(Boolean)));
    return ['Todos', ...files as string[]];
  }, [transactions]);

  const pendingTransactions = useMemo(() => {
    return transactions.filter(t => t.status === 'Em análise');
  }, [transactions]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(val);

  // --- Handlers ---
  const handleAddExpense = (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);
    setIsModalOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: 'Aprovado' | 'Rejeitado') => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleAddCollaborator = (newCollab: Collaborator) => {
    setCollaborators(prev => [...prev, newCollab]);
    setTempAvatar(null);
    setIsCollabModalOpen(false);
  };

  const handleDeleteCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateAvatar = async (e: React.ChangeEvent<HTMLInputElement>, collabId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      if (collabId) {
        setCollaborators(prev => prev.map(c => c.id === collabId ? { ...c, avatar: base64 } : c));
        setTransactions(prev => prev.map(t => t.collaborator.id === collabId ? { ...t, collaborator: { ...t.collaborator, avatar: base64 } } : t));
      } else {
        setTempAvatar(base64);
      }
    } catch (err) {
      console.error("Erro ao carregar imagem:", err);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleImportExcel = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(10);

    const reader = new FileReader();
    const fileName = file.name;
    const currentImportDate = new Date().toISOString().split('T')[0];
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportProgress(50);

      const isCsv = file.name.toLowerCase().endsWith('.csv');
      let rowsToCreate = 0;
      let parsedTransactions: Transaction[] = [];

      if (isCsv && content.includes('\n')) {
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        rowsToCreate = lines.length - 1;
      } else {
        rowsToCreate = Math.max(5, Math.floor(file.size / 400));
      }

      const actualCount = Math.min(rowsToCreate, 500);

      setTimeout(() => {
        for (let i = 0; i < actualCount; i++) {
          parsedTransactions.push({
            id: `EXP-${11000 + transactions.length + i}`,
            date: new Date(Date.now() - Math.random() * 1000000000).toISOString().split('T')[0],
            importDate: currentImportDate,
            sourceFile: fileName,
            collaborator: collaborators[Math.floor(Math.random() * collaborators.length)],
            costCenter: COST_CENTERS[Math.floor(Math.random() * (COST_CENTERS.length - 1)) + 1],
            category: VEXPENSES_DATA.categories[Math.floor(Math.random() * VEXPENSES_DATA.categories.length)].name,
            value: 50 + Math.random() * 2500,
            status: 'Em análise',
            paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
            unit: UNITS[Math.floor(Math.random() * (UNITS.length - 1)) + 1],
            approvalTimeDays: 0,
            sla: { text: 'Importado Full', status: 'today' }
          });
        }

        setTransactions(prev => [...parsedTransactions, ...prev]);
        setImportProgress(100);
        
        setTimeout(() => {
          setIsImporting(false);
          setImportProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 500);
      }, 1000);
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#f2f6ff] font-sans text-slate-800">
      <div className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* Hidden Global Input for Avatar updates */}
        <input 
          type="file" 
          ref={avatarUploadRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleUpdateAvatar(e, editingCollabId || undefined)} 
        />

        {/* Header Section */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-8 divide-x divide-slate-200">
            <div className="flex items-center gap-2">
              <div className="bg-[#3378ff] p-1.5 rounded-lg">
                <Wallet className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-[#1e293b] tracking-tighter leading-none">vexpenses</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Financial Governance</span>
              </div>
            </div>
            
            <div className="pl-8 flex gap-2">
               <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
               <TabButton active={activeTab === 'collaborators'} onClick={() => setActiveTab('collaborators')} icon={<Users size={18} />} label="Colaboradores" />
               <TabButton active={activeTab === 'imports'} onClick={() => setActiveTab('imports')} icon={<Database size={18} />} label="Auditoria de Dados" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect label="C. Custo (Geral)" value={selectedCostCenter} options={COST_CENTERS} onChange={setSelectedCostCenter} />
            
            <div className="flex items-center gap-2 ml-2">
              <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
              <button 
                onClick={handleImportExcel}
                disabled={isImporting}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm shadow-sm disabled:opacity-50 ${isImporting ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-600'}`}
              >
                {isImporting ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
                {isImporting ? `Importando (${importProgress}%)` : 'Importar Planilha'}
              </button>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#3378ff] text-white rounded-xl hover:bg-blue-600 transition-all font-bold text-sm shadow-lg shadow-blue-200"
              >
                <Plus size={18} />
                Nova Despesa
              </button>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Total de Despesas" value={formatCurrency(dynamicData.summary.totalExpenses)} icon={<PieIcon size={40} className="text-orange-400" />} />
              <StatCard 
                title="Solicitações Pendentes" 
                value={dynamicData.summary.pendingRefunds.value.toString()} 
                prefix="Qtd" 
                trend={dynamicData.summary.pendingRefunds.trend} 
                variant="light-blue" 
                icon={<Wallet size={40} className="text-orange-400" />} 
                onClick={() => setIsApprovalModalOpen(true)}
              />
              <StatCard title="Economia" value={dynamicData.summary.savingsGenerated.value.toString()} prefix="" trend={dynamicData.summary.savingsGenerated.trend} icon={<PiggyBank size={40} className="text-emerald-300" />} />
              <StatCard title="Cartão Corp." value={formatCurrency(dynamicData.summary.corporateCardExpenses)} variant="light-blue" icon={<CreditCard size={40} className="text-white" />} />
              <StatCard title="Média SLA" value={dynamicData.summary.avgApprovalTime} prefix="" icon={<Clock size={40} className="text-blue-100" />} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Projeção Mensal</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dynamicData.monthlyExpenses}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val) => `R$${val/1000}k`} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(val: number) => [`R$ ${formatCurrency(val)}`, 'Valor']} />
                      <Line type="monotone" dataKey="value" stroke="#3378ff" strokeWidth={3} dot={{ fill: '#3378ff', strokeWidth: 2, r: 4, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Categorias Real-time</h3>
                <div className="flex flex-1 items-center justify-center">
                  <div className="w-full h-[280px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dynamicData.categories} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                          {dynamicData.categories.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className="text-3xl font-bold text-slate-800">{dynamicData.categories.length > 0 ? dynamicData.categories[0].value : 0}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 pl-4 min-w-[140px]">
                    {dynamicData.categories.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          <span className="text-slate-500 font-medium truncate max-w-[80px]">{cat.name}</span>
                        </div>
                        <span className="font-bold">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Fluxo de Caixa Operacional</h3>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none w-48" />
                    </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-[#f8faff] text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Colaborador</th>
                      <th className="px-6 py-4">C. Custo</th>
                      <th className="px-6 py-4">Categoria</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {filteredTransactions.slice(0, 10).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img src={tx.collaborator.avatar} className="w-8 h-8 rounded-full border border-slate-200 object-cover" alt="" />
                          <span className="font-semibold text-slate-700">{tx.collaborator.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{tx.costCenter}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{tx.category}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">R$ {formatCurrency(tx.value)}</td>
                        <td className="px-6 py-4"><StatusBadge status={tx.status} /></td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => handleDeleteTransaction(tx.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collaborators' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestão de Colaboradores</h2>
                    <p className="text-slate-500">Controle de acesso e identificação dos usuários do sistema.</p>
                </div>
                <button 
                    onClick={() => { setTempAvatar(null); setIsCollabModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3378ff] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all"
                >
                    <Plus size={18} /> Novo Colaborador
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaborators.map(collab => (
                    <div key={collab.id} className="relative p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                        <div className="absolute top-4 right-4">
                            <button 
                                onClick={() => handleDeleteCollaborator(collab.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div 
                          className="relative w-20 h-20 mb-4 cursor-pointer group/avatar"
                          onClick={() => {
                            setEditingCollabId(collab.id);
                            avatarUploadRef.current?.click();
                          }}
                        >
                            <img src={collab.avatar} className="w-full h-full rounded-full object-cover border-4 border-white shadow-md transition-transform group-hover/avatar:scale-105" alt={collab.name} />
                            <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload size={20} className="text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-[#3378ff] p-1.5 rounded-full shadow-sm border border-white text-white">
                                <Camera size={12} />
                            </div>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg">{collab.name}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{collab.department}</p>
                        <div className="mt-6 w-full flex justify-between px-4 text-[10px] font-bold text-slate-400 uppercase">
                            <span>Despesas</span>
                            <span className="text-blue-600">
                                {transactions.filter(t => t.collaborator.id === collab.id).length} itens
                            </span>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'imports' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Auditoria de Dados</h2>
                    <p className="text-slate-500">
                      Rastreabilidade total de importações. {auditFilteredTransactions.length} registros encontrados nos filtros atuais.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data de Importação</label>
                    <input 
                      type="date" 
                      value={auditImportDate}
                      onChange={(e) => setAuditImportDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <FilterSelect 
                    label="Arquivo de Origem" 
                    value={auditSourceFile} 
                    options={uniqueSourceFiles} 
                    onChange={setAuditSourceFile} 
                  />

                  <div className="flex items-end">
                    <button 
                      onClick={() => { setAuditImportDate(''); setAuditSourceFile('Todos'); }} 
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>
             </div>
             
             <div className="border rounded-2xl overflow-x-auto border-slate-100 max-h-[600px] overflow-y-auto shadow-inner bg-slate-50/20">
                <table className="w-full text-left min-w-[1500px]">
                    <thead className="bg-white sticky top-0 z-10 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider shadow-sm">
                      <tr>
                        <th className="px-4 py-4">ID_Despesa</th>
                        <th className="px-4 py-4">Data_Despesa</th>
                        <th className="px-4 py-4 bg-blue-50/30 text-blue-600"><span className="flex items-center gap-1"><Calendar size={10} /> Data_Upado</span></th>
                        <th className="px-4 py-4 bg-blue-50/30 text-blue-600"><span className="flex items-center gap-1"><FileText size={10} /> Arquivo_Origem</span></th>
                        <th className="px-4 py-4">Colaborador</th>
                        <th className="px-4 py-4">Centro_de_Custo</th>
                        <th className="px-4 py-4">Categoria</th>
                        <th className="px-4 py-4">Valor_R$</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Unidade</th>
                        <th className="px-4 py-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                        {auditFilteredTransactions.length > 0 ? auditFilteredTransactions.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50 text-xs transition-colors group">
                                <td className="px-4 py-4 font-mono font-bold text-slate-300 group-hover:text-slate-500">{t.id}</td>
                                <td className="px-4 py-4 text-slate-500">{t.date}</td>
                                <td className="px-4 py-4 font-bold text-blue-500">{t.importDate}</td>
                                <td className="px-4 py-4 font-medium text-slate-400 truncate max-w-[150px]" title={t.sourceFile}>{t.sourceFile}</td>
                                <td className="px-4 py-4 font-bold text-slate-700">{t.collaborator.name}</td>
                                <td className="px-4 py-4 text-slate-500">{t.costCenter}</td>
                                <td className="px-4 py-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold">{t.category}</span></td>
                                <td className="px-4 py-4 font-black text-slate-800">R$ {formatCurrency(t.value)}</td>
                                <td className="px-4 py-4"><StatusBadge status={t.status} /></td>
                                <td className="px-4 py-4 text-slate-500 font-medium">{t.unit}</td>
                                <td className="px-4 py-4 text-right">
                                  <button onClick={() => handleDeleteTransaction(t.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        )) : (
                          <tr>
                            <td colSpan={11} className="px-4 py-20 text-center text-slate-400">
                               <div className="flex flex-col items-center gap-2">
                                  <Search size={32} className="opacity-20" />
                                  <p className="font-bold">Nenhum registro encontrado para estes filtros.</p>
                               </div>
                            </td>
                          </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Modal Central de Aprovações */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Central de Aprovações</h2>
                <p className="text-sm text-slate-500 font-medium">Você tem {pendingTransactions.length} solicitações aguardando revisão.</p>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {pendingTransactions.length > 0 ? (
                <div className="space-y-4">
                  {pendingTransactions.map((tx) => (
                    <div key={tx.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-5">
                        <img src={tx.collaborator.avatar} className="w-12 h-12 rounded-2xl border-2 border-slate-50 shadow-sm object-cover" alt="" />
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{tx.collaborator.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tx.costCenter}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{tx.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Valor Solicitado</p>
                          <p className="text-xl font-black text-slate-800">R$ {formatCurrency(tx.value)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleUpdateStatus(tx.id, 'Rejeitado')} className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-sm transition-all"><ThumbsDown size={18} /> Rejeitar</button>
                          <button onClick={() => handleUpdateStatus(tx.id, 'Aprovado')} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold text-sm transition-all shadow-sm"><ThumbsUp size={18} /> Aprovar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6"><CheckCircle2 size={48} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Tudo em ordem!</h3>
                  <button onClick={() => setIsApprovalModalOpen(false)} className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all">Voltar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Despesa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Nova Despesa Governança</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const collabId = formData.get('collabId') as string;
              const collab = collaborators.find(c => c.id === collabId) || collaborators[0];
              const tx: Transaction = {
                id: `EXP-${Math.floor(Math.random() * 99999)}`,
                date: formData.get('date') as string,
                importDate: new Date().toISOString().split('T')[0],
                sourceFile: 'Inserção Manual',
                collaborator: collab,
                costCenter: formData.get('costCenter') as string,
                category: formData.get('category') as string,
                value: parseFloat(formData.get('value') as string),
                status: 'Em análise',
                paymentMethod: formData.get('paymentMethod') as string,
                unit: formData.get('unit') as string,
                approvalTimeDays: 0,
                sla: { text: 'Manual', status: 'today' }
              };
              handleAddExpense(tx);
            }} className="p-8 space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Colaborador</label>
                  <select required name="collabId" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Data da Despesa</label>
                  <input required name="date" type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Centro de Custo</label>
                  <select name="costCenter" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {COST_CENTERS.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoria</label>
                  <select name="category" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {VEXPENSES_DATA.categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Forma de Pagamento</label>
                  <select name="paymentMethod" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Unidade</label>
                  <select name="unit" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {UNITS.filter(u => u !== 'Todas').map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Valor (R$)</label>
                  <input required name="value" type="number" step="0.01" placeholder="0,00" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold" />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#3378ff] text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 transition-colors">Confirmar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Colaborador */}
      {isCollabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Novo Colaborador</h2>
              <button onClick={() => setIsCollabModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const photoUrl = tempAvatar || `https://i.pravatar.cc/150?u=${name}`;
              const collab: Collaborator = {
                id: `collab-${Date.now()}`,
                name,
                avatar: photoUrl,
                department: formData.get('department') as string,
              };
              handleAddCollaborator(collab);
            }} className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-24 h-24 mb-3 group cursor-pointer" onClick={() => { setEditingCollabId(null); avatarUploadRef.current?.click(); }}>
                  <img src={tempAvatar || 'https://via.placeholder.com/150?text=Upload'} className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload size={24} className="text-white" /></div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Foto de Perfil</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome Completo</label>
                <input required name="name" type="text" placeholder="Ex: Rodrigo Mendes" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Departamento / Unidade</label>
                <select name="department" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {COST_CENTERS.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCollabModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#3378ff] text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 transition-colors">Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
        {icon} {label}
    </button>
);

const FilterSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
    <div className="flex flex-col min-w-[140px]">
      <div className="relative flex items-center justify-between px-4 py-1.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all group">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-none mb-0.5">{label}</span>
          <span className="text-xs font-bold text-slate-700">{value}</span>
        </div>
        <ChevronDown size={12} className="text-slate-400 group-hover:text-blue-500 ml-2" />
        <select className="absolute opacity-0 inset-0 w-full h-full cursor-pointer" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    </div>
);

const StatusBadge: React.FC<{ status: 'Aprovado' | 'Em análise' | 'Rejeitado' }> = ({ status }) => {
  const styles = { 'Aprovado': 'bg-emerald-50 text-emerald-600 border-emerald-100', 'Em análise': 'bg-amber-50 text-amber-600 border-amber-100', 'Rejeitado': 'bg-rose-50 text-rose-600 border-rose-100' };
  const Icons = { 'Aprovado': <CheckCircle2 size={14} />, 'Em análise': <AlertCircle size={14} />, 'Rejeitado': <XCircle size={14} /> };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${styles[status]}`}>
      {Icons[status]} {status}
    </span>
  );
};

export default App;
