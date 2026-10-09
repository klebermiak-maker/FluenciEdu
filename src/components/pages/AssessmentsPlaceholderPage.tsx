import React from 'react';
import { Mic, Sparkles, BookOpen, Clock, AudioWaveform as Waveform, AlertCircle, ArrowRight } from 'lucide-react';
import { NavigationPage } from '../../types/database';

interface AssessmentsPlaceholderPageProps {
  onNavigate: (page: NavigationPage) => void;
}

export const AssessmentsPlaceholderPage: React.FC<AssessmentsPlaceholderPageProps> = ({
  onNavigate,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Notice Banner */}
      <div className="rounded-3xl border border-amber-200 bg-linear-to-r from-amber-50 via-orange-50 to-amber-50 p-6 sm:p-8 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shrink-0 shadow-sm">
            <Mic className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              Módulo Planejado para a FASE 2
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-amber-950">
              Módulo de Avaliação de Fluência Leitora
            </h2>
            <p className="text-sm text-amber-900/80 leading-relaxed">
              Conforme as especificações da <strong>Fase 1</strong>, esta funcionalidade encontra-se com sua estrutura de banco de dados e armazenamento (Supabase Storage) previamente configurada e será desenvolvida nas etapas seguintes.
            </p>
          </div>
        </div>
      </div>

      {/* Planned Feature Architecture Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          O que será implementado na Fase 2:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Cronômetro & Gravação de Leitura</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gravação de áudio contínua de 60 segundos com captura de ondas sonoras em tempo real diretamente pelo navegador (Web Audio API).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Textos Nivelados por Ano Escolar</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Banco curricular com textos adequados para cada ano do Ensino Fundamental (1º ao 5º ano) conforme a BNCC.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Análise Automática por Inteligência Artificial</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transcrição e contagem de palavras lidas por minuto (PPM), índice de precisão e detecção de pausas e hesitações.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Mic className="w-4 h-4 text-amber-600" />
              <span>Armazenamento em Nuvem Seguro</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload e guarda das gravações no Supabase Storage (`audio-recordings`) para auditoria pedagógica.
            </p>
          </div>
        </div>

        {/* Action shortcut to students */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Enquanto isso, complete o cadastro das escolas, turmas e estudantes.
          </span>
          <button
            type="button"
            onClick={() => onNavigate('students')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            <span>Ver Alunos Cadastrados</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
