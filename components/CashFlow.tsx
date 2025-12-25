
import React, { useState, useEffect, useMemo } from 'react';
import { FinancialTransaction, TransactionType, TransactionStatus, FinancialCategory } from '../types';
import { Card, Button, Input, Select, Icons } from './Components';
import { DataManager } from '../services/dataManager';

export const CashFlow: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'SAIDA' as TransactionType,
    category: 'OUTROS' as FinancialCategory,
    description: '',
    value: '',
    status: 'REALIZADO' as TransactionStatus,
    paymentMethod: 'PIX' as any
  });

  // Filter State
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    const data = await DataManager.fetchTransactions();
    setTransactions(data);
    setIsLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formData.value) || 0;
    
    await DataManager.addTransaction({
      ...formData,
      value: val,
      paymentMethod: formData.paymentMethod
    });
    
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'SAIDA',
      category: 'OUTROS',
      description: '',
      value: '',
      status: 'REALIZADO',
      paymentMethod: 'PIX'
    });
    setShowForm(false);
    loadTransactions();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta movimentação?')) {
      await DataManager.deleteTransaction(id);
      loadTransactions();
    }
  };

  const handleToggleStatus = async (item: FinancialTransaction) => {
    const updated = { 
      ...item, 
      status: item.status === 'PREVISTO' ? 'REALIZADO' : 'PREVISTO' as TransactionStatus 
    };
    await DataManager.updateTransaction(updated);
    loadTransactions();
  };

  // Calculations
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });
  }, [transactions, filterMonth, filterYear]);

  const stats = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let realizedInflow = 0;
    let realizedOutflow = 0;

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === filterMonth && d.getFullYear() === filterYear) {
        if (t.type === 'ENTRADA') {
          inflow += t.value;
          if (t.status === 'REALIZADO') realizedInflow += t.value;
        } else {
          outflow += t.value;
          if (t.status === 'REALIZADO') realizedOutflow += t.value;
        }
      }
    });

    return {
      inflow,
      outflow,
      realizedInflow,
      realizedOutflow,
      currentBalance: realizedInflow - realizedOutflow,
      projectedBalance: inflow - outflow
    };
  }, [transactions, filterMonth, filterYear]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando Fluxo de Caixa...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
          <p className="text-gray-500">Monitoramento de entradas, saídas e previsibilidade financeira</p>
        </div>
        <div className="flex gap-2">
            <Select 
                label="" 
                value={filterMonth} 
                onChange={e => setFilterMonth(parseInt(e.target.value))}
                className="w-32"
            >
                {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                ))}
            </Select>
            <Button onClick={() => setShowForm(!showForm)}>
                <Icons.Plus /> Novo Lançamento
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-green-500">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Entradas do Mês</span>
          <span className="text-xl font-bold text-green-600 block mt-1">R$ {stats.inflow.toFixed(2)}</span>
          <span className="text-[10px] text-gray-400">R$ {stats.realizedInflow.toFixed(2)} Realizado</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Saídas do Mês</span>
          <span className="text-xl font-bold text-red-600 block mt-1">R$ {stats.outflow.toFixed(2)}</span>
          <span className="text-[10px] text-gray-400">R$ {stats.realizedOutflow.toFixed(2)} Realizado</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-primary bg-blue-50">
          <span className="text-primary text-[10px] font-bold uppercase tracking-wider">Saldo em Caixa (Efetivo)</span>
          <span className="text-xl font-bold text-primary block mt-1">R$ {stats.currentBalance.toFixed(2)}</span>
          <span className="text-[10px] text-gray-400">Apenas conciliações realizadas</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-orange-400">
          <span className="text-orange-600 text-[10px] font-bold uppercase tracking-wider">Saldo Projetado</span>
          <span className="text-xl font-bold text-orange-700 block mt-1">R$ {stats.projectedBalance.toFixed(2)}</span>
          <span className="text-[10px] text-gray-400">Considerando provisões</span>
        </Card>
      </div>

      {showForm && (
        <Card className="p-6 border-2 border-primary/20 bg-primary/5">
          <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
            <Icons.Plus /> Novo Lançamento Financeiro
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
             <Input 
               label="Data" 
               type="date" 
               value={formData.date} 
               onChange={e => setFormData({...formData, date: e.target.value})} 
               required
               className="bg-white"
             />
             <Select 
               label="Tipo" 
               value={formData.type} 
               onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
               className="bg-white"
             >
               <option value="SAIDA">Débito (Saída)</option>
               <option value="ENTRADA">Crédito (Entrada)</option>
             </Select>
             <Select 
               label="Categoria" 
               value={formData.category} 
               onChange={e => setFormData({...formData, category: e.target.value as FinancialCategory})}
               className="bg-white"
             >
               <option value="FATURAMENTO">Faturamento</option>
               <option value="CONTRATO_FIXO">Contrato Fixo</option>
               <option value="APORTE">Aporte de Capital</option>
               <option value="SALARIO">Salário / Pro-labore</option>
               <option value="COMBUSTIVEL">Combustível</option>
               <option value="ALUGUEL">Aluguel / Condomínio</option>
               <option value="MANUTENCAO">Manutenção Veicular</option>
               <option value="COMISSAO">Comissão</option>
               <option value="IMPOSTO">Impostos / Taxas</option>
               <option value="OUTROS">Outros</option>
             </Select>
             <Input 
               label="Valor (R$)" 
               type="number" step="0.01"
               value={formData.value} 
               onChange={e => setFormData({...formData, value: e.target.value})} 
               required
               className="bg-white"
             />
             <div className="md:col-span-2">
                <Input 
                    label="Descrição / Detalhes" 
                    placeholder="Ex: Pagamento Internet Vivo"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    required
                    className="bg-white"
                />
             </div>
             <Select 
               label="Forma de Pagto" 
               value={formData.paymentMethod} 
               onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}
               className="bg-white"
             >
               <option value="PIX">PIX</option>
               <option value="BOLETO">Boleto Bancário</option>
               <option value="CARTAO">Cartão</option>
               <option value="DINHEIRO">Dinheiro</option>
             </Select>
             <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">Lançar</Button>
             </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Icons.BarChart /> Extrato do Período
          </h3>
          <span className="text-xs text-gray-500">{filteredTransactions.length} lançamentos em {filterMonth+1}/{filterYear}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Descrição / Categoria</th>
                <th className="px-6 py-3">Pagamento</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">
                    Nenhuma movimentação financeira neste período.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{t.description}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{t.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">{t.paymentMethod}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(t)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-all ${
                          t.status === 'REALIZADO' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100'
                        }`}
                      >
                        {t.status === 'REALIZADO' ? '✓ Realizado' : '⌛ Previsto'}
                      </button>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold text-sm ${t.type === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'ENTRADA' ? '+' : '-'} R$ {t.value.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button 
                         onClick={() => handleDelete(t.id)}
                         className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <Icons.Trash />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
