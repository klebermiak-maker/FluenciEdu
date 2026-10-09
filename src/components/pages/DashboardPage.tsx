import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  Users, 
  Mic, 
  PlusCircle, 
  FileSpreadsheet, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  BarChart2, 
  CheckCircle, 
  Clock,
  TrendingUp,
  School as SchoolIcon
} from 'lucide-react';
import { School, ClassRoom, Student, NavigationPage, Assessment } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardPageProps {
  schools: School[];
  classes: ClassRoom[];
  students: Student[];
  assessments?: Assessment[];
  onNavigate: (page: NavigationPage) => void;
  onOpenCreateSchool: () => void;
  onOpenCreateClass: () => void;
  onOpenCreateStudent: () => void;
  onOpenNewAssessment?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  schools,
  classes,
  students,
  assessments = [],
  onNavigate,
  onOpenCreateSchool,
  onOpenCreateClass,
  onOpenCreateStudent,
  onOpenNewAssessment,
}) => {
  const { profile } = useAuth();

  // Metrics
  const totalSchools = schools.length;
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const totalAssessments = assessments.length;

  // Evaluated assessments
  const evaluatedAssessments = assessments.filter(
    (a) => a.avaliacao_detalhes && a.avaliacao_detalhes.estado_correcao === 'revisada'
  );
  const inCorrectionAssessments = assessments.filter(
    (a) => a.avaliacao_detalhes && a.avaliacao_detalhes.estado_correcao === 'em_correcao'
  );

  const avgPCPM = evaluatedAssessments.length > 0
    ? Math.round(
        evaluatedAssessments.reduce(
          (sum, a) => sum + (a.avaliacao_detalhes?.calculo?.pcpm || 0),
          0
        ) / evaluatedAssessments.length
      )
    : 0;

  const avgPrecisao = evaluatedAssessments.length > 0
    ? Math.round(
        evaluatedAssessments.reduce(
          (sum, a) => sum + (a.avaliacao_detalhes?.calculo?.taxa_precisao || 0),
          0
        ) / evaluatedAssessments.length
      )
    : 0;

  // Students per class computation
  const classStudentCounts = classes.map((c) => {
    const count = students.filter((s) => s.turma_id === c.id).length;
    const school = schools.find((s) => s.id === c.escola_id);
    return {
      ...c,
      studentCount: count,
      schoolName: school?.nome || 'Escola não vinculada',
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Rede Municipal de Itaúba - MT • SEMEC</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {profile?.nome || 'Educador(a)'}! 👋
            </h2>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
              Bem-vindo ao sistema de avaliação de fluência leitora da rede municipal de Itaúba - MT (Anos Iniciais do Ensino Fundamental).
              Organize as escolas municipais, turmas e estudantes antes de iniciar as avaliações diagnósticas da próxima fase.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenCreateStudent}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600 transition-colors focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Aluno</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('import')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-xs transition-colors focus:ring-2 focus:ring-white"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar CSV</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Escolas */}
        <div 
          onClick={() => onNavigate('schools')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Escolas Cadastradas
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:scale-110 transition-transform">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalSchools}</span>
            <span className="text-xs font-medium text-slate-500">unidades ativas</span>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Gerenciar escolas</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Total Turmas */}
        <div 
          onClick={() => onNavigate('classes')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Turmas Registradas
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalClasses}</span>
            <span className="text-xs font-medium text-slate-500">séries organizadas</span>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
            <span>Ver turmas</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Total Alunos */}
        <div 
          onClick={() => onNavigate('students')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Estudantes Aptos
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalStudents}</span>
            <span className="text-xs font-medium text-slate-500">alunos matriculados</span>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>Listar alunos</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Avaliações Realizadas */}
        <div 
          onClick={() => onNavigate('assessments')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gravações & Diagnósticos
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 group-hover:scale-110 transition-transform">
              <Mic className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalAssessments}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {evaluatedAssessments.length} avaliadas
            </span>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-purple-700 group-hover:translate-x-1 transition-transform">
            <span>Avaliar leituras & escutar áudio</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Resumo das Turmas + Gráficos Preparados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Cols: Resumo das Turmas */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Resumo das Turmas
              </h3>
              <p className="text-xs text-slate-500">
                Distribuição de estudantes por sala e turno de ensino
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCreateClass}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-xl transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Turma</span>
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {classStudentCounts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Nenhuma turma cadastrada no momento.
              </div>
            ) : (
              classStudentCounts.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {item.ano_serie.split(' ')[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {item.nome}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {item.schoolName} • {item.turno} • {item.ano_letivo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-800">
                        {item.studentCount}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">alunos</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('students')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition-colors"
                      title="Ver alunos desta turma"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {classStudentCounts.length > 6 && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => onNavigate('classes')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Ver todas as {classStudentCounts.length} turmas cadastradas →
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Métricas e Diagnósticos de Fluência */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Métricas de Fluência
                </h3>
                <p className="text-xs text-slate-500">
                  Diagnóstico leitor em tempo real (Itaúba - MT)
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Ativo
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {/* Metric box 1: PCPM */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    PCPM Médio da Rede
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {evaluatedAssessments.length > 0 ? `${avgPCPM} palavras/min` : 'Aguardando correções'}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, (avgPCPM / 120) * 100))}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Palavras corretas por minuto calculadas sobre o tempo real avaliado.
                </p>
              </div>

              {/* Metric box 2: Precisão */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Taxa Média de Precisão
                  </span>
                  <span className="text-xs font-extrabold text-blue-700">
                    {evaluatedAssessments.length > 0 ? `${avgPrecisao}%` : 'Sem avaliações'}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, avgPrecisao))}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Percentual de acertos sem substituição, omissão ou erro fonológico.
                </p>
              </div>

              {/* Metric box 3: Níveis de Leitor */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    Classificação Pedagógica
                  </span>
                  <span className="text-[11px] text-purple-700 font-medium">Protocolo Local</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-semibold">
                  <div className="py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">Pré-leitor</div>
                  <div className="py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">Iniciante</div>
                  <div className="py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Fluente</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <span>Ver Relatórios e Diagnósticos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Exportação em PDF oficial (Itaúba - MT) e planilhas CSV.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
