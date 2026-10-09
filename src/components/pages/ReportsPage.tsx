import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Calendar, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  FileDown, 
  Info, 
  Search,
  PieChart,
  TrendingUp,
  Percent,
  Eye,
  Edit3
} from 'lucide-react';
import { Assessment, Student, ClassRoom, School, ReadingMaterial } from '../../types/database';
import { formatDateTimeCuiaba, formatRecordingDuration } from '../../services/audioStorageService';
import { pdfExportService } from '../../services/pdfExportService';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../../contexts/ToastContext';

interface ReportsPageProps {
  assessments: Assessment[];
  students: Student[];
  classes: ClassRoom[];
  schools: School[];
  materials: ReadingMaterial[];
  onOpenCorrection: (assessment: Assessment) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  assessments,
  students,
  classes,
  schools,
  materials,
  onOpenCorrection,
}) => {
  const { addToast } = useToast();

  // Filters
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('all');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Turmas filtradas pela escola
  const availableClasses = useMemo(() => {
    if (selectedSchool === 'all') return classes;
    return classes.filter((c) => c.escola_id === selectedSchool);
  }, [classes, selectedSchool]);

  // Avaliações Filtradas
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      const student = students.find((s) => s.id === a.aluno_id || s.id === a.student_id);
      const studentName = student?.nome || '';
      const studentMatricula = student?.matricula || '';

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !term ||
        studentName.toLowerCase().includes(term) ||
        studentMatricula.toLowerCase().includes(term) ||
        a.material_titulo.toLowerCase().includes(term);

      const matchesSchool = selectedSchool === 'all' || a.escola_id === selectedSchool;
      const matchesClass = selectedClass === 'all' || a.turma_id === selectedClass;
      const matchesType = selectedMaterialType === 'all' || a.material_tipo === selectedMaterialType;
      const matchesMaterial = selectedMaterialId === 'all' || a.material_id === selectedMaterialId;
      const matchesMode = selectedMode === 'all' || a.modalidade === selectedMode;

      const evalStatus = a.avaliacao_detalhes?.estado_correcao || 'nao_avaliada';
      const matchesStatus = selectedStatus === 'all' || evalStatus === selectedStatus;

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(a.created_at).getTime() >= new Date(startDate).getTime();
      }
      if (endDate) {
        matchesDate = matchesDate && new Date(a.created_at).getTime() <= (new Date(endDate).getTime() + 86400000);
      }

      return matchesSearch && matchesSchool && matchesClass && matchesType && matchesMaterial && matchesMode && matchesStatus && matchesDate;
    });
  }, [
    assessments,
    students,
    searchTerm,
    selectedSchool,
    selectedClass,
    selectedMaterialType,
    selectedMaterialId,
    selectedMode,
    selectedStatus,
    startDate,
    endDate,
  ]);

  // Avaliações revisadas dentro do filtro
  const reviewedAssessments = useMemo(() => {
    return filteredAssessments.filter((a) => a.avaliacao_detalhes?.estado_correcao === 'revisada');
  }, [filteredAssessments]);

  // Alunos vinculados à turma selecionada
  const classStudents = useMemo(() => {
    if (selectedClass === 'all') {
      if (selectedSchool === 'all') return students;
      return students.filter((s) => s.escola_id === selectedSchool);
    }
    return students.filter((s) => s.turma_id === selectedClass);
  }, [students, selectedClass, selectedSchool]);

  // Indicadores Agregados de Turma (Apenas para avaliações comparáveis do mesmo material e modalidade)
  const isComparableGroup = useMemo(() => {
    if (reviewedAssessments.length === 0) return false;
    const firstMat = reviewedAssessments[0].material_id;
    const firstMode = reviewedAssessments[0].modalidade;
    return reviewedAssessments.every((a) => a.material_id === firstMat && a.modalidade === firstMode);
  }, [reviewedAssessments]);

  const aggregateStats = useMemo(() => {
    if (reviewedAssessments.length === 0) {
      return { pcmMedia: 0, pcmMediana: 0, precisaoMedia: 0, count: 0 };
    }

    const pcpms = reviewedAssessments
      .map((a) => a.avaliacao_detalhes?.pcpm || 0)
      .sort((a, b) => a - b);
    const precisoes = reviewedAssessments.map((a) => a.avaliacao_detalhes?.precisao_percentual || 0);

    const sumPcpm = pcpms.reduce((acc, v) => acc + v, 0);
    const sumPrec = precisoes.reduce((acc, v) => acc + v, 0);

    const pcmMedia = Math.round((sumPcpm / pcpms.length) * 10) / 10;
    const precisaoMedia = Math.round((sumPrec / precisoes.length) * 10) / 10;

    // Mediana
    const mid = Math.floor(pcpms.length / 2);
    const pcmMediana =
      pcpms.length % 2 !== 0
        ? pcpms[mid]
        : Math.round(((pcpms[mid - 1] + pcpms[mid]) / 2) * 10) / 10;

    return {
      pcmMedia,
      pcmMediana,
      precisaoMedia,
      count: reviewedAssessments.length,
    };
  }, [reviewedAssessments]);

  // Distribuição de Tipos de Erros na Turma
  const errorDistribution = useMemo(() => {
    let sub = 0;
    let omis = 0;
    let incorr = 0;

    reviewedAssessments.forEach((a) => {
      const d = a.avaliacao_detalhes;
      if (d) {
        sub += d.total_substituicoes || 0;
        omis += d.total_omissoes || 0;
        incorr += d.total_incorretas || 0;
      }
    });

    const total = sub + omis + incorr;
    return {
      sub,
      omis,
      incorr,
      total,
      subPct: total > 0 ? Math.round((sub / total) * 100) : 0,
      omisPct: total > 0 ? Math.round((omis / total) * 100) : 0,
      incorrPct: total > 0 ? Math.round((incorr / total) * 100) : 0,
    };
  }, [reviewedAssessments]);

  // Exportações
  const handleExportCSV = () => {
    if (filteredAssessments.length === 0) {
      addToast('Sem dados', 'Não há avaliações para exportar com os filtros atuais.', 'warning');
      return;
    }
    pdfExportService.exportClassAssessmentsCSV(
      filteredAssessments,
      students,
      classes,
      schools
    );
    addToast('CSV Gerado!', 'Arquivo baixado compatível com Excel e sanitizado.', 'success');
  };

  const handleExportClassPDF = () => {
    if (filteredAssessments.length === 0) {
      addToast('Sem dados', 'Não há avaliações para exportar no relatório.', 'warning');
      return;
    }
    const currentCls = classes.find((c) => c.id === selectedClass);
    const currentSch = schools.find((s) => s.id === (currentCls?.escola_id || selectedSchool));

    const filterDesc = `Filtros: ${selectedMaterialType !== 'all' ? selectedMaterialType : 'Todos os materiais'} • ${selectedMode !== 'all' ? selectedMode : 'Todas as modalidades'}`;

    pdfExportService.exportClassAssessmentsPDF(
      filteredAssessments,
      students,
      currentCls,
      currentSch,
      filterDesc
    );
    addToast('PDF Gerado!', 'Relatório da turma gerado com sucesso.', 'success');
  };

  const handleExportIndividualPDF = (assessment: Assessment) => {
    const student = students.find((s) => s.id === assessment.aluno_id || s.id === assessment.student_id);
    const classRoom = classes.find((c) => c.id === assessment.turma_id);
    const school = schools.find((s) => s.id === assessment.escola_id);

    if (!assessment.avaliacao_detalhes) {
      addToast('Pendente', 'Esta avaliação ainda não possui correção registrada.', 'warning');
      return;
    }

    pdfExportService.exportIndividualAssessmentPDF(
      assessment,
      student,
      classRoom,
      school,
      assessment.avaliacao_detalhes
    );
    addToast('Relatório Individual Gerado!', `PDF do aluno ${student?.nome} baixado.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Painel e Relatórios de Fluência Leitora
          </h2>
          <p className="text-sm text-slate-500">
            Fase 3: Indicadores pedagógicos consolidados por turma e relatórios individuais
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs shadow-xs hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            title="Exportar dados filtrados em CSV compatível com Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV (Excel)</span>
          </button>

          <button
            type="button"
            onClick={handleExportClassPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500"
            title="Exportar relatório formatado da turma em PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar Relatório PDF</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros Multifatoriais */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Busca por Aluno ou Material */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por aluno, matrícula ou título do material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filtro por Escola */}
          <div>
            <select
              value={selectedSchool}
              onChange={(e) => {
                setSelectedSchool(e.target.value);
                setSelectedClass('all');
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Todas as Escolas ({schools.length})</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Turma */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Todas as Turmas ({availableClasses.length})</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.nome} ({c.ano_serie})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 2 de Filtros Pedagógicos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Tipo de Material */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tipo de Material:</label>
            <select
              value={selectedMaterialType}
              onChange={(e) => {
                setSelectedMaterialType(e.target.value);
                setSelectedMaterialId('all');
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="all">Todos os tipos</option>
              <option value="palavras">Lista de Palavras</option>
              <option value="pseudopalavras">Pseudopalavras</option>
              <option value="texto_curto">Texto Curto</option>
            </select>
          </div>

          {/* Modalidade */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Modalidade:</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="all">Todas as modalidades</option>
              <option value="60_segundos">60 Segundos</option>
              <option value="livre">Leitura Livre</option>
            </select>
          </div>

          {/* Estado da Correção */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Situação da Correção:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="all">Todas as situações</option>
              <option value="revisada">Revisada pelo Professor</option>
              <option value="em_correcao">Em Correção (Rascunho)</option>
              <option value="nao_avaliada">Aguardando Correção</option>
            </select>
          </div>

          {/* Intervalo de Datas */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Período:</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 text-[11px] bg-white"
              />
              <span className="text-slate-400">à</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 text-[11px] bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Cards de Panorama Geral da Turma */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Alunos na Turma</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{classStudents.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Estudantes matriculados</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Com Gravação</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {new Set(filteredAssessments.map((a) => a.aluno_id || a.student_id)).size}
          </p>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">
            {filteredAssessments.length} gravação(ões) total
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Avaliações Revisadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{reviewedAssessments.length}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Com indicadores calculados</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Aguardando Correção</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-700">
            {filteredAssessments.length - reviewedAssessments.length}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Pendentes de análise</p>
        </div>
      </div>

      {/* Bloco de Métricas Agregadas da Turma (Média e Mediana) */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-800/80 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Consolidado Pedagógico da Turma (Sem Ranking)</h3>
          </div>
          <span className="text-xs text-blue-200">
            {isComparableGroup
              ? `Base comparável: ${aggregateStats.count} avaliação(ões) com o mesmo material e modalidade`
              : 'Grupo heterogêneo: Filtre um material específico para agregar média e mediana rigorosas'}
          </span>
        </div>

        {isComparableGroup ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <span className="text-xs text-blue-200 font-medium block">Média de PCPM da Turma:</span>
              <p className="text-3xl font-extrabold font-mono text-white mt-1">
                {aggregateStats.pcmMedia}
              </p>
              <p className="text-[11px] text-blue-300 mt-1">Palavras Corretas / Minuto</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <span className="text-xs text-blue-200 font-medium block">Mediana de PCPM da Turma:</span>
              <p className="text-3xl font-extrabold font-mono text-white mt-1">
                {aggregateStats.pcmMediana}
              </p>
              <p className="text-[11px] text-blue-300 mt-1">Valor central da turma</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <span className="text-xs text-blue-200 font-medium block">Índice Médio de Precisão:</span>
              <p className="text-3xl font-extrabold font-mono text-white mt-1">
                {aggregateStats.precisaoMedia}%
              </p>
              <p className="text-[11px] text-blue-300 mt-1">Taxa média de acertos no trecho</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-xs text-blue-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Para preservar o rigor científico e pedagógico, a média e mediana de PCPM só são calculadas quando as avaliações compartilham o <strong>mesmo material e modalidade</strong>. Selecione um material específico nos filtros acima para visualizar os indicadores consolidados da turma.
            </p>
          </div>
        )}
      </div>

      {/* Gráficos / Distribuição de Erros na Turma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribuição por Tipo de Erro */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-sm text-slate-900">Distribuição dos Erros Observados</h4>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {errorDistribution.total} erros no total
            </span>
          </div>

          {errorDistribution.total === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Nenhum erro registrado nas avaliações revisadas deste filtro.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Substituições de palavras:</span>
                  <span className="font-mono">{errorDistribution.sub} ({errorDistribution.subPct}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${errorDistribution.subPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Omissões de palavras:</span>
                  <span className="font-mono">{errorDistribution.omis} ({errorDistribution.omisPct}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${errorDistribution.omisPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Pronúncia incorreta / Hesitações:</span>
                  <span className="font-mono">{errorDistribution.incorr} ({errorDistribution.incorrPct}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${errorDistribution.incorrPct}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Situação dos Alunos da Turma */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-sm text-slate-900">Cobertura da Avaliação na Turma</h4>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {classStudents.length} alunos
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-700 font-semibold mb-1">
                <span className="text-emerald-700">Com avaliação revisada:</span>
                <span className="font-mono font-bold">{reviewedAssessments.length}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${classStudents.length > 0 ? (reviewedAssessments.length / classStudents.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-semibold mb-1">
                <span className="text-amber-700">Gravados aguardando correção:</span>
                <span className="font-mono font-bold">{filteredAssessments.length - reviewedAssessments.length}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${classStudents.length > 0 ? ((filteredAssessments.length - reviewedAssessments.length) / classStudents.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-semibold mb-1">
                <span className="text-slate-500">Sem gravação registrada:</span>
                <span className="font-mono font-bold">
                  {Math.max(0, classStudents.length - new Set(filteredAssessments.map((a) => a.aluno_id || a.student_id)).size)}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full"
                  style={{
                    width: `${
                      classStudents.length > 0
                        ? (Math.max(0, classStudents.length - new Set(filteredAssessments.map((a) => a.aluno_id || a.student_id)).size) / classStudents.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Resultados Individuais dos Estudantes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-base text-slate-900">
            Resultados das Avaliações ({filteredAssessments.length})
          </h4>
          <span className="text-xs text-slate-400">
            Clique em "Corrigir / Avaliar" para revisar as marcações de qualquer gravação
          </span>
        </div>

        {filteredAssessments.length === 0 ? (
          <EmptyState
            title="Nenhuma avaliação encontrada"
            description="Ajuste os filtros selecionados ou grave novas leituras na aba Avaliações."
            icon={BarChart3}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 uppercase font-bold text-slate-500">
                    <th className="py-3.5 pl-6 pr-3">Aluno</th>
                    <th className="py-3.5 px-3">Turma</th>
                    <th className="py-3.5 px-3">Material</th>
                    <th className="py-3.5 px-3">Data</th>
                    <th className="py-3.5 px-3 text-center">Tempo Aval.</th>
                    <th className="py-3.5 px-3 text-center">PCPM</th>
                    <th className="py-3.5 px-3 text-center">Precisão</th>
                    <th className="py-3.5 px-3 text-center">Situação</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssessments.map((a) => {
                    const student = students.find((s) => s.id === a.aluno_id || s.id === a.student_id);
                    const cls = classes.find((c) => c.id === a.turma_id);
                    const d = a.avaliacao_detalhes;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-6 pr-3">
                          <p className="font-bold text-slate-900">{student?.nome || 'Aluno'}</p>
                          <span className="text-[10px] text-slate-400 font-mono">Mat: {student?.matricula || '-'}</span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-600">
                          {cls?.nome || '-'}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600 max-w-[160px] truncate" title={a.material_titulo}>
                          {a.material_titulo}
                        </td>

                        <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                          {formatDateTimeCuiaba(a.created_at).slice(0, 10)}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-slate-700">
                          {d ? `${d.tempo_avaliado_segundos.toFixed(1)}s` : `${a.duracao_segundos.toFixed(1)}s (tot)`}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {d ? (
                            <span className="font-extrabold font-mono text-slate-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {d.pcpm}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Pendente</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {d ? (
                            <span className="font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              {d.precisao_percentual}%
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Pendente</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {d?.estado_correcao === 'revisada' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Revisada
                            </span>
                          ) : d?.estado_correcao === 'em_correcao' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              Rascunho
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                              Aguardando
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenCorrection(a)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors"
                              title="Avaliar leitura ou editar marcações"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{d?.estado_correcao === 'revisada' ? 'Rever' : 'Avaliar'}</span>
                            </button>

                            {d && (
                              <button
                                type="button"
                                onClick={() => handleExportIndividualPDF(a)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Exportar Relatório Individual em PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
