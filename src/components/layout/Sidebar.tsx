import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  GraduationCap, 
  Users, 
  FileSpreadsheet, 
  Mic, 
  BarChart3, 
  UserCheck, 
  LogOut, 
  X, 
  BookOpen,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { NavigationPage, UserRole } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavigationPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  isUpcoming?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'schools', label: 'Escolas', icon: Building2 },
  { id: 'classes', label: 'Turmas', icon: GraduationCap },
  { id: 'students', label: 'Alunos', icon: Users },
  { id: 'import', label: 'Importar Alunos', icon: FileSpreadsheet },
  { 
    id: 'assessments', 
    label: 'Avaliações', 
    icon: Mic, 
    badge: 'Fase 2', 
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    isUpcoming: true 
  },
  { 
    id: 'reports', 
    label: 'Relatórios', 
    icon: BarChart3, 
    badge: 'Fase 3', 
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    isUpcoming: true 
  },
  { id: 'profile', label: 'Meu Perfil', icon: UserCheck },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { profile, logout, switchDemoRole } = useAuth();

  const handleItemClick = (pageId: NavigationPage) => {
    onNavigate(pageId);
    onCloseMobile();
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'gestor':
        return { label: 'Gestor', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'professor':
      default:
        return { label: 'Professor(a)', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  const roleInfo = getRoleBadge(profile?.role);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-200 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navegação principal"
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-slate-100 bg-linear-to-r from-blue-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-md ring-2 ring-blue-400/30">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Fluenci<span className="text-emerald-400">Edu</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/40 text-blue-100 tracking-wider">
                  FASE 1
                </span>
              </div>
              <p className="text-xs text-blue-200 font-semibold flex items-center gap-1">
                <span>Itaúba - MT</span>
                <span className="text-emerald-300">• SEMEC</span>
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/50 lg:hidden focus:ring-2 focus:ring-white"
            aria-label="Fechar menu lateral"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white font-bold text-sm shadow-xs">
              {profile?.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate" title={profile?.nome}>
                {profile?.nome || 'Usuário'}
              </p>
              <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          {/* Quick role switcher for testing / review */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Perfil demo:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => switchDemoRole('professor')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  profile?.role === 'professor' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title="Trocar para Professor"
              >
                Prof
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('gestor')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  profile?.role === 'gestor' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title="Trocar para Gestor"
              >
                Gestor
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('admin')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  profile?.role === 'admin' ? 'bg-purple-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title="Trocar para Admin"
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Módulos do Sistema
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isActive ? 'bg-white/20 text-white border-transparent' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Database Status indicator */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 text-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Banco PostgreSQL:
            </span>
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Supabase
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200" title="Persistência local ativa">
                <CheckCircle2 className="w-3 h-3 text-blue-600" /> Local Persistente
              </span>
            )}
          </div>
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors focus:ring-2 focus:ring-rose-500"
          >
            <LogOut className="h-5 w-5 shrink-0 text-rose-500" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};
