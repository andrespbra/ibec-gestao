
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
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  
  const [contractForm, setContractForm] = useState({ clientName: '', contractValue: '', invoiceDay: '10' });
  
  const [initialStaff, setInitialStaff] = useState<Omit<StaffExpense, 'id' | 'createdAt'>[]>([]);
  const [newStaffMember, setNewStaffMember] = useState({ 
    employeeName: '', 
    department: '', 
    salary: '',
    vr: '',
    vt: '',
    periculosidade: '',
    motoAluguel: '',
    fgts: '',
    inss: ''
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
    motoAluguel: '',
    fgts: '',
    inss: ''
  });

  const calculateTotalMemberCost = (s: any) => {
    return (parseFloat(s.salary) || 0) + 
           (parseFloat(s.vr) || 0) + 
           (parseFloat(s.vt) || 0) + 
           (parseFloat(s.periculosidade) || 0) + 
           (parseFloat(s.motoAluguel) || 0) + 
           (parseFloat(s.fgts) || 0) + 
           (parseFloat(s.inss) || 0);
  };

  const totalRevenue = contracts.reduce((acc, c) => acc + c.contractValue, 0);
  const totalTaxes = totalRevenue * 0.08;
  const totalStaffCost = contracts.reduce((acc, c) => 
    acc + (c.staff?.reduce((sAcc, s) => sAcc + s.salary + (s.vr || 0) + (s.vt || 0) + (s.periculosidade || 0) + (s.motoAluguel || 0) + (s.fgts || 0) + (s.inss || 0), 0) || 0), 0);
  const globalMargin = totalRevenue - totalTaxes - totalStaffCost;

  const handleEditClick = (contract: FixedContract) => {
    setEditingContractId(contract.id);
    setContractForm({
        clientName: contract.clientName,
        contractValue: contract.contractValue.toString(),
        invoiceDay: contract.invoiceDay.toString()
    });
    // Populamos o initialStaff com os membros atuais do contrato para permitir edição em massa
    setInitialStaff(contract.staff.map(s => ({ ...s })));
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingContractId(null);
    setContractForm({ clientName: '', contractValue: '', invoiceDay: '10' });
    setInitialStaff([]);
  };

  const handleContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convertemos o initialStaff (que pode ter IDs se for edição) de volta para o formato correto
    const processedStaff: StaffExpense[] = initialStaff.map(s => ({
      ...s,
      id: (s as any).id || Math.random().toString(36).substr(2, 9),
      createdAt: (s as any).createdAt || new Date().toISOString()
    })) as StaffExpense[];

    if (editingContractId) {
        const existing = contracts.find(c => c.id === editingContractId);
        if (existing) {
            onUpdateContract({
                ...existing,
                clientName: contractForm.clientName,
                contractValue: parseFloat(contractForm.contractValue) || 0,
                invoiceDay: parseInt(contractForm.invoiceDay) || 10,
                staff: processedStaff
            });
        }
    } else {
        onAddContract({
            clientName: contractForm.clientName,
            contractValue: parseFloat(contractForm.contractValue) || 0,
            invoiceDay: parseInt(contractForm.invoiceDay) || 10,
            staff: processedStaff
        });
    }

    handleCancelForm();
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
      motoAluguel: parseFloat(newStaffMember.motoAluguel) || 0,
      fgts: parseFloat(newStaffMember.fgts) || 0,
      inss: parseFloat(newStaffMember.inss) || 0
    }]);

    setNewStaffMember({ employeeName: '', department: '', salary: '', vr: '', vt: '', periculosidade: '', motoAluguel: '', fgts: '', inss: '' });
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
      fgts: parseFloat(staffForm.fgts) || 0,
      inss: parseFloat(staffForm.inss) || 0,
      createdAt: new Date().toISOString()
    };

    const updatedContract = {
      ...contract,
      staff: [...(contract.staff || []), newStaff]
    };

    onUpdateContract(updatedContract);
    setAddingStaffToId(null);
    setStaffForm({ employeeName: '', role: '', department: '', salary: '', vr: '', vt: '', periculosidade: '', motoAluguel: '', fgts: '', inss: '' });
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
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Contratos Fixos</h1>
          <p className="text-gray-500 font-medium">Gestão de faturamento recorrente e custos de pessoal</p>
        </div>
        <Button onClick={() => showAddForm ? handleCancelForm() : setShowAddForm(true)} variant={showAddForm ? 'outline' : 'primary'}>
          {showAddForm ? 'Cancelar Operação' : <><Icons.Plus /> Novo Contrato</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-primary bg-white shadow-sm">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Receita Bruta Mensal</span>
          <span className="text-2xl font-black text-gray-900 block mt-1">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </Card>
        <Card className="p-5 border-l-4 border-l-red-500 bg-white shadow-sm">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Custo de Pessoal unificado</span>
          <span className="text-2xl font-black text-red-600 block mt-1">R$ {totalStaffCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </Card>
        <Card className={`p-5 border-l-4 shadow-sm ${globalMargin >= 0 ? 'border-l-emerald-500 bg-emerald-50/30' : 'border-l-red-600 bg-red-50/30'}`}>
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Margem Operacional Fixa</span>
            <span className="text-[9px] font-bold text-gray-400 bg-white/60 px-2 py-0.5 rounded border border-gray-100">-8% ISS/NF</span>
          </div>
          <span className={`text-2xl font-black block mt-1 ${globalMargin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            R$ {globalMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </Card>
      </div>

      {showAddForm && (
        <Card className={`p-8 animate-in zoom-in duration-300 border-2 ${editingContractId ? 'border-secondary/30 bg-secondary/5' : 'border-primary/20 bg-primary/5'}`}>
          <h3 className={`font-black mb-8 uppercase text-sm tracking-[0.2em] flex items-center gap-3 ${editingContractId ? 'text-secondary' : 'text-primary'}`}>
            {editingContractId ? <Icons.Edit /> : <Icons.Plus />} 
            {editingContractId ? 'Alterar Contrato Existente' : 'Cadastrar Novo Contrato Corporativo'}
          </h3>
          
          <form onSubmit={handleContractSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="Nome do Cliente / Empresa" placeholder="Ex: Banco Central" value={contractForm.clientName} onChange={e => setContractForm({...contractForm, clientName: e.target.value})} required className="bg-white h-11 border-gray-200" />
              <Input label="Valor do Contrato (R$)" type="number" step="0.01" value={contractForm.contractValue} onChange={e => setContractForm({...contractForm, contractValue: e.target.value})} required className="bg-white h-11 border-gray-200 font-bold" />
              <Input label="Dia Vencimento NF" type="number" min="1" max="31" value={contractForm.invoiceDay} onChange={e => setContractForm({...contractForm, invoiceDay: e.target.value})} required className="bg-white h-11 border-gray-200" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-inner">
               <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Icons.Users /> Gestão de Staff vinculada ao Contrato
               </h4>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                  <Input label="Funcionário" placeholder="Nome" value={newStaffMember.employeeName} onChange={e => setNewStaffMember({...newStaffMember, employeeName: e.target.value})} className="text-sm border-gray-100" />
                  <Input label="Setor" placeholder="Logística" value={newStaffMember.department} onChange={e => setNewStaffMember({...newStaffMember, department: e.target.value})} className="text-sm border-gray-100" />
                  <Input label="Salário Base" type="number" value={newStaffMember.salary} onChange={e => setNewStaffMember({...newStaffMember, salary: e.target.value})} className="text-sm border-gray-100" />
                  <Input label="VR (Mensal)" type="number" value={newStaffMember.vr} onChange={e => setNewStaffMember({...newStaffMember, vr: e.target.value})} className="text-sm border-gray-100" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                  <Input label="VT (Mensal)" type="number" value={newStaffMember.vt} onChange={e => setNewStaffMember({...newStaffMember, vt: e.target.value})} className="text-sm border-gray-100" />
                  <Input label="Periculosidade" type="number" value={newStaffMember.periculosidade} onChange={e => setNewStaffMember({...newStaffMember, periculosidade: e.target.value})} className="text-sm border-gray-100" />
                  <Input label="Aluguel Moto" type="number" value={newStaffMember.motoAluguel} onChange={e => setNewStaffMember({...newStaffMember, motoAluguel: e.target.value})} className="text-sm border-gray-100" />
                  <div className="md:col-span-1">
                    <div className="grid grid-cols-2 gap-2">
                         <Input label="FGTS" type="number" value={newStaffMember.fgts} onChange={e => setNewStaffMember({...newStaffMember, fgts: e.target.value})} className="text-xs border-gray-100" />
                         <Input label="INSS" type="number" value={newStaffMember.inss} onChange={e => setNewStaffMember({...newStaffMember, inss: e.target.value})} className="text-xs border-gray-100" />
                    </div>
                  </div>
               </div>
               <div className="flex justify-end">
                    <Button type="button" variant="secondary" onClick={addStaffToNewContract} className="text-[10px] font-black uppercase px-6">
                        <Icons.Plus /> Adicionar à Lista
                    </Button>
               </div>

               {initialStaff.length > 0 && (
                 <div className="mt-8 overflow-hidden border border-gray-100 rounded-xl">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-gray-50 text-gray-400 font-black uppercase tracking-tighter">
                        <tr>
                          <th className="px-4 py-3">Nome / Setor</th>
                          <th className="px-4 py-3">Salário</th>
                          <th className="px-4 py-3">Benefícios</th>
                          <th className="px-4 py-3">Encargos/Moto</th>
                          <th className="px-4 py-3">Custo Real</th>
                          <th className="px-4 py-3 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {initialStaff.map((s, idx) => {
                          const subTotal = calculateTotalMemberCost(s);
                          return (
                            <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-black text-gray-800 uppercase">{s.employeeName}</div>
                                <div className="text-[9px] text-gray-400 font-bold">{s.department || 'Operação'}</div>
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-600">R$ {s.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3">R$ {((s.vr || 0) + (s.vt || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3 text-gray-400">R$ {((s.periculosidade || 0) + (s.motoAluguel || 0) + (s.fgts || 0) + (s.inss || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3 font-black text-red-500 bg-red-50/30">R$ {subTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3 text-right">
                                <button type="button" onClick={() => setInitialStaff(initialStaff.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 p-2 transition-colors">
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

            <div className={`flex justify-end gap-3 pt-6 border-t ${editingContractId ? 'border-secondary/20' : 'border-primary/10'}`}>
              <Button type="button" variant="ghost" onClick={handleCancelForm}>Cancelar</Button>
              <Button type="submit" variant={editingContractId ? 'secondary' : 'primary'} className="px-12 font-black uppercase tracking-widest text-xs">
                 {editingContractId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {contracts.length === 0 ? (
            <Card className="p-20 text-center border-dashed border-2 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4"><Icons.Building /></div>
                <h3 className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum contrato fixo ativo</h3>
            </Card>
        ) : (
            contracts.map(contract => {
                const contractTax = contract.contractValue * 0.08;
                const contractStaffCost = contract.staff?.reduce((acc, s) => acc + s.salary + (s.vr || 0) + (s.vt || 0) + (s.periculosidade || 0) + (s.motoAluguel || 0) + (s.fgts || 0) + (s.inss || 0), 0) || 0;
                const contractNet = contract.contractValue - contractTax - contractStaffCost;

                return (
                    <Card key={contract.id} className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all group">
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex flex-col md:flex-row justify-between gap-6 items-center">
                        <div className="flex items-center gap-5 w-full md:w-auto">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/5">
                                <Icons.Building />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase group-hover:text-primary transition-colors">{contract.clientName}</h3>
                                <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                    <span>FATURAMENTO: <b className="text-gray-900">R$ {contract.contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
                                    <span>VENCIMENTO: <b className="text-gray-900">DIA {contract.invoiceDay}</b></span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Resultado Líquido</span>
                                <span className={`text-2xl font-black tabular-nums ${contractNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    R$ {contractNet.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
                                <button 
                                    onClick={() => handleEditClick(contract)} 
                                    className="p-3 bg-white text-gray-400 hover:text-secondary hover:bg-secondary/5 border border-gray-100 rounded-xl transition-all shadow-sm active:scale-95"
                                    title="Alterar Contrato"
                                >
                                    <Icons.Edit />
                                </button>
                                <button 
                                    onClick={() => onDeleteContract(contract.id)} 
                                    className="p-3 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-100 rounded-xl transition-all shadow-sm active:scale-95"
                                    title="Excluir"
                                >
                                    <Icons.Trash />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white">
                        <div className="flex justify-between items-center mb-5">
                            <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Icons.Users /> Staff Alocada ({contract.staff?.length || 0})
                            </h4>
                            <button 
                                onClick={() => setAddingStaffToId(addingStaffToId === contract.id ? null : contract.id)} 
                                className="text-[9px] font-black text-primary hover:text-secondary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full transition-all border border-primary/10"
                            >
                                {addingStaffToId === contract.id ? 'Fechar Formulário' : <><Icons.Plus /> Rápido Lançamento</>}
                            </button>
                        </div>

                        {addingStaffToId === contract.id && (
                            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                                    <Input label="Nome" value={staffForm.employeeName} onChange={e => setStaffForm({...staffForm, employeeName: e.target.value})} className="bg-white h-10 text-xs" />
                                    <Input label="Setor" value={staffForm.department} onChange={e => setStaffForm({...staffForm, department: e.target.value})} className="bg-white h-10 text-xs" />
                                    <Input label="Salário" type="number" value={staffForm.salary} onChange={e => setStaffForm({...staffForm, salary: e.target.value})} className="bg-white h-10 text-xs font-bold" />
                                    <Input label="VR" type="number" value={staffForm.vr} onChange={e => setStaffForm({...staffForm, vr: e.target.value})} className="bg-white h-10 text-xs" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                                    <Input label="VT" type="number" value={staffForm.vt} onChange={e => setStaffForm({...staffForm, vt: e.target.value})} className="bg-white h-10 text-xs" />
                                    <Input label="Peric." type="number" value={staffForm.periculosidade} onChange={e => setStaffForm({...staffForm, periculosidade: e.target.value})} className="bg-white h-10 text-xs" />
                                    <Input label="Aluguel Moto" type="number" value={staffForm.motoAluguel} onChange={e => setStaffForm({...staffForm, motoAluguel: e.target.value})} className="bg-white h-10 text-xs" />
                                    <Input label="FGTS" type="number" value={staffForm.fgts} onChange={e => setStaffForm({...staffForm, fgts: e.target.value})} className="bg-white h-10 text-xs" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <Input label="INSS" type="number" value={staffForm.inss} onChange={e => setStaffForm({...staffForm, inss: e.target.value})} className="bg-white h-10 text-xs" />
                                    <div className="md:col-span-3">
                                        <Button onClick={() => handleAddStaffToExisting(contract.id)} variant="secondary" className="w-full h-10 text-xs font-black uppercase">Vincular Colaborador</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full text-[10px] text-left">
                                <thead className="bg-gray-50/50 text-gray-400 font-black uppercase tracking-tighter">
                                    <tr>
                                        <th className="px-5 py-3">Funcionário</th>
                                        <th className="px-5 py-3">Salário</th>
                                        <th className="px-5 py-3">Bens / Benefícios</th>
                                        <th className="px-5 py-3">Encargos Totais</th>
                                        <th className="px-5 py-3">Impacto Caixa</th>
                                        <th className="px-5 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {contract.staff?.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-300 italic">Nenhum colaborador alocado.</td></tr>
                                    ) : (
                                        contract.staff?.map(member => {
                                            const subTotal = (member.salary || 0) + (member.vr || 0) + (member.vt || 0) + (member.periculosidade || 0) + (member.motoAluguel || 0) + (member.fgts || 0) + (member.inss || 0);
                                            return (
                                                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="font-black text-gray-800 uppercase tracking-tighter">{member.employeeName}</div>
                                                        <div className="text-[8px] font-bold text-gray-400 uppercase">{member.department || 'Pessoal'}</div>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-gray-600">R$ {member.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-5 py-4">R$ {((member.vr || 0) + (member.vt || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-5 py-4 text-gray-400">R$ {((member.periculosidade || 0) + (member.motoAluguel || 0) + (member.fgts || 0) + (member.inss || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-5 py-4 font-black text-red-600 bg-red-50/20">R$ {subTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button onClick={() => removeStaff(contract.id, member.id)} className="text-gray-200 hover:text-red-400 p-2 transition-colors">
                                                            <Icons.Trash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
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
