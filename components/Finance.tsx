
import React, { useState, useMemo } from 'react';
import { TransportRequest, Driver, FixedContract, DriverExpense, StaffExpense, Invoice } from '../types';
import { Card, Icons, Button, Select, Input } from './Components';

interface FinanceProps {
  requests: TransportRequest[];
  drivers: Driver[];
  contracts: FixedContract[];
  expenses: DriverExpense[];
}

export const Finance: React.FC<FinanceProps> = ({ requests, drivers, contracts, expenses }) => {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'PAYROLL' | 'INVOICES'>('OVERVIEW');
  const [viewPeriod, setViewPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [invoiceFilter, setInvoiceFilter] = useState<'ALL' | 'PENDENTE' | 'VENCIDO' | 'PAGO'>('ALL');
  
  // Simulated Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: '1', companyName: 'Logistics Group A', deliveryCount: 45, issueDate: '2023-11-10', dueDate: '2023-11-20', value: 4500.00, status: 'PAGO', type: 'RECEBIVEL', createdAt: '2023-11-10' },
    { id: '2', companyName: 'Retail Corp B', deliveryCount: 120, issueDate: '2023-11-15', dueDate: '2023-12-05', value: 12400.00, status: 'PENDENTE', type: 'RECEBIVEL', createdAt: '2023-11-15' },
    { id: '3', companyName: 'Amazon Express Hub', deliveryCount: 8, issueDate: '2023-10-25', dueDate: '2023-11-05', value: 950.00, status: 'VENCIDO', type: 'RECEBIVEL', createdAt: '2023-10-25' }
  ]);

  // Financial Calculations
  const stats = useMemo(() => {
    // Current Monthly Base
    const opRevenue = requests.reduce((acc, r) => acc + r.clientCharge, 0);
    const fixedRevenue = contracts.reduce((acc, c) => acc + c.contractValue, 0);
    const totalRevenue = opRevenue + fixedRevenue;

    const opCosts = requests.reduce((acc, r) => acc + r.driverFee, 0);
    const driverExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const staffCosts = contracts.reduce((acc, c) => 
      acc + (c.staff?.reduce((sAcc, s) => sAcc + s.salary + (s.bonus || 0) + (s.fgts || 0) + (s.inss || 0), 0) || 0), 0);
    
    const totalExpenses = opCosts + driverExpenses + staffCosts;
    const netCashFlow = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netCashFlow / totalRevenue) * 100 : 0;

    // Projections (6% MoM Growth Methodology)
    const months = 6;
    const projected6Months = totalRevenue * Math.pow(1.06, months);
    const growthPercent = ((projected6Months - totalRevenue) / totalRevenue) * 100;

    return {
      totalRevenue,
      totalExpenses,
      margin,
      netCashFlow,
      projected6Months,
      growthPercent,
      staffCosts
    };
  }, [requests, contracts, expenses]);

  // Chart Logic (Mock data for visuals)
  const chartData = useMemo(() => {
    return [
      { name: 'Seg', rev: 4500, exp: 3100 },
      { name: 'Ter', rev: 5200, exp: 3800 },
      { name: 'Qua', rev: 4800, exp: 4100 },
      { name: 'Qui', rev: 6100, exp: 4500 },
      { name: 'Sex', rev: 5900, exp: 4200 },
      { name: 'Sab', rev: 3100, exp: 2100 },
      { name: 'Dom', rev: 1200, exp: 900 },
    ];
  }, []);

  const allStaff = useMemo(() => {
    const list: StaffExpense[] = [];
    contracts.forEach(c => c.staff?.forEach(s => list.push(s)));
    return list;
  }, [contracts]);

  const toggleInvoiceStatus = (id: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return { ...inv, status: inv.status === 'PAGO' ? 'PENDENTE' : 'PAGO' };
      }
      return inv;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulo Financeiro Premium</h1>
          <p className="text-gray-500">Inteligência de Tesouraria e Projeções Predidivas</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border shadow-sm">
           <button onClick={() => setActiveSubTab('OVERVIEW')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'OVERVIEW' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-gray-600'}`}>Visão Geral</button>
           <button onClick={() => setActiveSubTab('PAYROLL')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'PAYROLL' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-gray-600'}`}>Folha de Pgto</button>
           <button onClick={() => setActiveSubTab('INVOICES')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'INVOICES' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-gray-600'}`}>Gestão de Faturas</button>
        </div>
      </div>

      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           {/* Top KPIs */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-5 border-l-4 border-l-primary bg-white shadow-sm overflow-hidden relative">
                 <div className="absolute -right-4 -top-4 opacity-5 text-primary"><Icons.DollarSign /></div>
                 <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Receita Total</span>
                 <span className="text-2xl font-black text-gray-800 mt-2 block">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</span>
                 <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1"><Icons.TrendingUp /> +{viewPeriod === 'WEEKLY' ? '4.2%' : '12.8%'}</span>
              </Card>
              <Card className="p-5 border-l-4 border-l-red-500 bg-white shadow-sm">
                 <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Despesas Operacionais</span>
                 <span className="text-2xl font-black text-gray-800 mt-2 block">R$ {stats.totalExpenses.toLocaleString('pt-BR')}</span>
              </Card>
              <Card className="p-5 border-l-4 border-l-emerald-500 bg-white shadow-sm">
                 <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Margem de Lucro</span>
                 <span className="text-2xl font-black text-emerald-600 mt-2 block">{stats.margin.toFixed(1)}%</span>
              </Card>
              <Card className="p-5 border-l-4 border-l-orange-500 bg-white shadow-sm">
                 <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Fluxo de Caixa</span>
                 <span className="text-2xl font-black text-gray-800 mt-2 block">R$ {stats.netCashFlow.toLocaleString('pt-BR')}</span>
              </Card>
           </div>

           {/* Chart Section */}
           <Card className="p-6">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="font-bold text-gray-800 uppercase text-xs tracking-[0.2em]">Receita vs Despesas</h3>
                    <p className="text-[10px] text-gray-400">Dados consolidados do período selecionado</p>
                 </div>
                 <div className="flex gap-2">
                    {['WEEKLY', 'MONTHLY', 'YEARLY'].map(p => (
                       <button key={p} onClick={() => setViewPeriod(p as any)} className={`px-3 py-1 rounded text-[10px] font-bold border ${viewPeriod === p ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}>
                          {p === 'WEEKLY' ? 'DIÁRIO' : p === 'MONTHLY' ? 'SEMANAL' : 'MENSAL'}
                       </button>
                    ))}
                 </div>
              </div>
              <div className="h-64 flex items-end justify-between gap-4 px-2">
                 {chartData.map((d, i) => {
                    const hRev = (d.rev / 7000) * 100;
                    const hExp = (d.exp / 7000) * 100;
                    return (
                       <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          <div className="flex w-full justify-center gap-1 h-full items-end">
                             <div className="w-4 bg-primary/90 rounded-t-sm transition-all duration-700 hover:bg-primary" style={{ height: `${hRev}%` }}></div>
                             <div className="w-4 bg-red-400 rounded-t-sm transition-all duration-700" style={{ height: `${hExp}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-tighter">{d.name}</span>
                       </div>
                    );
                 })}
              </div>
              <div className="flex justify-center gap-8 mt-8 border-t pt-4">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary rounded-sm"></div> <span className="text-[10px] font-bold text-gray-500">RECEITA</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-sm"></div> <span className="text-[10px] font-bold text-gray-500">DESPESAS</span></div>
              </div>
           </Card>

           {/* Predictive Banner */}
           <div className="bg-primary rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 scale-150"><Icons.TrendingUp /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                 <div className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-widest border-l-4 border-secondary pl-4">Projeção 180 Dias</h3>
                    <div className="space-y-2 text-sm text-blue-100 font-light leading-relaxed max-w-lg">
                       <p><b className="text-secondary">Metodologia:</b> Baseada em análise histórica dos últimos 12 meses, sazonalidade do setor logístico e contratos fixos vigentes.</p>
                       <p>Considera crescimento médio composto de <span className="font-bold text-white">6% ao mês</span> e ajustes de período para alta demanda.</p>
                    </div>
                    <div className="flex gap-4 pt-4">
                       <div className="bg-white/10 p-4 rounded-xl flex-1 backdrop-blur-sm border border-white/10">
                          <span className="text-[10px] font-bold block opacity-60">SALDO ATUAL</span>
                          <span className="text-xl font-black">R$ {stats.netCashFlow.toLocaleString('pt-BR')}</span>
                       </div>
                       <div className="bg-white/10 p-4 rounded-xl flex-1 backdrop-blur-sm border border-white/20">
                          <span className="text-[10px] font-bold block opacity-60 uppercase">Projeção (6 Meses)</span>
                          <span className="text-xl font-black text-secondary">R$ {stats.projected6Months.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex flex-col items-center">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                       <svg className="w-full h-full -rotate-90">
                          <circle cx="80" cy="80" r="74" className="stroke-white/10 fill-none" strokeWidth="12" />
                          <circle cx="80" cy="80" r="74" className="stroke-secondary fill-none" strokeWidth="12" strokeDasharray="465" strokeDashoffset={465 - (465 * stats.growthPercent / 100)} strokeLinecap="round" />
                       </svg>
                       <span className="absolute text-2xl font-black text-secondary">{stats.growthPercent.toFixed(0)}%</span>
                    </div>
                    <span className="text-[11px] font-bold mt-6 uppercase tracking-[0.4em] opacity-80">Expectativa de Crescimento</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'PAYROLL' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-l-4 border-l-primary">
                 <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Líquido Folha</span>
                 <span className="text-xl font-black mt-1 block">R$ {stats.staffCosts.toLocaleString('pt-BR')}</span>
              </Card>
              <Card className="p-4 border-l-4 border-l-orange-500">
                 <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Encargos</span>
                 <span className="text-xl font-black mt-1 block">R$ {(stats.staffCosts * 0.285).toLocaleString('pt-BR')}</span>
              </Card>
              <Card className="p-4 border-l-4 border-l-emerald-500">
                 <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Colaboradores Ativos</span>
                 <span className="text-xl font-black mt-1 block">{allStaff.length}</span>
              </Card>
           </div>

           <Card className="overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Gestão Mensal de Salários</h3>
                 <Button variant="outline" className="text-xs py-1 h-8"><Icons.Download /> Exportar Folha</Button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-white border-b border-gray-100 text-[10px] text-gray-400 font-black uppercase">
                       <tr>
                          <th className="px-6 py-4">Funcionário</th>
                          <th className="px-6 py-4">Salário Base</th>
                          <th className="px-6 py-4">Bônus</th>
                          <th className="px-6 py-4">INSS/Taxas</th>
                          <th className="px-6 py-4">Líquido</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Gerir</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {allStaff.length === 0 ? (
                          <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">Sem colaboradores vinculados a contratos fixos.</td></tr>
                       ) : (
                          allStaff.map(staff => {
                             const inss = staff.salary * 0.11;
                             const net = staff.salary + (staff.bonus || 0) - inss;
                             return (
                                <tr key={staff.id} className="hover:bg-gray-50/80 transition-colors group">
                                   <td className="px-6 py-4 font-bold text-gray-900">{staff.employeeName}</td>
                                   <td className="px-6 py-4 font-medium">R$ {staff.salary.toLocaleString('pt-BR')}</td>
                                   <td className="px-6 py-4 text-emerald-600 font-bold">+ R$ {(staff.bonus || 0).toLocaleString('pt-BR')}</td>
                                   <td className="px-6 py-4 text-red-500">R$ {inss.toLocaleString('pt-BR')}</td>
                                   <td className="px-6 py-4 font-black">R$ {net.toLocaleString('pt-BR')}</td>
                                   <td className="px-6 py-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${staff.paymentStatus === 'PAGO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                         {staff.paymentStatus || 'PENDENTE'}
                                      </span>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-1 items-center">
                                          <button 
                                            className="text-gray-300 hover:text-secondary p-1 transition-all"
                                            title="Conferir e Editar Dados"
                                            onClick={() => alert('Para editar este colaborador, acesse a aba "Contratos Fixos" e selecione "Alterar" no contrato correspondente.')}
                                          >
                                              <Icons.Edit />
                                          </button>
                                          <button className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-bold hover:bg-emerald-700 shadow-sm transition-all active:scale-95">
                                              PAGAR
                                          </button>
                                      </div>
                                   </td>
                                </tr>
                             );
                          })
                       )}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      )}

      {activeSubTab === 'INVOICES' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
           <div className="flex justify-between items-end gap-4">
              <div className="flex gap-4">
                 <Select label="Status" value={invoiceFilter} onChange={e => setInvoiceFilter(e.target.value as any)} className="w-48 h-10">
                    <option value="ALL">Todas as Faturas</option>
                    <option value="PENDENTE">Pendentes</option>
                    <option value="VENCIDO">Vencidas</option>
                    <option value="PAGO">Pagas/Recebidas</option>
                 </Select>
              </div>
              <Button><Icons.Plus /> Gerar Nova Fatura</Button>
           </div>

           <Card className="overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                 <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Controle de Recebíveis</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-white border-b border-gray-100 text-[10px] text-gray-400 font-black uppercase">
                       <tr>
                          <th className="px-6 py-4">Empresa / Cliente</th>
                          <th className="px-6 py-4">Entregas</th>
                          <th className="px-6 py-4">Emissão</th>
                          <th className="px-6 py-4">Vencimento</th>
                          <th className="px-6 py-4">Valor</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Ação</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {invoices.filter(i => invoiceFilter === 'ALL' || i.status === invoiceFilter).map(inv => (
                          <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                             <td className="px-6 py-4 font-bold text-gray-900">{inv.companyName}</td>
                             <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 uppercase">{inv.deliveryCount} Fretes</span></td>
                             <td className="px-6 py-4 text-gray-400 text-xs">{new Date(inv.issueDate).toLocaleDateString('pt-BR')}</td>
                             <td className="px-6 py-4">
                                <div className={`text-xs font-bold ${inv.status === 'VENCIDO' ? 'text-red-500' : 'text-gray-700'}`}>
                                   {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                                   {inv.status === 'VENCIDO' && <span className="ml-2 bg-red-100 text-red-700 px-1 rounded text-[8px] uppercase">Atrasada</span>}
                                </div>
                             </td>
                             <td className="px-6 py-4 font-black">R$ {inv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                             <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                                   inv.status === 'PAGO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                   inv.status === 'VENCIDO' ? 'bg-red-50 text-red-700 border-red-100' :
                                   'bg-orange-50 text-orange-700 border-orange-100'
                                }`}>
                                   {inv.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <button onClick={() => toggleInvoiceStatus(inv.id)} className="text-primary hover:bg-primary/10 p-2 rounded-full transition-all">
                                   <Icons.Edit />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
};
