import React from 'react';
import { BarChart3, TrendingUp, Download, PieChart, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { NavigationPage } from '../../types/database';

interface ReportsPlaceholderPageProps {
  onNavigate: (page: NavigationPage) => void;
}

export const ReportsPlaceholderPage: React.FC<ReportsPlaceholderPageProps> = ({
  onNavigate,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Notice Banner */}
      <div className="rounded-3xl border border-purple-200 bg-linear-to-r from-purple-50 via-indigo-50 to-purple-50 p-6 sm:p-8 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shrink-0 shadow-sm">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-200/80 text-purple-900 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              Módulo Planejado para a FASE 3
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-purple-950">
              Relatórios Pedagógicos & Diagnósticos de Fluência
            </h2>
            <p className="text-sm text-purple-900/80 leading-relaxed">
              O módulo de relatórios analíticos, gráficos de desempenho por turma e escola, e fichas individuais de diagnóstico leitor será disponibilizado nas próximas etapas do projeto.
            </p>
          </div>
        </div>
      </div>

      {/* Planned Feature Architecture Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Funcionalidades em Desenvolvimento para Fases Futuras:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Curva de Evolução</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Acompanhamento longitudinal do ganho de fluência por bimestre e ano letivo.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Diagnóstico da Rede</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Percentuais de pré-leitores, leitores iniciantes e fluentes para secretarias de educação.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Download className="w-4 h-4 text-blue-600" />
              <span>Exportação em PDF/Excel</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fichas individuais para reunião de pais e relatórios para planejamento pedagógico.
            </p>
          </div>
        </div>

        {/* Action shortcut to dashboard */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Acompanhe o panorama geral atual através do painel.
          </span>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
          >
            <span>Voltar ao Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
