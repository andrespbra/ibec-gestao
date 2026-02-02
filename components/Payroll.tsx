
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
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  
  // Filtros de Competência
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  // Estado do formulário de despesas
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

  const handleEditExpense = (expense: DriverExpense) => {
    setEditingExpenseId(expense.id);
    setNewExpense({
        type: expense.type,
        amount: expense.amount.toString(),
        description: expense.description || '',
        date: expense.date
    });
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setNewExpense({
        type: 'VALE',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) return;

    if (editingExpenseId && onUpdateExpense) {
        onUpdateExpense({
            id: editingExpenseId,
            driverId: selectedEntityId,
            type: newExpense.type,
            amount: parseFloat(newExpense.amount) || 0,
            date: newExpense.date,
            description: newExpense.description,
            status: expenses.find(exp => exp.id === editingExpenseId)?.status || 'PENDENTE'
        });
        setEditingExpenseId(null);
    } else {
        onAddExpense({
            driverId: selectedEntityId,
            type: newExpense.type,
            amount: parseFloat(newExpense.amount) || 0,
            date: newExpense.date,
            description: newExpense.description,
            status: 'PENDENTE'
        });
    }

    setNewExpense({
        type: 'VALE',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
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

  // Filtragem por Competência (Mês/Ano)
  const isWithinPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  };

  // 1. Filtrar comissões onde o nome do colaborador selecionado coincide com o "commissionedName" do pedido
  const filteredCommissions = useMemo(() => {
    if (!selectedEntity) return [];
    return requests.filter(r => 
        r.commissionedName === selectedEntity.name && 
        r.status === 'CONCLUIDO' &&
        isWithinPeriod(r.requestDate || r.createdAt)
    );
  }, [requests, selectedEntity, filterMonth, filterYear]);

  // 2. Filtrar corridas diretas se for motorista
  const filteredRequests = useMemo(() => {
    return requests.filter(r => 
        r.driverId === selectedEntityId && 
        r.status === 'CONCLUIDO' &&
        isWithinPeriod(r.requestDate || r.createdAt)
    );
  }, [requests, selectedEntityId, filterMonth, filterYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => 
        e.driverId === selectedEntityId &&
        isWithinPeriod(e.date)
    );
  }, [expenses, selectedEntityId, filterMonth, filterYear]);

  // 3. Cálculos de Totais (Base + Comissões)
  const totalCommissionValue = useMemo(() => {
    return filteredCommissions.reduce((acc, r) => {
        const value = (r.clientCharge * (r.commissionPercentage || 0)) / 100;
        return acc + value;
    }, 0);
  }, [filteredCommissions]);

  const earnings = useMemo(() => {
    let baseEarnings = 0;
    if (selectedEntity?.type === 'STAFF') {
        const s = selectedEntity.baseData as StaffExpense;
        baseEarnings = (s.salary || 0) + (s.vr || 0) + (s.vt || 0) + (s.periculosidade || 0);
    } else {
        baseEarnings = filteredRequests.reduce((acc, r) => acc + r.driverFee, 0);
    }
    return baseEarnings + totalCommissionValue;
  }, [selectedEntity, filteredRequests, totalCommissionValue]);

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netPay = earnings - totalExpenses;

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header com Filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Folha de Pagamento</h1>
            <p className="text-gray-500 text-sm font-medium">Gestão de repasses, comissões e despesas</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="flex-1 sm:w-64">
                <Select 
                    label="Colaborador Selecionado" 
                    value={selectedEntityId} 
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="h-10 text-xs font-bold"
                >
                    <option value="">Escolha um perfil...</option>
                    {entities.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.type === 'DRIVER' ? 'Motorista' : 'Staff'})</option>
                    ))}
                </Select>
            </div>
            <div className="flex gap-2">
                <Select 
                    label="Mês Ref." 
                    value={filterMonth} 
                    onChange={e => setFilterMonth(parseInt(e.target.value))}
                    className="w-32 h-10 text-xs font-bold"
                >
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </Select>
                <Select 
                    label="Ano Ref." 
                    value={filterYear} 
                    onChange={e => setFilterYear(parseInt(e.target.value))}
                    className="w-24 h-10 text-xs font-bold"
                >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
            </div>
        </div>
      </div>

      {!selectedEntityId ? (
        <Card className="p-20 text-center flex flex-col items-center border-dashed border-2">
            <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-4">
                <Icons.Users />
            </div>
            <h3 className="text-gray-800 font-black uppercase text-sm tracking-widest">Aguardando Seleção</h3>
            <p className="text-gray-400 text-xs mt-2 max-w-xs">Selecione um motorista ou colaborador acima para visualizar o extrato de ganhos e comissões.</p>
        </Card>
      ) : (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 border-l-4 border-l-primary flex flex-col">
                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Receita Bruta (Ganhos)</span>
                    <span className="text-2xl font-black text-gray-900 mt-1">R$ {earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <div className="text-[10px] text-emerald-500 font-bold mt-2">
                        {totalCommissionValue > 0 ? `Inclui R$ ${totalCommissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em comissões` : `Total de fretes em ${months[filterMonth]}`}
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-red-500 flex flex-col">
                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Descontos / Vales</span>
                    <span className="text-2xl font-black text-red-600 mt-1">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <div className="text-[10px] text-gray-400 font-bold mt-2">Combustível, vales e outros débitos</div>
                </Card>
                <Card className="p-6 border-l-4 border-l-emerald-500 bg-emerald-50 flex flex-col shadow-lg shadow-emerald-500/10">
                    <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Saldo Líquido a Pagar</span>
                    <span className="text-3xl font-black text-emerald-700 mt-1">R$ {netPay.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <div className="text-[10px] text-emerald-600 font-black mt-2 uppercase tracking-tight">Valor conciliado para repasse</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Coluna de Créditos: Corridas e Comissões */}
                <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest px-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        Extrato Detalhado de Receitas
                    </h3>
                    <Card className="overflow-hidden">
                        <div className="max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-4">Origem / Data Solicitação</th>
                                        <th className="px-5 py-4">Detalhes</th>
                                        <th className="px-5 py-4 text-right">Crédito (R$)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {/* Mostrar Salário Base se for STAFF */}
                                    {selectedEntity?.type === 'STAFF' && (
                                        <tr className="bg-primary/5">
                                            <td className="px-5 py-4">
                                                <div className="text-[11px] font-black text-primary uppercase">Salário Base + Benefícios</div>
                                                <div className="text-[10px] text-gray-400 font-bold">Folha Mensal Consolidada</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-[9px] text-gray-400 uppercase font-black">Contrato Corporativo</div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="text-primary font-black text-xs">
                                                    {( (selectedEntity.baseData as StaffExpense).salary + 
                                                       ((selectedEntity.baseData as StaffExpense).vr || 0) + 
                                                       ((selectedEntity.baseData as StaffExpense).vt || 0) + 
                                                       ((selectedEntity.baseData as StaffExpense).periculosidade || 0)
                                                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                        </tr>
                                    )}

                                    {/* Mostrar Fretes Diretos se for Motorista */}
                                    {filteredRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="text-[11px] font-black text-gray-900">Frete Realizado</div>
                                                <div className="text-[10px] text-gray-400 font-bold">
                                                  {req.requestDate ? new Date(req.requestDate + 'T' + req.requestTime).toLocaleDateString('pt-BR') : new Date(req.createdAt).toLocaleDateString('pt-BR')} às {req.requestTime || '--:--'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-[11px] font-bold text-gray-600 truncate max-w-[150px]">Doc: {req.invoiceNumber}</div>
                                                <div className="text-[9px] text-gray-400 uppercase font-black">{req.vehicleType}</div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="text-emerald-600 font-black text-xs">+ {req.driverFee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Mostrar Comissões para qualquer entidade */}
                                    {filteredCommissions.map(req => {
                                        const commValue = (req.clientCharge * (req.commissionPercentage || 0)) / 100;
                                        return (
                                            <tr key={`comm-${req.id}`} className="hover:bg-orange-50 transition-colors group border-l-4 border-l-secondary">
                                                <td className="px-5 py-4">
                                                    <div className="text-[11px] font-black text-secondary uppercase">Comissão de Agenciamento</div>
                                                    <div className="text-[10px] text-secondary/60 font-bold">
                                                      {req.requestDate ? new Date(req.requestDate).toLocaleDateString('pt-BR') : '--'} • Nota #{req.invoiceNumber}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-[11px] font-bold text-gray-600 truncate max-w-[150px]">{req.clientName}</div>
                                                    <div className="text-[9px] text-secondary uppercase font-black">Taxa: {req.commissionPercentage}%</div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <span className="text-secondary font-black text-xs">+ {commValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredRequests.length === 0 && filteredCommissions.length === 0 && selectedEntity?.type === 'DRIVER' && (
                                        <tr><td colSpan={3} className="px-6 py-20 text-center text-gray-400 italic text-xs">Nenhuma receita encontrada para este período.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Coluna de Débitos: Lançamento de Despesas */}
                <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest px-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        {editingExpenseId ? 'Editar Desconto' : 'Lançar Novo Desconto'}
                    </h3>
                    
                    <Card className={`p-6 bg-gray-50 border-t-4 ${editingExpenseId ? 'border-secondary' : 'border-red-100'}`}>
                        <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Select 
                                    label="Categoria" 
                                    value={newExpense.type} 
                                    onChange={e => setNewExpense({...newExpense, type: e.target.value as ExpenseType})}
                                    className="h-11 border-gray-200"
                                >
                                    <option value="VALE">Vale Antecipado</option>
                                    <option value="GASOLINA">Gasolina / Combustível</option>
                                    <option value="PEDAGIO">Pedágio</option>
                                    <option value="OUTROS">Outros</option>
                                </Select>
                                <Input 
                                    label="Data do Evento" 
                                    type="date" 
                                    value={newExpense.date} 
                                    onChange={e => setNewExpense({...newExpense, date: e.target.value})} 
                                    required
                                    className="h-11 border-gray-200"
                                />
                            </div>
                            <Input 
                                label="Valor do Desconto (R$)" 
                                type="number" 
                                step="0.01" 
                                value={newExpense.amount} 
                                onChange={e => setNewExpense({...newExpense, amount: e.target.value})} 
                                required
                                placeholder="0,00"
                                className="h-11 border-gray-200 font-black text-red-600"
                            />
                            <Input 
                                label="Justificativa / Descrição" 
                                value={newExpense.description} 
                                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                                placeholder="Ex: Adiantamento semanal"
                                className="h-11 border-gray-200"
                            />
                            <div className="flex gap-2">
                                {editingExpenseId && (
                                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1">
                                        Cancelar
                                    </Button>
                                )}
                                <Button type="submit" variant={editingExpenseId ? 'secondary' : 'danger'} className="flex-[2] py-3 shadow-lg">
                                    {editingExpenseId ? <><Icons.Edit /> Atualizar Lançamento</> : <><Icons.Plus /> Efetivar Desconto</>}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest px-1 mt-6">Histórico de Débitos</h3>
                    <Card className="overflow-hidden">
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-[9px] font-black text-gray-400 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Tipo / Data</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                        <th className="px-4 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredExpenses.length === 0 ? (
                                        <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs italic">Nenhum débito registrado.</td></tr>
                                    ) : (
                                        filteredExpenses.map(exp => (
                                            <tr key={exp.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="text-[10px] font-black text-gray-800 uppercase">{exp.type}</div>
                                                    <div className="text-[9px] text-gray-400 font-bold">{new Date(exp.date).toLocaleDateString('pt-BR')}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-red-600 font-black text-[11px]">- {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end items-center gap-1">
                                                        {exp.status === 'PAGO' ? (
                                                            <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Compensado</span>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handlePayExpense(exp)}
                                                                className="text-[8px] font-black uppercase text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 hover:bg-orange-500 hover:text-white transition-all"
                                                                title="Liquidar desconto no saldo"
                                                            >
                                                                Liquidado?
                                                            </button>
                                                        )}
                                                    </div>
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
