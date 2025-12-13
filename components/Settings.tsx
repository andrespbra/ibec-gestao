
import React, { useState, useEffect } from 'react';
import { VehicleRate, User, UserRole } from '../types';
import { Card, Input, Icons, Button, Select } from './Components';
import { DataManager } from '../services/dataManager';

interface SettingsProps {
    rates: VehicleRate[];
    onUpdateRate: (newRate: VehicleRate) => void;
}

export const Settings: React.FC<SettingsProps> = ({ rates, onUpdateRate }) => {
    const [activeTab, setActiveTab] = useState<'RATES' | 'USERS'>('RATES');
    const [users, setUsers] = useState<User[]>([]);
    
    // User Form State
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [userData, setUserData] = useState<Partial<User>>({
        username: '',
        password: '',
        role: 'OPERATIONAL',
        name: '',
        mustChangePassword: true
    });

    useEffect(() => {
        if (activeTab === 'USERS') {
            loadUsers();
        }
    }, [activeTab]);

    const loadUsers = async () => {
        const u = await DataManager.fetchUsers();
        setUsers(u);
    };

    const handleRateChange = (vehicleType: string, field: keyof VehicleRate, value: string) => {
        const rate = rates.find(r => r.type === vehicleType);
        if (rate) {
            onUpdateRate({
                ...rate,
                [field]: parseFloat(value) || 0
            });
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (userData.id) {
                // Update
                await DataManager.updateUser(userData as User);
            } else {
                // Create
                const newUser: User = {
                    ...userData as User,
                    id: Math.random().toString(36).substr(2, 9)
                };
                await DataManager.addUser(newUser);
            }
            setIsEditingUser(false);
            setUserData({ username: '', password: '', role: 'OPERATIONAL', name: '', mustChangePassword: true });
            loadUsers();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            await DataManager.deleteUser(id);
            loadUsers();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
                    <p className="text-gray-600">Gerencie preços e acesso ao sistema</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button 
                    className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'RATES' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('RATES')}
                >
                    <div className="flex items-center gap-2"><Icons.DollarSign /> Tabela de Preços</div>
                </button>
                <button 
                    className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'USERS' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('USERS')}
                >
                    <div className="flex items-center gap-2"><Icons.Users /> Gerenciar Usuários</div>
                </button>
            </div>

            {/* RATES TAB */}
            {activeTab === 'RATES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rates.map(rate => (
                        <Card key={rate.type} className="p-5">
                            <div className="flex items-center gap-3 mb-4 border-b pb-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-primary">
                                    <Icons.Truck />
                                </div>
                                <h3 className="font-bold text-lg">{rate.label}</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Taxa Base (R$)"
                                        type="number" step="0.50"
                                        value={rate.baseFee}
                                        onChange={(e) => handleRateChange(rate.type, 'baseFee', e.target.value)}
                                    />
                                    <div className="text-xs text-gray-400 flex items-end pb-2">Valor inicial da corrida</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Custo/KM (Motorista)"
                                        type="number" step="0.10"
                                        value={rate.costPerKm}
                                        onChange={(e) => handleRateChange(rate.type, 'costPerKm', e.target.value)}
                                    />
                                    <Input 
                                        label="Cobrança/KM (Cliente)"
                                        type="number" step="0.10"
                                        value={rate.chargePerKm}
                                        onChange={(e) => handleRateChange(rate.type, 'chargePerKm', e.target.value)}
                                    />
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded text-xs text-gray-500">
                                    Exemplo 10km: R$ {(rate.baseFee + (10 * rate.chargePerKm)).toFixed(2)} (Cliente)
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'USERS' && (
                <div className="space-y-6">
                    {!isEditingUser ? (
                        <div className="flex justify-end">
                            <Button onClick={() => {
                                setUserData({ username: '', password: '', role: 'OPERATIONAL', name: '', mustChangePassword: true });
                                setIsEditingUser(true);
                            }}>
                                <Icons.Plus /> Adicionar Novo Usuário
                            </Button>
                        </div>
                    ) : (
                        <Card className="p-6 border-l-4 border-l-primary">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">{userData.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <form onSubmit={handleSaveUser} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input 
                                        label="Nome Completo"
                                        value={userData.name}
                                        onChange={e => setUserData({...userData, name: e.target.value})}
                                        required
                                    />
                                    <Select 
                                        label="Permissão / Cargo"
                                        value={userData.role}
                                        onChange={e => setUserData({...userData, role: e.target.value as UserRole})}
                                    >
                                        <option value="ADMIN">Administrador (Acesso Total)</option>
                                        <option value="OPERATIONAL">Operacional (Gestão)</option>
                                        <option value="CLIENT">Cliente (Acesso Limitado)</option>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input 
                                        label="Usuário (Login)"
                                        value={userData.username}
                                        onChange={e => setUserData({...userData, username: e.target.value})}
                                        required
                                        disabled={!!userData.id} // Cannot change username on edit to keep things simple
                                    />
                                    <Input 
                                        label="Senha"
                                        type="text" // Visible for admin creation
                                        value={userData.password}
                                        onChange={e => setUserData({...userData, password: e.target.value})}
                                        required={!userData.id}
                                        placeholder={userData.id ? "Deixe em branco para manter a atual" : ""}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input 
                                        type="checkbox" 
                                        id="forcePass"
                                        checked={userData.mustChangePassword}
                                        onChange={e => setUserData({...userData, mustChangePassword: e.target.checked})}
                                        className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <label htmlFor="forcePass" className="text-sm text-gray-700">Obrigar troca de senha no próximo login?</label>
                                </div>
                                <div className="flex justify-end gap-2 pt-4 border-t mt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsEditingUser(false)}>Cancelar</Button>
                                    <Button type="submit">Salvar Usuário</Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    <Card className="overflow-hidden">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3">Usuário</th>
                                    <th className="px-6 py-3">Permissão</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                                        <td className="px-6 py-4">{u.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold 
                                                ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                                                  u.role === 'OPERATIONAL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button 
                                                onClick={() => {
                                                    setUserData({ ...u, password: '' });
                                                    setIsEditingUser(true);
                                                }}
                                                className="text-gray-500 hover:text-primary"
                                                title="Editar"
                                            >
                                                <Icons.Edit />
                                            </button>
                                            {u.username !== 'admin' && (
                                                <button 
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="text-gray-500 hover:text-red-500"
                                                    title="Excluir"
                                                >
                                                    <Icons.Trash />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}
        </div>
    );
};
