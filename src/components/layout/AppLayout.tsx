import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NavigationPage } from '../../types/database';

interface AppLayoutProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  schoolName?: string;
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  schoolName,
  children,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Close mobile drawer on desktop screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpenMobile(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile) {
        setIsOpenMobile(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile]);

  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  const handleCloseMobile = useCallback(() => {
    setIsOpenMobile(false);
  }, []);

  const handleOpenMobile = useCallback(() => {
    setIsOpenMobile(true);
  }, []);

  return (
    <div className="relative flex h-screen h-[100dvh] w-full bg-slate-50 overflow-hidden font-sans text-slate-800 antialiased">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-hidden"
      >
        Pular para o conteúdo principal
      </a>

      {/* Responsive Sidebar (Mobile Drawer + Permanent Desktop Sidebar) */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpenMobile={isOpenMobile}
        onCloseMobile={handleCloseMobile}
      />

      {/* Main Column: Header + Content */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Responsive Header / TopBar */}
        <TopBar
          currentPage={currentPage}
          onOpenMobileMenu={handleOpenMobile}
          onNavigate={onNavigate}
          schoolName={schoolName}
        />

        {/* Central Content Area */}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 focus:outline-hidden"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="mx-auto max-w-7xl w-full flex flex-col min-h-full justify-between pb-8">
            {/* Page Content */}
            <div className="w-full">
              {children}
            </div>

            {/* Application Footer */}
            <footer className="mt-12 pt-6 border-t border-slate-200/70 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-400">
              <p>
                FluenciEdu © {new Date().getFullYear()} • Município de Itaúba - MT • Secretaria Municipal de Educação
              </p>
              <div className="mt-2 sm:mt-0 flex items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                  Rede Municipal de Itaúba • MT
                </span>
                <span className="text-emerald-600 font-semibold">
                  Fase 1 Concluída
                </span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};
