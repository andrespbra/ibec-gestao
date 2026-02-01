
import React, { useState, useMemo, useEffect } from 'react';
import { Driver, TransportRequest, DriverExpense, ExpenseType, FixedContract, StaffExpense } from '../types';
import { Card, Select, Button, Input, Icons } from './Components';
import { DataManager } from '../services/dataManager';

interface PayrollProps {
  drivers: Driver[];
  requests: TransportRequest[];
  expenses: DriverExpense[];
  onAddExpense: (expense: Omit<DriverExpense, 'id'>) => void;
  onUpdateExpense?: (expense: DriverExpense) => void;
}

type PayrollEntity = {
    id: string;
    name: string;
    type: 'DRIVER' | 'STAFF';
    details?: string;
    baseData: Driver | StaffExpense;
};

export const Payroll: React.FC<PayrollProps> = ({ drivers, requests, expenses, onAddExpense, onUpdateExpense }) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [contracts, setContracts] = useState<FixedContract[]>([]);
  
  // New Expense Form State
  const [newExpense, setNewExpense] = useState<{
    type: ExpenseType;
    amount: string;
    description: string;
    date: string;
  }>({
    type: 'VALE',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    DataManager.fetchFixedData().then(data => setContracts(data.contracts));
  }, []);

  const entities = useMemo(() => {
    const list: PayrollEntity[] = [];
    drivers.forEach(d => {
        list.push({ id: d.id, name: d.name, type: 'DRIVER', details: `Veículo: ${d.vehicleType}`, baseData: d });
    });
    contracts.forEach(c => {
        c.staff?.forEach(s => {
            list.push({ id: s.id, name: s.employeeName, type: 'STAFF', details: `Contrato: ${c.clientName}`, baseData: s });
        });
    });
    return list;
  }, [drivers, contracts]);

  const selectedEntity = useMemo(() => entities.find(e => e.id === selectedEntityId), [entities, selectedEntityId]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) return;

    onAddExpense({
        driverId: selectedEntityId,
        type: newExpense.type,
        amount: parseFloat(newExpense.amount) || 0,
        date: newExpense.date,
        description: newExpense.description,
        status: 'PENDENTE'
    });

    setNewExpense(prev => ({ ...prev, amount: '', description: '' }));
  };

  const handlePayExpense = (expense: DriverExpense) => {
    if (onUpdateExpense) {
        onUpdateExpense({
            ...expense,
            status: 'PAGO',
            paidAt: new Date().toISOString()
        });
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => r.driverId === selectedEntityId && r.status === 'CONCLUIDO');
  }, [requests, selectedEntityId]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.driverId === selectedEntityId);
  }, [expenses, selectedEntityId]);

  const staffEarnings = useMemo(() => {
    if (selectedEntity?.type === 'STAFF') {
        const s = selectedEntity.baseData as StaffExpense;
        return (s.salary || 0) + (s.vr || 0) + (s.vt || 0) + (s.periculosidade || 0) + (s.motoAluguel || 0) + (s.fgts || 0) + (s.inss || 0);
    }
    return 0;
  }, [selectedEntity]);

  const totalEarnings = selectedEntity?.type === 'DRIVER' 
    ? filteredRequests.reduce((acc, r) => acc + r.driverFee, 0)
    : staffEarnings;

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netPay = totalEarnings - totalExpenses;

  const handleExport = () => {
    if (!selectedEntity) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Extrato Detalhado: ${selectedEntity.name}\nTipo: ${selectedEntity.type === 'DRIVER' ? 'Motorista/Parceiro' : 'Funcionário'}\nGerado em: ${new Date().toLocaleString()}\n\n`;
    csvContent += "Data,Tipo,Detalhes,Valor (R$),Status\n";
    if (selectedEntity.type === 'DRIVER') {
        filteredRequests.forEach(r => { csvContent += `${new Date(r.createdAt).toLocaleDateString('pt-BR')},Crédito,Nota: ${r.invoiceNumber},${r.driverFee.toFixed(2)},COMPENSADO\n`; });
    } else {
        const s = selectedEntity.baseData as StaffExpense;
        csvContent += `${new Date().toLocaleDateString('pt-BR')},Salário Base,,${s.salary.toFixed(2)},A PAGAR\n`;
        if (s.vr) csvContent += `${new Date().toLocaleDateString('pt-BR')},VR,,${s.vr.toFixed(2)},A PAGAR\n`;
    }
    filteredExpenses.forEach(e => { csvContent += `${new Date(e.date).toLocaleDateString('pt-BR')},Débito (${e.type}),${e.description || '-'},-${e.amount.toFixed(2)},${e.status || 'PENDENTE'}\n`; });
    csvContent += `\n,,,Saldo Liquido: ${netPay.toFixed(2)}`;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `extrato_${selectedEntity.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Folha de Pagamento</h1>
            <p className="text-gray-500">Controle financeiro de motoristas e colaboradores fixos</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-3 w-full sm:w-auto">
            <div className="w-full sm:min-w-[320px]">
                 <Select 
                    label="Colaborador ou Motorista" 
                    value={selectedEntityId} 
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="h-11 shadow-sm border-gray-200"
                 >
                    <option value="">Selecione para detalhar...</option>
                    <optgroup label="Motoristas Parceiros">
                        {entities.filter(e => e.type === 'DRIVER').map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.details})</option>
                        ))}
                    </optgroup>
                    <optgroup label="Equipe de Operação / Contratos">
                        {entities.filter(e => e.type === 'STAFF').map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.details})</option>
                        ))}
                    </optgroup>
                 </Select>
            </div>
            {selectedEntityId && (
                <div className="w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExport} className="h-11 w-full sm:w-auto">
                        <Icons.Download /> Exportar Extrato
                    </Button>
                </div>
            )}
        </div>
      </div>

      {!selectedEntityId ? (
        <Card className="p-16 text-center text-gray-400 bg-gray-50/50 border-dashed border-2 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Icons.Users />
            </div>
            <p className="text-lg font-medium text-gray-500">Selecione um colaborador para iniciar a gestão financeira</p>
            <p className="text-sm text-gray-400 mt-2">Você poderá visualizar créditos, lançar débitos e exportar comprovantes.</p>
        </Card>
      ) : (
        <div className="space-y-6">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-primary bg-white shadow-sm flex flex-col">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total de Ganhos (Créditos)</span>
                    <span className="text-2xl font-black text-gray-800">R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <p className="text-[10px] text-gray-400 mt-2">{selectedEntity?.type === 'DRIVER' ? 'Corridas finalizadas no período' : 'Salário base e benefícios fixos'}</p>
                </Card>
                <Card className="p-5 border-l-4 border-l-red-500 bg-white shadow-sm flex flex-col">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Vales e Despesas (Débitos)</span>
                    <span className="text-2xl font-black text-red-600">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <p className="text-[10px] text-gray-400 mt-2">Soma de todos os lançamentos manuais</p>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500 bg-emerald-50 shadow-md flex flex-col relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10 text-emerald-600 scale-150 rotate-12"><Icons.DollarSign /></div>
                    <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-1">Líquido a Pagar</span>
                    <span className="text-3xl font-black text-emerald-700">R$ {netPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-tight">Pronto para processamento</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Credits Column */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                           Vencimentos e Créditos
                        </h3>
                    </div>
                    <Card className="overflow-hidden border-t-2 border-primary/20">
                        <div className="max-h-[520px] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/80 border-b border-gray-100 text-[10px] text-gray-400 font-black uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-4">Descrição do Lançamento</th>
                                        <th className="px-5 py-4 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {selectedEntity?.type === 'DRIVER' ? (
                                        filteredRequests.length === 0 ? (
                                            <tr><td colSpan={2} className="px-6 py-12 text-center text-gray-400 italic">Sem registros de corridas.</td></tr>
                                        ) : (
                                            filteredRequests.map(req => (
                                                <tr key={req.id} className="hover:bg-gray-50 group">
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-gray-900 text-xs">Frete Nota #{req.invoiceNumber}</div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[280px]">{req.destination}</div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <span className="font-black text-emerald-600">R$ {req.driverFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    ) : (
                                        <>
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-5 py-4 font-bold text-gray-900 text-xs">Salário Base Mensal</td>
                                                <td className="px-5 py-4 text-right font-black text-emerald-600">R$ {(selectedEntity?.baseData as StaffExpense).salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                            {(selectedEntity?.baseData as StaffExpense).vr ? (
                                                <tr className="hover:bg-gray-50">
                                                    <td className="px-5 py-4 font-bold text-gray-900 text-xs">Vale Refeição (VR)</td>
                                                    <td className="px-5 py-4 text-right font-black text-emerald-600">R$ {(selectedEntity?.baseData as StaffExpense).vr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ) : null}
                                            {(selectedEntity?.baseData as StaffExpense).vt ? (
                                                <tr className="hover:bg-gray-50">
                                                    <td className="px-5 py-4 font-bold text-gray-900 text-xs">Vale Transporte (VT)</td>
                                                    <td className="px-5 py-4 text-right font-black text-emerald-600">R$ {(selectedEntity?.baseData as StaffExpense).vt?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ) : null}
                                            {(selectedEntity?.baseData as StaffExpense).periculosidade ? (
                                                <tr className="hover:bg-gray-50">
                                                    <td className="px-5 py-4 font-bold text-gray-900 text-xs">Adicional de Periculosidade</td>
                                                    <td className="px-5 py-4 text-right font-black text-emerald-600">R$ {(selectedEntity?.baseData as StaffExpense).periculosidade?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ) : null}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Expenses Column */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center px-1">
                        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-red-500"></div>
                           Lançamento de Débitos
                        </h3>
                    </div>
                    
                    <Card className="p-0 border-t-2 border-red-200 overflow-hidden bg-gray-50/40">
                        <div className="p-5 border-b border-gray-100 bg-white">
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</label>
                                        <Select 
                                            label="" 
                                            value={newExpense.type} 
                                            onChange={e => setNewExpense({...newExpense, type: e.target.value as ExpenseType})}
                                            className="h-10 border-gray-200 shadow-sm"
                                        >
                                            <option value="VALE">Vale Antecipado</option>
                                            <option value="GASOLINA">Combustível</option>
                                            <option value="PEDAGIO">Pedágio</option>
                                            <option value="OUTROS">Outros Débitos</option>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</label>
                                        <Input 
                                            label="" 
                                            type="date" 
                                            value={newExpense.date} 
                                            onChange={e => setNewExpense({...newExpense, date: e.target.value})} 
                                            required 
                                            className="h-10 border-gray-200 shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</label>
                                    <Input 
                                        label="" 
                                        placeholder="Ex: Vale semanal referente a..." 
                                        value={newExpense.description} 
                                        onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                                        className="h-10 border-gray-200 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor do Débito (R$)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400 text-xs font-bold">R$</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 h-10 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-black text-red-600 shadow-sm"
                                            value={newExpense.amount} 
                                            onChange={e => setNewExpense({...newExpense, amount: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                </div>
                                <Button type="submit" variant="danger" className="w-full py-2.5 shadow-lg shadow-red-500/20 group">
                                    <Icons.Plus /> Confirmar Débito
                                </Button>
                            </form>
                        </div>

                        {/* Recent Debits Sub-table */}
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100/50 text-[9px] text-gray-400 font-black uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Histórico de Débitos</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                        <th className="px-5 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredExpenses.length === 0 ? (
                                        <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400 italic text-xs">Nenhum débito lançado.</td></tr>
                                    ) : (
                                        filteredExpenses.map(exp => (
                                            <tr key={exp.id} className="bg-white hover:bg-gray-50 group transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">{exp.type}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium">{new Date(exp.date).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-gray-700 mt-1">{exp.description || 'Sem descrição'}</div>
                                                    <div className="font-black text-red-600 text-[11px] mt-1">R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${exp.status === 'PAGO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100 animate-pulse'}`}>
                                                        {exp.status || 'PENDENTE'}
                                                    </span>
                                                    {exp.paidAt && (
                                                        <div className="text-[8px] text-gray-400 font-bold mt-1 uppercase">Pago em: {new Date(exp.paidAt).toLocaleDateString('pt-BR')}</div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    {exp.status !== 'PAGO' ? (
                                                        <button 
                                                            onClick={() => handlePayExpense(exp)}
                                                            className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-md border border-emerald-100 shadow-sm transition-all"
                                                            title="Liquidar Débito"
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <Icons.DollarSign />
                                                                <span className="text-[9px] font-black uppercase">Pagar</span>
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="text-emerald-500 flex justify-end">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
