import React, { useState } from 'react';
import { 
  BookOpen, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  KeyRound, 
  ArrowLeft,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/database';

export const AuthPages: React.FC = () => {
  const { login, signUp, resetPassword, switchDemoRole } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [role, setRole] = useState<UserRole>('professor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao realizar login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await signUp(nome, email, password, role);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao cadastrar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setMode('login');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao solicitar recuperação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg ring-4 ring-blue-500/20 mb-2">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Fluenci<span className="text-emerald-500">Edu</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
          Sistema de Avaliação de Fluência Leitora dos anos iniciais do Ensino Fundamental
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Error Alert if any */}
        {errorMsg && (
          <div className="m-6 mb-0 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Acesse sua conta</h2>
              <p className="text-xs text-slate-500 mt-1">
                Informe suas credenciais para gerenciar escolas e alunos
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail institucional
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="professor@escola.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Senha de acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('forgot');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Entrando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Login Bar */}
            <div className="pt-4 border-t border-slate-100 text-center space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Acesso Rápido de Teste (1 Clique)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => switchDemoRole('professor')}
                  className="py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition-colors"
                >
                  Professor
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole('gestor')}
                  className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                >
                  Gestor
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole('admin')}
                  className="py-2 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-colors"
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Switch to Register */}
            <div className="text-center pt-2 text-xs text-slate-500">
              Não possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('register');
                }}
                className="font-bold text-blue-600 hover:underline"
              >
                Criar cadastro
              </button>
            </div>
          </div>
        )}

        {/* 2. REGISTER MODE */}
        {mode === 'register' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Criar nova conta</h2>
              <p className="text-xs text-slate-500 mt-1">
                Cadastre-se para ter acesso ao sistema de avaliação
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Profª. Juliana Albuquerque"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail institucional *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="juliana@escola.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha (mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Função / Papel
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="professor">Professor(a) Alfabetizador(a)</option>
                  <option value="gestor">Gestor / Coordenador Pedagógico</option>
                  <option value="admin">Administrador Geral</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Criando conta...' : 'Concluir Cadastro'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>

            {/* Back to login */}
            <div className="text-center pt-2 text-xs text-slate-500">
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('login');
                }}
                className="font-bold text-blue-600 hover:underline"
              >
                Fazer login
              </button>
            </div>
          </div>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('login');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao login</span>
              </button>
              <h2 className="text-xl font-bold text-slate-900">Recuperar Senha</h2>
              <p className="text-xs text-slate-500 mt-1">
                Informe o seu e-mail cadastrado para receber o link de redefinição
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail cadastrado *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@escola.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando...' : 'Enviar Link de Recuperação'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        FluenciEdu © {new Date().getFullYear()} • Fase 1: Estrutura Inicial e Cadastros
      </div>
    </div>
  );
};
