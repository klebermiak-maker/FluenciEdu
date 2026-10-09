import React, { useState, useEffect } from 'react';
import { Menu, School as SchoolIcon, Bell, Sparkles, WifiOff, Wifi } from 'lucide-react';
import { NavigationPage } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  currentPage: NavigationPage;
  onOpenMobileMenu: () => void;
  onNavigate: (page: NavigationPage) => void;
  schoolName?: string;
}

const PAGE_TITLES: Record<NavigationPage, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Painel Geral de Fluência',
    subtitle: 'Visão panorâmica de escolas, turmas e alunos cadastrados',
  },
  schools: {
    title: 'Cadastro de Escolas',
    subtitle: 'Gerenciamento de unidades escolares participantes da avaliação',
  },
  classes: {
    title: 'Gestão de Turmas',
    subtitle: 'Organização de séries, turnos e professores responsáveis',
  },
  students: {
    title: 'Cadastro de Alunos',
    subtitle: 'Lista de estudantes dos anos iniciais do Ensino Fundamental',
  },
  materials: {
    title: 'Materiais de Leitura',
    subtitle: 'Palavras, pseudopalavras e textos curtos para prática e avaliação',
  },
  import: {
    title: 'Importação em Lote via CSV',
    subtitle: 'Carregamento rápido de estudantes com validação automática',
  },
  assessments: {
    title: 'Avaliações de Fluência Leitora',
    subtitle: 'Gravação e armazenamento de áudio de leitura dos alunos (Fase 2)',
  },
  reports: {
    title: 'Relatórios & Diagnósticos',
    subtitle: 'Módulo de métricas de fluência, precisão e evolução (Fase 3)',
  },
  profile: {
    title: 'Meu Perfil & Configurações',
    subtitle: 'Dados cadastrais, escola vinculada e segurança de acesso',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentPage,
  onOpenMobileMenu,
  onNavigate,
  schoolName,
}) => {
  const { profile } = useAuth();
  const pageMeta = PAGE_TITLES[currentPage] || { title: 'FluenciEdu', subtitle: '' };

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left side: Hamburger button + Page Title */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 lg:hidden"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 truncate">
              {pageMeta.title}
            </h1>
            {!isOnline && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                <WifiOff className="w-3 h-3 text-amber-700" />
                Offline
              </span>
            )}
          </div>
          <p className="hidden sm:block text-xs text-slate-500 truncate">
            {pageMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: School badge, Offline status, Phase 1 badge, Profile shortcut */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {!isOnline && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Visualização Offline</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
          <span className="h-2 w-2 rounded-full bg-blue-600"></span>
          <span>Itaúba - MT</span>
        </div>

        {schoolName && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 text-slate-700 text-xs font-semibold border border-slate-200">
            <SchoolIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="max-w-[180px] truncate" title={schoolName}>
              {schoolName}
            </span>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Fase 1 Concluída
        </div>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200/80 transition-colors focus:ring-2 focus:ring-blue-500"
          title="Ver perfil do usuário"
        >
          <div className="h-8 w-8 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            {profile?.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 max-w-[120px] truncate">
            {profile?.nome?.split(' ')[0] || 'Perfil'}
          </span>
        </button>
      </div>
    </header>
  );
};
