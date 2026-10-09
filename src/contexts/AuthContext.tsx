import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, UserRole } from '../types/database';
import { authService, UserSession } from '../services/authService';
import { useToast } from './ToastContext';

interface AuthContextType {
  session: UserSession | null;
  profile: Profile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signUp: (nome: string, email: string, pass: string, role: UserRole, escola_id?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { nome?: string; escola_id?: string | null; role?: UserRole }) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function init() {
      try {
        const initial = await authService.getInitialSession();
        setSession(initial);
      } catch (err) {
        console.error('Falha ao restaurar sessão:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const sess = await authService.login(email, pass);
      setSession(sess);
      addToast('Bem-vindo ao FluenciEdu!', `Olá, ${sess.profile.nome}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar login.';
      addToast('Erro no login', msg, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (nome: string, email: string, pass: string, role: UserRole, escola_id?: string) => {
    setIsLoading(true);
    try {
      const sess = await authService.signUp(nome, email, pass, role, escola_id);
      setSession(sess);
      addToast('Conta criada com sucesso!', 'Sua conta de acesso foi registrada.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta.';
      addToast('Erro no cadastro', msg, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setSession(null);
      addToast('Sessão encerrada', 'Você saiu do sistema com segurança.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
      addToast(
        'E-mail de recuperação enviado',
        `Se o e-mail ${email} estiver cadastrado, você receberá o link para redefinir sua senha.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao solicitar recuperação.';
      addToast('Erro na recuperação', msg, 'error');
      throw err;
    }
  };

  const updateProfile = async (updates: { nome?: string; escola_id?: string | null; role?: UserRole }) => {
    if (!session) return;
    try {
      const updated = await authService.updateProfile(session.id, updates);
      setSession({
        ...session,
        profile: updated,
      });
      addToast('Perfil atualizado', 'As informações foram salvas com sucesso.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar perfil.';
      addToast('Erro ao salvar', msg, 'error');
      throw err;
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const newSess = await authService.switchDemoUser(role);
      setSession(newSess);
      addToast('Perfil alternado', `Agora navegando como ${role.toUpperCase()}`, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile: session?.profile || null,
        isLoading,
        login,
        signUp,
        logout,
        resetPassword,
        updateProfile,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
