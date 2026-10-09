import React, { useState } from 'react';
import { 
  Mic, 
  Plus, 
  Search, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Eye, 
  Clock, 
  Calendar, 
  FileText, 
  User, 
  GraduationCap, 
  Filter, 
  RotateCcw,
  Volume2,
  FileDown,
  CheckCircle2,
  Info,
  Edit2,
  Sparkles
} from 'lucide-react';
import { Assessment, Student, ClassRoom, ReadingMaterial, School } from '../../types/database';
import { formatDateTimeCuiaba, formatRecordingDuration, audioStorageService } from '../../services/audioStorageService';
import { pdfExportService } from '../../services/pdfExportService';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../../contexts/ToastContext';

interface AssessmentsPageProps {
  assessments: Assessment[];
  students: Student[];
  classes: ClassRoom[];
  schools: School[];
  materials: ReadingMaterial[];
  onOpenNewAssessment: () => void;
  onDeleteAssessment: (id: string) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onOpenCorrection?: (assessment: Assessment) => void;
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({
  assessments,
  students,
  classes,
  schools,
  materials,
  onOpenNewAssessment,
  onDeleteAssessment,
  onUpdateNotes,
  onOpenCorrection,
}) => {
  const { addToast } = useToast();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedMaterialTypeFilter, setSelectedMaterialTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Modals
  const [viewingAssessment, setViewingAssessment] = useState<Assessment | null>(null);
  const [editingNotesAssessment, setEditingNotesAssessment] = useState<Assessment | null>(null);
  const [editNotesValue, setEditNotesValue] = useState<string>('');
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtragem dos registros
  const filteredAssessments = assessments.filter((a) => {
    const student = students.find((s) => s.id === a.aluno_id || s.id === a.student_id);
    const studentName = student?.nome || '';
    const studentMatricula = student?.matricula || '';

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      studentName.toLowerCase().includes(term) ||
      studentMatricula.toLowerCase().includes(term) ||
      a.material_titulo.toLowerCase().includes(term);

    const matchesClass = selectedClassFilter === 'all' || a.turma_id === selectedClassFilter;
    const matchesType = selectedMaterialTypeFilter === 'all' || a.material_tipo === selectedMaterialTypeFilter;
    const matchesStudent = selectedStudentFilter === 'all' || a.aluno_id === selectedStudentFilter || a.student_id === selectedStudentFilter;

    const evalStatus = a.avaliacao_detalhes?.estado_correcao || 'nao_avaliada';
    const matchesStatus = selectedStatusFilter === 'all' || evalStatus === selectedStatusFilter;

    let matchesDate = true;
    if (startDateFilter) {
      matchesDate = matchesDate && new Date(a.created_at).getTime() >= new Date(startDateFilter).getTime();
    }
    if (endDateFilter) {
      matchesDate = matchesDate && new Date(a.created_at).getTime() <= (new Date(endDateFilter).getTime() + 86400000);
    }

    return matchesSearch && matchesClass && matchesType && matchesStudent && matchesStatus && matchesDate;
  });

  // Estatísticas do topo
  const uniqueStudentsEvaluated = new Set(assessments.map((a) => a.aluno_id || a.student_id)).size;
  const totalDurationSeconds = assessments.reduce((acc, a) => acc + (a.duracao_segundos || 0), 0);

  const handleDownloadAudio = async (assessment: Assessment) => {
    const student = students.find((s) => s.id === assessment.aluno_id || s.id === assessment.student_id);
    const extension = assessment.audio_mime_type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `leitura_${student?.matricula || 'aluno'}_${assessment.id.slice(0, 8)}.${extension}`;
    
    const ok = await audioStorageService.downloadAudioFile(assessment.id, filename);
    if (ok) {
      addToast('Download iniciado', 'Arquivo de áudio baixado com sucesso.', 'info');
    } else {
      addToast('Erro no download', 'Não foi possível baixar o áudio local.', 'error');
    }
  };

  const handleSaveNotes = async () => {
    if (!editingNotesAssessment) return;
    setIsSubmitting(true);
    try {
      await onUpdateNotes(editingNotesAssessment.id, editNotesValue);
      addToast('Observações atualizadas', 'As notas do professor foram salvas.', 'success');
      setEditingNotesAssessment(null);
    } catch {
      addToast('Erro ao atualizar', 'Não foi possível salvar as observações.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAssessmentId) return;
    setIsSubmitting(true);
    try {
      await onDeleteAssessment(deletingAssessmentId);
      addToast('Avaliação excluída', 'O registro e a gravação de áudio foram removidos.', 'success');
      setDeletingAssessmentId(null);
    } catch {
      addToast('Erro ao excluir', 'Não foi possível remover a avaliação.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Avaliações de Fluência Leitora
          </h2>
          <p className="text-sm text-slate-500">
            Fase 2: Gravação, escuta e armazenamento da leitura dos alunos
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewAssessment}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition-all focus:ring-4 focus:ring-emerald-500/20 shrink-0"
        >
          <Mic className="w-5 h-5 animate-pulse" />
          <span>Nova Avaliação de Leitura</span>
        </button>
      </div>

      {/* Cards de Métricas da Fase 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total de Gravações</span>
            <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{assessments.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Áudios arquivados</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Alunos Avaliados</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{uniqueStudentsEvaluated}</p>
          <p className="text-[11px] text-slate-400 mt-1">De {students.length} matriculados</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tempo Total Gravado</span>
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatRecordingDuration(totalDurationSeconds)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Duração real acumulada</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Armazenamento</span>
            <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900">100% Salvo</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Nuvem & Cache Local</p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Busca por aluno ou material */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome do aluno, matrícula ou material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filtro por Turma */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Todas as Turmas ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.ano_serie})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo de Material */}
          <div>
            <select
              value={selectedMaterialTypeFilter}
              onChange={(e) => setSelectedMaterialTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Todos os Materiais</option>
              <option value="palavras">Lista de Palavras</option>
              <option value="pseudopalavras">Pseudopalavras</option>
              <option value="texto_curto">Texto Curto</option>
            </select>
          </div>

          {/* Filtro por Status da Avaliação */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Status: Todos</option>
              <option value="nao_avaliada">Não Avaliadas</option>
              <option value="em_correcao">Em Correção (Rascunho)</option>
              <option value="revisada">Revisadas pelo Professor</option>
            </select>
          </div>
        </div>

        {/* Filtro de Período de Datas */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Filtrar por Período:
            </span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
            />
            <span>até</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
            />
            {(startDateFilter || endDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="text-blue-600 hover:underline font-semibold ml-1"
              >
                Limpar datas
              </button>
            )}
          </div>

          <span className="text-slate-400">
            {filteredAssessments.length} de {assessments.length} avaliação(ões)
          </span>
        </div>
      </div>

      {/* Lista de Avaliações */}
      {filteredAssessments.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação encontrada"
          description={assessments.length === 0 ? "Ainda não foram gravadas leituras. Clique no botão acima para iniciar a primeira avaliação de um aluno." : "Nenhum registro coincide com os filtros selecionados."}
          icon={Mic}
          actionLabel="Realizar Nova Avaliação"
          onAction={onOpenNewAssessment}
        />
      ) : (
        <div className="space-y-3">
          {filteredAssessments.map((a) => {
            const student = students.find((s) => s.id === a.aluno_id || s.id === a.student_id);
            const turma = classes.find((c) => c.id === a.turma_id);
            const typeLabel = a.material_tipo === 'palavras' ? 'Palavras' : a.material_tipo === 'pseudopalavras' ? 'Pseudopalavras' : 'Texto Curto';
            const typeColor = a.material_tipo === 'palavras' ? 'bg-blue-50 text-blue-800 border-blue-200' : a.material_tipo === 'pseudopalavras' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';

            return (
              <div
                key={a.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Dados do Aluno & Material */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 truncate">
                      {student?.nome || 'Aluno não localizado'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Matrícula: {student?.matricula || '---'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColor}`}>
                      {typeLabel}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {a.modalidade === '60_segundos' ? '60 Segundos' : 'Livre'}
                    </span>

                    {/* Badge de Correção / Avaliação da Leitura */}
                    {a.avaliacao_detalhes?.estado_correcao === 'revisada' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Revisada pelo professor</span>
                      </span>
                    ) : a.avaliacao_detalhes?.estado_correcao === 'em_correcao' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Em correção (Rascunho)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>Não avaliada</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      {turma?.nome || 'Turma'} ({turma?.ano_serie})
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {a.material_titulo}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Duração da gravação: <strong className="text-slate-800 font-mono">{formatRecordingDuration(a.duracao_segundos)}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTimeCuiaba(a.created_at)}
                    </span>
                  </div>

                  {/* Indicadores pedagógicos caso a avaliação já tenha sido revisada */}
                  {a.avaliacao_detalhes?.estado_correcao === 'revisada' && a.avaliacao_detalhes?.calculos && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        PCPM: <strong className="font-mono">{a.avaliacao_detalhes.calculos.pcpm}</strong>
                      </span>
                      <span className="font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Precisão: <strong className="font-mono">{a.avaliacao_detalhes.calculos.precisaoPercentual}%</strong>
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        ({a.avaliacao_detalhes.calculos.totalCorretas} corretas de {a.avaliacao_detalhes.calculos.totalPalavrasTrecho} no trecho avaliado)
                      </span>
                    </div>
                  )}

                  {a.observacoes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                      "{a.observacoes}"
                    </p>
                  )}
                </div>

                {/* Player e Ações */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  {/* Player de áudio nativo */}
                  {a.audio_url && (
                    <div className="w-full sm:w-64">
                      <audio
                        controls
                        src={a.audio_url}
                        className="w-full h-10 rounded-lg"
                        preload="none"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5">
                    {/* Botão Avaliar Leitura */}
                    <button
                      type="button"
                      onClick={() => onOpenCorrection?.(a)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs shadow-xs transition-all ${
                        a.avaliacao_detalhes?.estado_correcao === 'revisada'
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          : a.avaliacao_detalhes?.estado_correcao === 'em_correcao'
                          ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/20'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                      }`}
                      title={
                        a.avaliacao_detalhes?.estado_correcao === 'revisada'
                          ? 'Ver e revisar marcações da leitura'
                          : a.avaliacao_detalhes?.estado_correcao === 'em_correcao'
                          ? 'Continuar correção em andamento'
                          : 'Avaliar leitura do aluno'
                      }
                    >
                      {a.avaliacao_detalhes?.estado_correcao === 'revisada' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Revisar Leitura</span>
                        </>
                      ) : a.avaliacao_detalhes?.estado_correcao === 'em_correcao' ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Continuar Avaliação</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Avaliar Leitura</span>
                        </>
                      )}
                    </button>

                    {/* Exportar PDF Individual quando revisada */}
                    {a.avaliacao_detalhes?.estado_correcao === 'revisada' && (
                      <button
                        type="button"
                        onClick={() => {
                          const school = schools.find((s) => s.id === a.escola_id);
                          pdfExportService.exportIndividualAssessmentPDF(
                            a,
                            student,
                            turma,
                            school,
                            a.avaliacao_detalhes!
                          );
                          addToast(
                            'Relatório PDF Gerado',
                            `Relatório individual de ${student?.nome || 'aluno'} gerado com sucesso.`,
                            'success'
                          );
                        }}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Exportar Relatório Individual (PDF)"
                      >
                        <FileDown className="w-4 h-4 text-indigo-600" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setViewingAssessment(a)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Ver detalhes e texto congelado"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotesAssessment(a);
                        setEditNotesValue(a.observacoes || '');
                      }}
                      className="p-2 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Editar observações pedagógicas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadAudio(a)}
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Baixar arquivo de áudio"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingAssessmentId(a.id)}
                      className="p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Excluir gravação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Detalhes da Avaliação & Conteúdo Congelado */}
      <Modal
        isOpen={viewingAssessment !== null}
        onClose={() => setViewingAssessment(null)}
        title="Detalhes da Avaliação de Leitura"
        description="Ficha individual com áudio, snapshot do material e dados temporais em America/Cuiaba."
      >
        {viewingAssessment && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 block mb-0.5">Aluno(a):</span>
                <strong className="text-slate-900 text-sm">
                  {students.find((s) => s.id === viewingAssessment.aluno_id || s.id === viewingAssessment.student_id)?.nome}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Turma:</span>
                <strong className="text-slate-900 text-sm">
                  {classes.find((c) => c.id === viewingAssessment.turma_id)?.nome}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Data e Hora (Itaúba - MT):</span>
                <strong className="text-slate-900">
                  {formatDateTimeCuiaba(viewingAssessment.created_at)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Duração da Gravação:</span>
                <strong className="text-slate-900 font-mono">
                  {formatRecordingDuration(viewingAssessment.duracao_segundos)}
                </strong>
              </div>
            </div>

            {/* Reprodutor de Áudio */}
            {viewingAssessment.audio_url && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <span className="text-xs text-slate-300">Reproduzir Gravação Original:</span>
                <audio
                  controls
                  src={viewingAssessment.audio_url}
                  className="w-full rounded-lg"
                  preload="auto"
                />
              </div>
            )}

            {/* Snapshot do Material Utilizado */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">
                  Material Utilizado: {viewingAssessment.material_titulo}
                </span>
                <span className="text-[10px] text-slate-400 italic">
                  (Cópia congelada no momento da avaliação)
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 font-serif text-slate-800 leading-relaxed text-xs sm:text-sm max-h-48 overflow-y-auto">
                {viewingAssessment.material_conteudo_snapshot}
              </div>
            </div>

            {/* Observações */}
            {viewingAssessment.observacoes && (
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Observações do Professor:
                </span>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  {viewingAssessment.observacoes}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDownloadAudio(viewingAssessment)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Baixar Áudio</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingAssessment(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Editar Observações */}
      <Modal
        isOpen={editingNotesAssessment !== null}
        onClose={() => setEditingNotesAssessment(null)}
        title="Editar Observações da Avaliação"
        description="Atualize as anotações pedagógicas sobre a leitura deste aluno."
      >
        <div className="space-y-4">
          <textarea
            rows={4}
            value={editNotesValue}
            onChange={(e) => setEditNotesValue(e.target.value)}
            placeholder="Digite as observações pedagógicas..."
            className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditingNotesAssessment(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Observações'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Exclusão */}
      <ConfirmModal
        isOpen={deletingAssessmentId !== null}
        onClose={() => setDeletingAssessmentId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Gravação de Leitura"
        message="Deseja realmente excluir este registro? O arquivo de áudio e todos os dados associados serão excluídos permanentemente."
        confirmText="Sim, Excluir Gravação"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
