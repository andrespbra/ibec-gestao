
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <Icons.Truck />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">LogiTrack AI</h1>
          <p className="text-gray-500 text-sm">Acesse sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Usuário" 
            placeholder="Digite seu usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          
          <Input 
            label="Senha" 
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full py-3" isLoading={isLoading}>
            Entrar no Sistema
          </Button>
          
          <div className="mt-6 text-center text-xs text-gray-400">
             <p>Acessos Padrão (Demo):</p>
             <p>admin / admin</p>
             <p>edna / 123 (Troca de senha)</p>
          </div>
        </form>
      </Card>
    </div>
  );
};
