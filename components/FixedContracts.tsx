
import React, { useState } from 'react';
import { FixedContract, StaffExpense } from '../types';
import { Card, Input, Button, Icons } from './Components';

interface FixedContractsProps {
  contracts: FixedContract[];
  onAddContract: (contract: Omit<FixedContract, 'id' | 'createdAt'>) => void;
  onUpdateContract: (contract: FixedContract) => void;
  onDeleteContract: (id: string) => void;
}

export const FixedContracts: React.FC<FixedContractsProps> = ({ 
  contracts, 
  onAddContract, 
  onUpdateContract,
  onDeleteContract 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [contractForm, setContractForm] = useState({ clientName: '', contractValue: '', invoiceDay: '10' });
  
  // State for the NEW contract's initial staff members
  const [initialStaff, setInitialStaff] = useState<Omit<StaffExpense, 'id' | 'createdAt'>[]>([]);
  const [newStaffMember, setNewStaffMember] = useState({ employeeName: '', department: '', salary: '' });

  // State for adding staff to an EXISTING specific contract
  const [addingStaffToId, setAddingStaffToId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({ employeeName: '', role: '', department: '', salary: '' });

  // Global Calculations
  const totalRevenue = contracts.reduce((acc, c) => acc + c.contractValue, 0);
  const totalTaxes = totalRevenue * 0.08;
  const totalStaffCost = contracts.reduce((acc, c) => 
    acc + (c.staff?.reduce((sAcc, s) => sAcc + s.salary, 0) || 0), 0);
  const globalMargin = totalRevenue - totalTaxes - totalStaffCost;

  const handleContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process initial staff to give them temporary IDs/Dates if needed by your backend logic
    const processedStaff: StaffExpense[] = initialStaff.map(s => ({
      ...s,
      id: Math.random().toString(36).substr(2, 9),
      role: s.department || 'Pessoal', // Map department to role if needed, or keep both
      createdAt: new Date().toISOString()
    }));

    onAddContract({
      clientName: contractForm.clientName,
      contractValue: parseFloat(contractForm.contractValue) || 0,
      invoiceDay: parseInt(contractForm.invoiceDay) || 10,
      staff: processedStaff
    });

    // Reset everything
    setContractForm({ clientName: '', contractValue: '', invoiceDay: '10' });
    setInitialStaff([]);
    setShowAddForm(false);
  };

  const addStaffToNewContract = () => {
    if (!newStaffMember.employeeName || !newStaffMember.salary) return;
    
    setInitialStaff([...initialStaff, {
      employeeName: newStaffMember.employeeName,
      department: newStaffMember.department,
      role: newStaffMember.department, // Using department as role for now
      salary: parseFloat(newStaffMember.salary) || 0
    }]);

    setNewStaffMember({ employeeName: '', department: '', salary: '' });
  };

  const handleAddStaffToExisting = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    const newStaff: StaffExpense = {
      id: Math.random().toString(36).substr(2, 9),
      employeeName: staffForm.employeeName,
      role: staffForm.role || staffForm.department || 'Pessoal',
      department: staffForm.department,
      salary: parseFloat(staffForm.salary) || 0,
      createdAt: new Date().toISOString()
    };

    const updatedContract = {
      ...contract,
      staff: [...(contract.staff || []), newStaff]
    };

    onUpdateContract(updatedContract);
    setAddingStaffToId(null);
    setStaffForm({ employeeName: '', role: '', department: '', salary: '' });
  };

  const removeStaff = (contractId: string, staffId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    const updatedContract = {
      ...contract,
      staff: contract.staff.filter(s => s.id !== staffId)
    };
    onUpdateContract(updatedContract);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos Fixos</h1>
          <p className="text-gray-500">Gestão de faturamento recorrente e custos de pessoal alocado</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Icons.Plus /> {showAddForm ? 'Cancelar' : 'Novo Contrato'}
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-primary bg-white">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Receita Contratual Total</span>
          <span className="text-xl font-bold text-primary block mt-1">R$ {totalRevenue.toFixed(2)}</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500 bg-white">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Custo de Pessoal Total</span>
          <span className="text-xl font-bold text-red-600 block mt-1">R$ {totalStaffCost.toFixed(2)}</span>
        </Card>
        <Card className={`p-4 border-l-4 ${globalMargin >= 0 ? 'border-l-green-500 bg-green-50' : 'border-l-red-600 bg-red-50'}`}>
          <div className="flex justify-between items-start">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Resultado Fixo Global (Liq)</span>
            <span className="text-[9px] text-gray-400 bg-white/50 px-1 rounded">-8% Imposto</span>
          </div>
          <span className={`text-xl font-bold block mt-1 ${globalMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            R$ {globalMargin.toFixed(2)}
          </span>
        </Card>
      </div>

      {/* Add Contract Form - Enhanced with Staff Expenses */}
      {showAddForm && (
        <Card className="p-6 border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-primary mb-6 uppercase text-sm tracking-widest flex items-center gap-2">
            <Icons.Plus /> Cadastrar Novo Contrato
          </h3>
          
          <form onSubmit={handleContractSubmit} className="space-y-8">
            {/* Basic Contract Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input 
                label="Nome do Cliente" 
                placeholder="Ex: Banco Central"
                value={contractForm.clientName}
                onChange={e => setContractForm({...contractForm, clientName: e.target.value})}
                required
                className="bg-white"
              />
              <Input 
                label="Valor Mensal (R$)" 
                type="number" step="0.01"
                value={contractForm.contractValue}
                onChange={e => setContractForm({...contractForm, contractValue: e.target.value})}
                required
                className="bg-white"
              />
              <Input 
                label="Dia de Emissão NF" 
                type="number" min="1" max="31"
                value={contractForm.invoiceDay}
                onChange={e => setContractForm({...contractForm, invoiceDay: e.target.value})}
                required
                className="bg-white"
              />
            </div>

            {/* Staff Expenses Section Within Creation Form */}
            <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-inner">
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Icons.Users /> Despesas de Pessoal Alocado (Opcional)
               </h4>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <Input 
                    label="Nome do Funcionário"
                    placeholder="Ex: João da Silva"
                    value={newStaffMember.employeeName}
                    onChange={e => setNewStaffMember({...newStaffMember, employeeName: e.target.value})}
                    className="text-sm"
                  />
                  <Input 
                    label="Departamento"
                    placeholder="Ex: Operacional"
                    value={newStaffMember.department}
                    onChange={e => setNewStaffMember({...newStaffMember, department: e.target.value})}
                    className="text-sm"
                  />
                  <Input 
                    label="Valor da Despesa (R$)"
                    type="number"
                    placeholder="0.00"
                    value={newStaffMember.salary}
                    onChange={e => setNewStaffMember({...newStaffMember, salary: e.target.value})}
                    className="text-sm"
                  />
                  <Button type="button" variant="outline" onClick={addStaffToNewContract} className="w-full text-xs">
                    Adicionar à Lista
                  </Button>
               </div>

               {/* Initial Staff List Table Preview */}
               {initialStaff.length > 0 && (
                 <div className="mt-4 overflow-hidden border border-gray-100 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 text-gray-400 font-bold">
                        <tr>
                          <th className="px-3 py-2">Funcionário</th>
                          <th className="px-3 py-2">Departamento</th>
                          <th className="px-3 py-2">Valor</th>
                          <th className="px-3 py-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {initialStaff.map((s, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-3 py-2 font-medium">{s.employeeName}</td>
                            <td className="px-3 py-2 text-gray-500">{s.department}</td>
                            <td className="px-3 py-2 font-bold text-red-600">R$ {s.salary.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">
                              <button 
                                type="button" 
                                onClick={() => setInitialStaff(initialStaff.filter((_, i) => i !== idx))}
                                className="text-red-300 hover:text-red-500"
                              >
                                <Icons.Trash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Descartar</Button>
              <Button type="submit" className="px-10">Salvar Contrato e Despesas</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Contracts List */}
      <div className="grid grid-cols-1 gap-6">
        {contracts.length === 0 ? (
          <Card className="p-12 text-center text-gray-400 border-dashed bg-gray-50">
            <p>Nenhum contrato fixo cadastrado até o momento.</p>
          </Card>
        ) : (
          contracts.map(contract => {
            const contractTax = contract.contractValue * 0.08;
            const contractStaffCost = contract.staff?.reduce((acc, s) => acc + s.salary, 0) || 0;
            const contractNet = contract.contractValue - contractTax - contractStaffCost;

            return (
              <Card key={contract.id} className="overflow-hidden border-t-4 border-t-primary">
                {/* Contract Header */}
                <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Icons.Building />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{contract.clientName}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Icons.DollarSign /> Valor: <b>R$ {contract.contractValue.toFixed(2)}</b></span>
                        <span className="flex items-center gap-1"><Icons.Home /> Dia NF: <b>{contract.invoiceDay}</b></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Margem do Contrato</span>
                      <button 
                        onClick={() => onDeleteContract(contract.id)}
                        className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                        title="Remover Contrato"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                    <span className={`text-xl font-extrabold ${contractNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {contractNet.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-gray-400">Líquido após 8% imposto e pessoal</span>
                  </div>
                </div>

                {/* Staff Section */}
                <div className="p-5 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                      <Icons.Users /> Funcionários Alocados ({contract.staff?.length || 0})
                    </h4>
                    <button 
                      onClick={() => setAddingStaffToId(addingStaffToId === contract.id ? null : contract.id)}
                      className="text-xs font-bold text-primary hover:text-blue-700 flex items-center gap-1"
                    >
                      {addingStaffToId === contract.id ? 'Cancelar' : <><Icons.Plus /> Adicionar Funcionário</>}
                    </button>
                  </div>

                  {/* Add Staff Form Inline */}
                  {addingStaffToId === contract.id && (
                    <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100 animate-in fade-in zoom-in-95 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <Input 
                          label="Nome Funcionário" 
                          value={staffForm.employeeName}
                          onChange={e => setStaffForm({...staffForm, employeeName: e.target.value})}
                          className="bg-white"
                        />
                        <Input 
                          label="Departamento / Cargo" 
                          value={staffForm.department || staffForm.role}
                          onChange={e => setStaffForm({...staffForm, department: e.target.value, role: e.target.value})}
                          className="bg-white"
                        />
                        <Input 
                          label="Salário" 
                          type="number"
                          value={staffForm.salary}
                          onChange={e => setStaffForm({...staffForm, salary: e.target.value})}
                          className="bg-white"
                        />
                        <Button onClick={() => handleAddStaffToExisting(contract.id)} variant="secondary" className="w-full">
                          Confirmar Alocação
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Staff Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 text-gray-400 uppercase font-bold">
                        <tr>
                          <th className="px-3 py-2">Nome</th>
                          <th className="px-3 py-2">Departamento</th>
                          <th className="px-3 py-2">Custo Salário</th>
                          <th className="px-3 py-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {!contract.staff || contract.staff.length === 0 ? (
                          <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400 italic">Nenhum custo de pessoal vinculado a este contrato.</td></tr>
                        ) : (
                          contract.staff.map(member => (
                            <tr key={member.id} className="hover:bg-gray-50 group">
                              <td className="px-3 py-2 font-semibold text-gray-800">{member.employeeName}</td>
                              <td className="px-3 py-2 text-gray-500">{member.department || member.role}</td>
                              <td className="px-3 py-2 font-bold text-secondary">R$ {member.salary.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right">
                                <button 
                                  onClick={() => removeStaff(contract.id, member.id)}
                                  className="text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <Icons.Trash />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {contract.staff && contract.staff.length > 0 && (
                        <tfoot>
                          <tr className="bg-gray-50/50">
                            <td colSpan={2} className="px-3 py-2 text-right font-bold text-gray-500 uppercase">Subtotal Pessoal:</td>
                            <td className="px-3 py-2 font-extrabold text-red-600">R$ {contractStaffCost.toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
