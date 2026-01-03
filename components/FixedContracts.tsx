
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
  
  const [initialStaff, setInitialStaff] = useState<Omit<StaffExpense, 'id' | 'createdAt'>[]>([]);
  const [newStaffMember, setNewStaffMember] = useState({ 
    employeeName: '', 
    department: '', 
    salary: '',
    vr: '',
    vt: '',
    periculosidade: '',
    motoAluguel: ''
  });

  const [addingStaffToId, setAddingStaffToId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({ 
    employeeName: '', 
    role: '', 
    department: '', 
    salary: '',
    vr: '',
    vt: '',
    periculosidade: '',
    motoAluguel: ''
  });

  const totalRevenue = contracts.reduce((acc, c) => acc + c.contractValue, 0);
  const totalTaxes = totalRevenue * 0.08;
  const totalStaffCost = contracts.reduce((acc, c) => 
    acc + (c.staff?.reduce((sAcc, s) => sAcc + s.salary + (s.vr || 0) + (s.vt || 0) + (s.periculosidade || 0) + (s.motoAluguel || 0), 0) || 0), 0);
  const globalMargin = totalRevenue - totalTaxes - totalStaffCost;

  const handleContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processedStaff: StaffExpense[] = initialStaff.map(s => ({
      ...s,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    }));

    onAddContract({
      clientName: contractForm.clientName,
      contractValue: parseFloat(contractForm.contractValue) || 0,
      invoiceDay: parseInt(contractForm.invoiceDay) || 10,
      staff: processedStaff
    });

    setContractForm({ clientName: '', contractValue: '', invoiceDay: '10' });
    setInitialStaff([]);
    setShowAddForm(false);
  };

  const addStaffToNewContract = () => {
    if (!newStaffMember.employeeName || !newStaffMember.salary) return;
    
    setInitialStaff([...initialStaff, {
      employeeName: newStaffMember.employeeName,
      department: newStaffMember.department,
      role: newStaffMember.department || 'Pessoal',
      salary: parseFloat(newStaffMember.salary) || 0,
      vr: parseFloat(newStaffMember.vr) || 0,
      vt: parseFloat(newStaffMember.vt) || 0,
      periculosidade: parseFloat(newStaffMember.periculosidade) || 0,
      motoAluguel: parseFloat(newStaffMember.motoAluguel) || 0
    }]);

    setNewStaffMember({ employeeName: '', department: '', salary: '', vr: '', vt: '', periculosidade: '', motoAluguel: '' });
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
      vr: parseFloat(staffForm.vr) || 0,
      vt: parseFloat(staffForm.vt) || 0,
      periculosidade: parseFloat(staffForm.periculosidade) || 0,
      motoAluguel: parseFloat(staffForm.motoAluguel) || 0,
      createdAt: new Date().toISOString()
    };

    const updatedContract = {
      ...contract,
      staff: [...(contract.staff || []), newStaff]
    };

    onUpdateContract(updatedContract);
    setAddingStaffToId(null);
    setStaffForm({ employeeName: '', role: '', department: '', salary: '', vr: '', vt: '', periculosidade: '', motoAluguel: '' });
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
          <p className="text-gray-500">Gestão de faturamento recorrente e custos de pessoal unificados</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Icons.Plus /> {showAddForm ? 'Cancelar' : 'Novo Contrato'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-primary bg-white">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Receita Contratual Total</span>
          <span className="text-xl font-bold text-primary block mt-1">R$ {totalRevenue.toFixed(2)}</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500 bg-white">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Custo de Pessoal Total (c/ Benefícios)</span>
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

      {showAddForm && (
        <Card className="p-6 border-2 border-primary/20 bg-primary/5">
          <h3 className="font-bold text-primary mb-6 uppercase text-sm tracking-widest flex items-center gap-2">
            <Icons.Plus /> Cadastrar Novo Contrato
          </h3>
          
          <form onSubmit={handleContractSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="Nome do Cliente" placeholder="Ex: Banco Central" value={contractForm.clientName} onChange={e => setContractForm({...contractForm, clientName: e.target.value})} required className="bg-white" />
              <Input label="Valor Mensal (R$)" type="number" step="0.01" value={contractForm.contractValue} onChange={e => setContractForm({...contractForm, contractValue: e.target.value})} required className="bg-white" />
              <Input label="Dia de Emissão NF" type="number" min="1" max="31" value={contractForm.invoiceDay} onChange={e => setContractForm({...contractForm, invoiceDay: e.target.value})} required className="bg-white" />
            </div>

            <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-inner">
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Icons.Users /> Detalhamento de Pessoal (Salário + Benefícios)
               </h4>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                  <Input label="Nome Funcionário" placeholder="Nome completo" value={newStaffMember.employeeName} onChange={e => setNewStaffMember({...newStaffMember, employeeName: e.target.value})} className="text-sm" />
                  <Input label="Departamento" placeholder="Setor" value={newStaffMember.department} onChange={e => setNewStaffMember({...newStaffMember, department: e.target.value})} className="text-sm" />
                  <Input label="Salário Base (R$)" type="number" value={newStaffMember.salary} onChange={e => setNewStaffMember({...newStaffMember, salary: e.target.value})} className="text-sm" />
                  <Input label="VR (R$)" type="number" value={newStaffMember.vr} onChange={e => setNewStaffMember({...newStaffMember, vr: e.target.value})} className="text-sm" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <Input label="VT (R$)" type="number" value={newStaffMember.vt} onChange={e => setNewStaffMember({...newStaffMember, vt: e.target.value})} className="text-sm" />
                  <Input label="Periculosidade (R$)" type="number" value={newStaffMember.periculosidade} onChange={e => setNewStaffMember({...newStaffMember, periculosidade: e.target.value})} className="text-sm" />
                  <Input label="Aluguel Moto (R$)" type="number" value={newStaffMember.motoAluguel} onChange={e => setNewStaffMember({...newStaffMember, motoAluguel: e.target.value})} className="text-sm" />
                  <Button type="button" variant="secondary" onClick={addStaffToNewContract} className="w-full text-xs">Adicionar Funcionário</Button>
               </div>

               {initialStaff.length > 0 && (
                 <div className="mt-6 overflow-hidden border border-gray-100 rounded-lg">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-gray-50 text-gray-400 font-bold uppercase">
                        <tr>
                          <th className="px-3 py-2">Nome</th>
                          <th className="px-3 py-2">Salário</th>
                          <th className="px-3 py-2">VR/VT</th>
                          <th className="px-3 py-2">Peric/Aluguel</th>
                          <th className="px-3 py-2">Total</th>
                          <th className="px-3 py-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {initialStaff.map((s, idx) => {
                          const subTotal = (s.salary || 0) + (s.vr || 0) + (s.vt || 0) + (s.periculosidade || 0) + (s.motoAluguel || 0);
                          return (
                            <tr key={idx} className="bg-white hover:bg-gray-50">
                              <td className="px-3 py-2 font-bold">{s.employeeName}</td>
                              <td className="px-3 py-2">R$ {s.salary.toFixed(2)}</td>
                              <td className="px-3 py-2">R$ {((s.vr || 0) + (s.vt || 0)).toFixed(2)}</td>
                              <td className="px-3 py-2">R$ {((s.periculosidade || 0) + (s.motoAluguel || 0)).toFixed(2)}</td>
                              <td className="px-3 py-2 font-black text-red-600">R$ {subTotal.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right">
                                <button type="button" onClick={() => setInitialStaff(initialStaff.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500">
                                  <Icons.Trash />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Descartar</Button>
              <Button type="submit" className="px-10">Salvar Contrato Unificado</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {contracts.map(contract => {
          const contractTax = contract.contractValue * 0.08;
          const contractStaffCost = contract.staff?.reduce((acc, s) => acc + s.salary + (s.vr || 0) + (s.vt || 0) + (s.periculosidade || 0) + (s.motoAluguel || 0), 0) || 0;
          const contractNet = contract.contractValue - contractTax - contractStaffCost;

          return (
            <Card key={contract.id} className="overflow-hidden border-t-4 border-t-primary">
              <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Icons.Building /></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{contract.clientName}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>Valor: <b>R$ {contract.contractValue.toFixed(2)}</b></span>
                      <span>Dia NF: <b>{contract.invoiceDay}</b></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Margem Líquida</span>
                    <button onClick={() => onDeleteContract(contract.id)} className="text-gray-300 hover:text-red-500 p-1"><Icons.Trash /></button>
                  </div>
                  <span className={`text-xl font-extrabold ${contractNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {contractNet.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-5 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2"><Icons.Users /> Funcionários Alocados</h4>
                  <button onClick={() => setAddingStaffToId(addingStaffToId === contract.id ? null : contract.id)} className="text-xs font-bold text-primary hover:text-blue-700">
                    {addingStaffToId === contract.id ? 'Cancelar' : <><Icons.Plus /> Adicionar Funcionário</>}
                  </button>
                </div>

                {addingStaffToId === contract.id && (
                  <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                      <Input label="Nome" value={staffForm.employeeName} onChange={e => setStaffForm({...staffForm, employeeName: e.target.value})} className="bg-white" />
                      <Input label="Setor" value={staffForm.department} onChange={e => setStaffForm({...staffForm, department: e.target.value})} className="bg-white" />
                      <Input label="Salário" type="number" value={staffForm.salary} onChange={e => setStaffForm({...staffForm, salary: e.target.value})} className="bg-white" />
                      <Input label="VR" type="number" value={staffForm.vr} onChange={e => setStaffForm({...staffForm, vr: e.target.value})} className="bg-white" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <Input label="VT" type="number" value={staffForm.vt} onChange={e => setStaffForm({...staffForm, vt: e.target.value})} className="bg-white" />
                      <Input label="Peric." type="number" value={staffForm.periculosidade} onChange={e => setStaffForm({...staffForm, periculosidade: e.target.value})} className="bg-white" />
                      <Input label="Aluguel Moto" type="number" value={staffForm.motoAluguel} onChange={e => setStaffForm({...staffForm, motoAluguel: e.target.value})} className="bg-white" />
                      <Button onClick={() => handleAddStaffToExisting(contract.id)} variant="secondary" className="w-full">Confirmar</Button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-gray-50 text-gray-400 font-bold uppercase">
                      <tr>
                        <th className="px-3 py-2">Nome</th>
                        <th className="px-3 py-2">Salário</th>
                        <th className="px-3 py-2">VR/VT</th>
                        <th className="px-3 py-2">Peric/Moto</th>
                        <th className="px-3 py-2">Total Custo</th>
                        <th className="px-3 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {contract.staff?.map(member => {
                        const subTotal = (member.salary || 0) + (member.vr || 0) + (member.vt || 0) + (member.periculosidade || 0) + (member.motoAluguel || 0);
                        return (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-bold">{member.employeeName}</td>
                            <td className="px-3 py-2">R$ {member.salary.toFixed(2)}</td>
                            <td className="px-3 py-2">R$ {((member.vr || 0) + (member.vt || 0)).toFixed(2)}</td>
                            <td className="px-3 py-2">R$ {((member.periculosidade || 0) + (member.motoAluguel || 0)).toFixed(2)}</td>
                            <td className="px-3 py-2 font-black text-red-600">R$ {subTotal.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => removeStaff(contract.id, member.id)} className="text-gray-300 hover:text-red-500"><Icons.Trash /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
