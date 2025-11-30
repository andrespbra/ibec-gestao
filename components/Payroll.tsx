
import React, { useState, useMemo } from 'react';
import { Driver, TransportRequest, DriverExpense, ExpenseType } from '../types';
import { Card, Select, Button, Input, Icons } from './Components';

interface PayrollProps {
  drivers: Driver[];
  requests: TransportRequest[];
  expenses: DriverExpense[];
  onAddExpense: (expense: Omit<DriverExpense, 'id'>) => void;
}

export const Payroll: React.FC<PayrollProps> = ({ drivers, requests, expenses, onAddExpense }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  
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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;

    onAddExpense({
        driverId: selectedDriverId,
        type: newExpense.type,
        amount: parseFloat(newExpense.amount) || 0,
        date: newExpense.date,
        description: newExpense.description
    });

    // Reset amount but keep date and type for convenience
    setNewExpense(prev => ({ ...prev, amount: '', description: '' }));
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => r.driverId === selectedDriverId && r.status === 'CONCLUIDO');
  }, [requests, selectedDriverId]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.driverId === selectedDriverId);
  }, [expenses, selectedDriverId]);

  const totalEarnings = filteredRequests.reduce((acc, r) => acc + r.driverFee, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netPay = totalEarnings - totalExpenses;

  const handleExport = () => {
    if (!selectedDriverId) return;
    const driver = drivers.find(d => d.id === selectedDriverId);
    if (!driver) return;

    // Combine requests and expenses into a single timeline for the report
    const reportItems = [
        ...filteredRequests.map(r => ({
            date: r.createdAt,
            type: 'Receita (Corrida)',
            details: `Nota: ${r.invoiceNumber} - ${r.destination}`,
            value: r.driverFee
        })),
        ...filteredExpenses.map(e => ({
            date: e.date,
            type: `Despesa (${e.type})`,
            details: e.description || '-',
            value: -e.amount // Expenses are negative for the report logic
        }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate CSV Content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Extrato Detalhado: ${driver.name}\n`;
    csvContent += `CPF: ${driver.cpf}\n`;
    csvContent += `Gerado em: ${new Date().toLocaleString()}\n\n`;
    csvContent += "Data,Tipo,Detalhes,Valor (R$)\n";

    reportItems.forEach(item => {
        const dateStr = new Date(item.date).toLocaleDateString('pt-BR');
        // Clean details to remove commas that might break CSV structure
        const cleanDetails = item.details.replace(/,/g, ' '); 
        csvContent += `${dateStr},${item.type},${cleanDetails},${item.value.toFixed(2)}\n`;
    });
    
    // Append Summaries
    csvContent += `\n,,,Total Receitas: ${totalEarnings.toFixed(2)}`;
    csvContent += `\n,,,Total Despesas: ${totalExpenses.toFixed(2)}`;
    csvContent += `\n,,,Saldo Liquido: ${netPay.toFixed(2)}`;

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_${driver.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Folha de Pagamento</h1>
            <p className="text-gray-500">Gestão de repasses, adiantamentos e despesas</p>
        </div>
        <div className="flex items-end gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-64">
                 <Select 
                    label="Selecione o Motorista" 
                    value={selectedDriverId} 
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                 </Select>
            </div>
            {selectedDriverId && (
                <div className="pb-0.5">
                    <Button 
                        variant="outline" 
                        onClick={handleExport} 
                        title="Exportar Relatório CSV"
                    >
                        <Icons.Download /> <span className="hidden sm:inline">Exportar</span>
                    </Button>
                </div>
            )}
        </div>
      </div>

      {!selectedDriverId ? (
        <Card className="p-10 text-center text-gray-400 bg-gray-50 border-dashed">
            <div className="flex justify-center mb-4">
                <Icons.Users />
            </div>
            <p className="text-lg">Selecione um motorista acima para visualizar o extrato.</p>
        </Card>
      ) : (
        <>
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-green-500">
                    <span className="text-gray-500 text-xs font-bold uppercase">Total Créditos (Corridas)</span>
                    <span className="text-2xl font-bold text-green-700 block mt-1">R$ {totalEarnings.toFixed(2)}</span>
                </Card>
                <Card className="p-5 border-l-4 border-l-red-500">
                    <span className="text-gray-500 text-xs font-bold uppercase">Total Débitos (Despesas)</span>
                    <span className="text-2xl font-bold text-red-700 block mt-1">R$ {totalExpenses.toFixed(2)}</span>
                </Card>
                <Card className="p-5 border-l-4 border-l-primary bg-blue-50">
                    <span className="text-blue-600 text-xs font-bold uppercase">Líquido a Receber</span>
                    <span className="text-3xl font-bold text-blue-800 block mt-1">R$ {netPay.toFixed(2)}</span>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Earnings Column */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Entradas (Corridas Concluídas)
                    </h3>
                    <Card className="overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3">Nota/Rota</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.length === 0 ? (
                                        <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Nenhuma corrida concluída.</td></tr>
                                    ) : (
                                        filteredRequests.map(req => (
                                            <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">#{req.invoiceNumber}</div>
                                                    <div className="text-xs truncate max-w-[150px]">{req.destination}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-medium text-green-600">
                                                    + R$ {req.driverFee.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Expenses Column */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Saídas (Despesas e Adiantamentos)
                    </h3>
                    
                    {/* Add Expense Form */}
                    <Card className="p-4 bg-gray-50 border-gray-200">
                        <h4 className="text-sm font-bold text-gray-700 mb-3">Lançar Novo Débito</h4>
                        <form onSubmit={handleAdd} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Select 
                                    label="Tipo" 
                                    className="text-sm"
                                    value={newExpense.type}
                                    onChange={e => setNewExpense({...newExpense, type: e.target.value as ExpenseType})}
                                >
                                    <option value="GASOLINA">Gasolina</option>
                                    <option value="VALE">Vale / Adiantamento</option>
                                    <option value="PEDAGIO">Pedágio</option>
                                    <option value="OUTROS">Outros</option>
                                </Select>
                                <Input 
                                    label="Data" 
                                    type="date" 
                                    className="text-sm"
                                    value={newExpense.date}
                                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                     <Input 
                                        label="Descrição (Opcional)" 
                                        className="text-sm"
                                        placeholder="Ex: Posto Ipiranga"
                                        value={newExpense.description}
                                        onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                                    />
                                </div>
                                <Input 
                                    label="Valor (R$)" 
                                    type="number" 
                                    step="0.01" 
                                    className="text-sm"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                                    required
                                />
                            </div>
                            <Button type="submit" variant="danger" className="w-full text-sm py-1.5">
                                Adicionar Débito
                            </Button>
                        </form>
                    </Card>

                    {/* Expenses List */}
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
                                        <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Nenhum lançamento.</td></tr>
                                    ) : (
                                        filteredExpenses.map(exp => (
                                            <tr key={exp.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {new Date(exp.date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                        {exp.type}
                                                    </span>
                                                    {exp.description && (
                                                        <div className="text-xs text-gray-400 mt-0.5">{exp.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-medium text-red-600">
                                                    - R$ {exp.amount.toFixed(2)}
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
        </>
      )}
    </div>
  );
};
