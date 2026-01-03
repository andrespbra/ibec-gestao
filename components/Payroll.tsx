
import React, { useState, useMemo, useEffect } from 'react';
import { Driver, TransportRequest, DriverExpense, ExpenseType, FixedContract, StaffExpense } from '../types';
import { Card, Select, Button, Input, Icons } from './Components';
import { DataManager } from '../services/dataManager';

interface PayrollProps {
  drivers: Driver[];
  requests: TransportRequest[];
  expenses: DriverExpense[];
  onAddExpense: (expense: Omit<DriverExpense, 'id'>) => void;
}

type PayrollEntity = {
    id: string;
    name: string;
    type: 'DRIVER' | 'STAFF';
    details?: string;
    baseData: Driver | StaffExpense;
};

export const Payroll: React.FC<PayrollProps> = ({ drivers, requests, expenses, onAddExpense }) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [contracts, setContracts] = useState<FixedContract[]>([]);
  
  // New Expense Form State
  const [newExpense, setNewExpense] = useState<{
    type: ExpenseType;
    amount: string;
    description: string;
    date: string;
  }>({
    type: 'GASOLINA',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    DataManager.fetchFixedData().then(data => setContracts(data.contracts));
  }, []);

  // Aggregate Drivers and Contract Staff into a single selectable list
  const entities = useMemo(() => {
    const list: PayrollEntity[] = [];
    
    // Drivers
    drivers.forEach(d => {
        list.push({ id: d.id, name: d.name, type: 'DRIVER', details: `Veículo: ${d.vehicleType}`, baseData: d });
    });

    // Staff from Contracts
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
        driverId: selectedEntityId, // Using entity ID as driverId for simplification in expense tracking
        type: newExpense.type,
        amount: parseFloat(newExpense.amount) || 0,
        date: newExpense.date,
        description: newExpense.description
    });

    setNewExpense(prev => ({ ...prev, amount: '', description: '' }));
  };

  // Calculations for Drivers
  const filteredRequests = useMemo(() => {
    return requests.filter(r => r.driverId === selectedEntityId && r.status === 'CONCLUIDO');
  }, [requests, selectedEntityId]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.driverId === selectedEntityId);
  }, [expenses, selectedEntityId]);

  // Calculations for Staff
  const staffEarnings = useMemo(() => {
    if (selectedEntity?.type === 'STAFF') {
        const s = selectedEntity.baseData as StaffExpense;
        return (s.salary || 0) + (s.vr || 0) + (s.vt || 0) + (s.periculosidade || 0) + (s.motoAluguel || 0);
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
    csvContent += `Extrato Detalhado: ${selectedEntity.name}\n`;
    csvContent += `Tipo: ${selectedEntity.type === 'DRIVER' ? 'Motorista/Parceiro' : 'Funcionário Contrato Fixo'}\n`;
    csvContent += `Gerado em: ${new Date().toLocaleString()}\n\n`;
    csvContent += "Data,Tipo,Detalhes,Valor (R$)\n";

    if (selectedEntity.type === 'DRIVER') {
        filteredRequests.forEach(r => {
            csvContent += `${new Date(r.createdAt).toLocaleDateString('pt-BR')},Crédito,Nota: ${r.invoiceNumber},${r.driverFee.toFixed(2)}\n`;
        });
    } else {
        const s = selectedEntity.baseData as StaffExpense;
        csvContent += `${new Date().toLocaleDateString('pt-BR')},Salário Base,,${s.salary.toFixed(2)}\n`;
        if (s.vr) csvContent += `${new Date().toLocaleDateString('pt-BR')},VR,,${s.vr.toFixed(2)}\n`;
        if (s.vt) csvContent += `${new Date().toLocaleDateString('pt-BR')},VT,,${s.vt.toFixed(2)}\n`;
        if (s.periculosidade) csvContent += `${new Date().toLocaleDateString('pt-BR')},Periculosidade,,${s.periculosidade.toFixed(2)}\n`;
        if (s.motoAluguel) csvContent += `${new Date().toLocaleDateString('pt-BR')},Aluguel Moto,,${s.motoAluguel.toFixed(2)}\n`;
    }

    filteredExpenses.forEach(e => {
        csvContent += `${new Date(e.date).toLocaleDateString('pt-BR')},Débito (${e.type}),${e.description || '-'},-${e.amount.toFixed(2)}\n`;
    });
    
    csvContent += `\n,,,Saldo Liquido: ${netPay.toFixed(2)}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_${selectedEntity.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Folha de Pagamento</h1>
            <p className="text-gray-500">Gestão integrada: Motoristas e Funcionários de Contratos</p>
        </div>
        <div className="flex items-end gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-80">
                 <Select label="Selecione o Beneficiário" value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)}>
                    <option value="">Selecione um nome...</option>
                    <optgroup label="Motoristas Parceiros">
                        {entities.filter(e => e.type === 'DRIVER').map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.details})</option>
                        ))}
                    </optgroup>
                    <optgroup label="Funcionários de Contratos Fixos">
                        {entities.filter(e => e.type === 'STAFF').map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.details})</option>
                        ))}
                    </optgroup>
                 </Select>
            </div>
            {selectedEntityId && (
                <div className="pb-0.5"><Button variant="outline" onClick={handleExport}><Icons.Download /> Exportar</Button></div>
            )}
        </div>
      </div>

      {!selectedEntityId ? (
        <Card className="p-10 text-center text-gray-400 bg-gray-50 border-dashed">
            <div className="flex justify-center mb-4"><Icons.Users /></div>
            <p className="text-lg">Selecione um colaborador acima para visualizar o detalhamento.</p>
        </Card>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-green-500">
                    <span className="text-gray-500 text-xs font-bold uppercase">Total Créditos (Vencimentos)</span>
                    <span className="text-2xl font-bold text-green-700 block mt-1">R$ {totalEarnings.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">{selectedEntity?.type === 'DRIVER' ? 'Soma das corridas concluídas' : 'Soma de Salário + Benefícios'}</span>
                </Card>
                <Card className="p-5 border-l-4 border-l-red-500">
                    <span className="text-gray-500 text-xs font-bold uppercase">Total Débitos (Vales/Despesas)</span>
                    <span className="text-2xl font-bold text-red-700 block mt-1">R$ {totalExpenses.toFixed(2)}</span>
                </Card>
                <Card className="p-5 border-l-4 border-l-primary bg-blue-50">
                    <span className="text-blue-600 text-xs font-bold uppercase">Líquido a Pagar</span>
                    <span className="text-3xl font-bold text-blue-800 block mt-1">R$ {netPay.toFixed(2)}</span>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {selectedEntity?.type === 'DRIVER' ? 'Corridas Concluídas' : 'Composição do Salário'}
                    </h3>
                    <Card className="overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Descrição</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedEntity?.type === 'DRIVER' ? (
                                        filteredRequests.length === 0 ? (
                                            <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">Nenhuma corrida.</td></tr>
                                        ) : (
                                            filteredRequests.map(req => (
                                                <tr key={req.id} className="bg-white border-b">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">Nota #{req.invoiceNumber}</div>
                                                        <div className="text-[10px] text-gray-400">{req.destination}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-600">R$ {req.driverFee.toFixed(2)}</td>
                                                </tr>
                                            ))
                                        )
                                    ) : (
                                        <>
                                            <tr className="bg-white border-b">
                                                <td className="px-4 py-3">Salário Base</td>
                                                <td className="px-4 py-3 text-right font-bold text-green-600">R$ {(selectedEntity?.baseData as StaffExpense).salary.toFixed(2)}</td>
                                            </tr>
                                            {(selectedEntity?.baseData as StaffExpense).vr ? (
                                                <tr className="bg-white border-b">
                                                    <td className="px-4 py-3">Vale Refeição (VR)</td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-600">R$ {(selectedEntity?.baseData as StaffExpense).vr?.toFixed(2)}</td>
                                                </tr>
                                            ) : null}
                                            {(selectedEntity?.baseData as StaffExpense).vt ? (
                                                <tr className="bg-white border-b">
                                                    <td className="px-4 py-3">Vale Transporte (VT)</td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-600">R$ {(selectedEntity?.baseData as StaffExpense).vt?.toFixed(2)}</td>
                                                </tr>
                                            ) : null}
                                            {(selectedEntity?.baseData as StaffExpense).periculosidade ? (
                                                <tr className="bg-white border-b">
                                                    <td className="px-4 py-3">Adicional Periculosidade</td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-600">R$ {(selectedEntity?.baseData as StaffExpense).periculosidade?.toFixed(2)}</td>
                                                </tr>
                                            ) : null}
                                            {(selectedEntity?.baseData as StaffExpense).motoAluguel ? (
                                                <tr className="bg-white border-b">
                                                    <td className="px-4 py-3">Aluguel da Moto</td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-600">R$ {(selectedEntity?.baseData as StaffExpense).motoAluguel?.toFixed(2)}</td>
                                                </tr>
                                            ) : null}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Descontos / Vales lançados
                    </h3>
                    
                    <Card className="p-4 bg-gray-50 border-gray-200">
                        <form onSubmit={handleAdd} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Select label="Tipo" className="text-sm" value={newExpense.type} onChange={e => setNewExpense({...newExpense, type: e.target.value as ExpenseType})}>
                                    <option value="VALE">Vale / Adiantamento</option>
                                    <option value="GASOLINA">Combustível</option>
                                    <option value="PEDAGIO">Pedágio</option>
                                    <option value="OUTROS">Outros</option>
                                </Select>
                                <Input label="Data" type="date" className="text-sm" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} required />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2"><Input label="Descrição" className="text-sm" placeholder="Ref. Vale semanal" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} /></div>
                                <Input label="Valor (R$)" type="number" step="0.01" className="text-sm" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} required />
                            </div>
                            <Button type="submit" variant="danger" className="w-full text-sm py-1.5">Lançar Débito</Button>
                        </form>
                    </Card>

                     <Card className="overflow-hidden">
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.length === 0 ? (
                                        <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Nenhum débito.</td></tr>
                                    ) : (
                                        filteredExpenses.map(exp => (
                                            <tr key={exp.id} className="bg-white border-b">
                                                <td className="px-4 py-3 text-[10px]">{new Date(exp.date).toLocaleDateString('pt-BR')}</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{exp.type}</span>
                                                    <div className="text-[10px] text-gray-400">{exp.description}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-red-600">- R$ {exp.amount.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
