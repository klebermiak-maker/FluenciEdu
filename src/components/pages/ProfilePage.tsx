import React, { useState } from 'react';
import { 
  UserCheck, 
  Mail, 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Save, 
  Check, 
  Database, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { School, UserRole } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { isSupabaseConfigured, localDB } from '../../services/supabase';

interface ProfilePageProps {
  schools: School[];
  onRefreshData?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ schools, onRefreshData }) => {
  const { profile, updateProfile, switchDemoRole } = useAuth();
  const { addToast } = useToast();

  const [nome, setNome] = useState(profile?.nome || '');
  const [escolaId, setEscolaId] = useState(profile?.escola_id || schools[0]?.id || '');
  const [role, setRole] = useState<UserRole>(profile?.role || 'professor');
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      addToast('Nome obrigatório', 'Informe o seu nome completo.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        nome: nome.trim(),
        escola_id: escolaId || null,
        role,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      addToast('Senha fraca', 'A nova senha deve possuir no mínimo 6 caracteres.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Senhas não conferem', 'A confirmação de senha é diferente da nova senha.', 'warning');
      return;
    }

    setIsChangingPass(true);
    try {
      // Simulate/trigger password change
      await new Promise((r) => setTimeout(r, 600));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Senha alterada', 'Sua senha foi atualizada com sucesso!', 'success');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar as escolas, turmas e alunos para os dados padrão de demonstração?')) {
      localDB.resetToDefault();
      if (onRefreshData) onRefreshData();
      addToast('Dados restaurados', 'Os dados de demonstração foram restaurados com sucesso.', 'info');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Profile Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white font-extrabold text-2xl shadow-md">
            {profile?.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{profile?.nome || 'Usuário'}</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'gestor' ? 'Gestor' : 'Professor'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email}
            </p>
          </div>
        </div>

        {/* Demo Fast Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-medium text-slate-500 pl-1">Alternar perfil:</span>
          <button
            type="button"
            onClick={() => switchDemoRole('professor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              profile?.role === 'professor' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Professor
          </button>
          <button
            type="button"
            onClick={() => switchDemoRole('gestor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              profile?.role === 'gestor' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Gestor
          </button>
          <button
            type="button"
            onClick={() => switchDemoRole('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              profile?.role === 'admin' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form: Editar Informações Básicas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Informações Cadastrais
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail (Login)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Escola Vinculada
              </label>
              <select
                value={escolaId || ''}
                onChange={(e) => setEscolaId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Nenhuma escola vinculada (Geral)</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Função no Sistema
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="professor">Professor (Aplica avaliações e gerencia turmas)</option>
                <option value="gestor">Gestor (Coordenação pedagógica e relatórios)</option>
                <option value="admin">Administrador (Gestão completa da rede e escolas)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </form>
        </div>

        {/* Form: Alterar Senha */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Segurança & Senha
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senha Atual
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nova Senha (mínimo 6 caracteres) *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isChangingPass ? 'Atualizando...' : 'Alterar Senha'}</span>
            </button>
          </form>

          {/* Reset Demo Data Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Escolas/Turmas de Demonstração</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
