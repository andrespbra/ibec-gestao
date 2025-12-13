
import React, { useState } from 'react';
import { Card, Button, Input, Icons } from './Components';
import { User } from '../types';
import { DataManager } from '../services/dataManager';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Force Password Change
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await DataManager.authenticate(username, password);
      if (user) {
        if (user.mustChangePassword) {
            setPendingUser(user);
        } else {
            onLogin(user);
        }
      } else {
        setError('Usuário ou senha incorretos.');
      }
    } catch (err) {
      setError('Erro ao tentar fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          setError('As senhas não coincidem.');
          return;
      }
      if (newPassword.length < 3) {
          setError('A senha deve ter pelo menos 3 caracteres.');
          return;
      }

      setIsLoading(true);
      try {
          if (pendingUser) {
              await DataManager.changePassword(pendingUser.id, newPassword);
              // Update local pending user to proceed
              onLogin({ ...pendingUser, mustChangePassword: false });
          }
      } catch (err) {
          setError('Erro ao atualizar senha.');
      } finally {
          setIsLoading(false);
      }
  };

  if (pendingUser) {
      return (
        <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-orange-500">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
                        <Icons.Settings />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">Troca de Senha Obrigatória</h1>
                    <p className="text-gray-500 text-sm text-center">Olá <b>{pendingUser.name}</b>, este é seu primeiro acesso. Por segurança, defina uma nova senha.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6">
                    <Input 
                        label="Nova Senha" 
                        type="password"
                        placeholder="Digite sua nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoFocus
                    />
                    
                    <Input 
                        label="Confirme a Nova Senha" 
                        type="password"
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                        {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-700" isLoading={isLoading}>
                        Atualizar Senha e Entrar
                    </Button>
                </form>
            </Card>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-surface">
         <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md p-8 shadow-2xl relative z-10 border-t-4 border-primary">
        <div className="flex flex-col items-center mb-8">
          {/* Logo Section */}
          <div className="mb-6 flex items-center justify-center">
             <div className="p-2">
                <img 
                    src="https://ibecexpress.com.br/wp-content/uploads/2022/09/cropped-fotologo.png" 
                    alt="CRM IBEC" 
                    className="h-24 w-auto object-contain"
                    onError={(e) => {
                        // Fallback in case image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="text-4xl">🚚</div>';
                    }}
                />
             </div>
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">CRM IBEC</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão Logística Inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Usuário" 
            placeholder="Digite seu usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="border-gray-300 focus:border-primary focus:ring-primary"
          />
          
          <Input 
            label="Senha" 
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-gray-300 focus:border-primary focus:ring-primary"
          />

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          <Button type="submit" className="w-full py-3 bg-primary hover:bg-purple-800 text-white font-bold shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.01]" isLoading={isLoading}>
            ACESSAR SISTEMA
          </Button>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400 mb-2 font-medium">DADOS DE ACESSO (DEMO)</p>
             <div className="flex justify-center gap-4 text-xs text-gray-500">
                 <span className="bg-gray-100 px-2 py-1 rounded">admin / admin</span>
                 <span className="bg-gray-100 px-2 py-1 rounded">edna / 123</span>
             </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
