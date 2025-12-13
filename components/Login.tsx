
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await DataManager.authenticate(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Usuário ou senha incorretos.');
      }
    } catch (err) {
      setError('Erro ao tentar fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

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
             <p>operacional / 123</p>
             <p>cliente / 123</p>
          </div>
        </form>
      </Card>
    </div>
  );
};
