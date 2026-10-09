import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  GraduationCap, 
  Building2, 
  Calendar, 
  Hash, 
  ArrowUpDown, 
  X,
  Filter,
  FileDown,
  Mic
} from 'lucide-react';
import { Student, School, ClassRoom, Assessment } from '../../types/database';
import { CreateStudentDTO } from '../../services/studentService';
import { pdfExportService } from '../../services/pdfExportService';
import { formatDateTimeCuiaba, formatRecordingDuration, audioStorageService } from '../../services/audioStorageService';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../../contexts/ToastContext';

interface StudentsPageProps {
  students: Student[];
  schools: School[];
  classes: ClassRoom[];
  assessments?: Assessment[];
  onCreateStudent: (payload: CreateStudentDTO) => Promise<void>;
  onUpdateStudent: (id: string, payload: Partial<CreateStudentDTO>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
  onNavigateToImport: () => void;
  onOpenNewAssessmentForStudent?: (studentId: string, classId: string) => void;
  onDeleteAssessment?: (id: string) => Promise<void>;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({
  students,
  schools,
  classes,
  assessments = [],
  onCreateStudent,
  onUpdateStudent,
  onDeleteStudent,
  isCreateModalOpen,
  setIsCreateModalOpen,
  onNavigateToImport,
  onOpenNewAssessmentForStudent,
  onDeleteAssessment,
}) => {
  const { addToast } = useToast();
  const [viewingHistoryStudent, setViewingHistoryStudent] = useState<Student | null>(null);
  const [deletingHistoryAssessmentId, setDeletingHistoryAssessmentId] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateStudentDTO>({
    nome: '',
    matricula: '',
    data_nascimento: '2018-05-10',
    escola_id: schools[0]?.id || '',
    turma_id: classes[0]?.id || '',
  });

  // Filtered classes available for selected school in modal
  const availableClassesForSelectedSchool = classes.filter(
    (c) => c.escola_id === formData.escola_id
  );

  // Filtered classes for the main page filter dropdown
  const filterClassesDropdown = selectedSchool === 'all'
    ? classes
    : classes.filter((c) => c.escola_id === selectedSchool);

  // Filter & Sort Students
  const filteredStudents = students
    .filter((student) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        student.nome.toLowerCase().includes(term) ||
        student.matricula.toLowerCase().includes(term);

      const matchesSchool =
        selectedSchool === 'all' || student.escola_id === selectedSchool;

      const matchesClass =
        selectedClass === 'all' || student.turma_id === selectedClass;

      return matchesSearch && matchesSchool && matchesClass;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.nome.localeCompare(b.nome);
      } else {
        return b.nome.localeCompare(a.nome);
      }
    });

  const handleOpenCreate = () => {
    if (schools.length === 0) {
      addToast('Atenção', 'Cadastre ao menos uma escola antes de cadastrar alunos.', 'warning');
      return;
    }
    if (classes.length === 0) {
      addToast('Atenção', 'Cadastre ao menos uma turma antes de cadastrar alunos.', 'warning');
      return;
    }

    const defaultSchool = schools[0]?.id || '';
    const schoolClasses = classes.filter((c) => c.escola_id === defaultSchool);
    const defaultClass = schoolClasses[0]?.id || classes[0]?.id || '';

    setFormData({
      nome: '',
      matricula: `2026-${Math.floor(100 + Math.random() * 900)}`,
      data_nascimento: '2018-05-15',
      escola_id: defaultSchool,
      turma_id: defaultClass,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nome: student.nome,
      matricula: student.matricula,
      data_nascimento: student.data_nascimento,
      escola_id: student.escola_id,
      turma_id: student.turma_id,
    });
  };

  const handleSchoolChangeInForm = (schoolId: string) => {
    const validClasses = classes.filter((c) => c.escola_id === schoolId);
    setFormData({
      ...formData,
      escola_id: schoolId,
      turma_id: validClasses[0]?.id || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      addToast('Campo obrigatório', 'Informe o nome completo do aluno.', 'warning');
      return;
    }
    if (!formData.matricula.trim()) {
      addToast('Campo obrigatório', 'Informe a matrícula ou código do aluno.', 'warning');
      return;
    }
    if (!formData.turma_id) {
      addToast('Campo obrigatório', 'Selecione a turma do aluno.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        await onUpdateStudent(editingStudent.id, formData);
        setEditingStudent(null);
      } else {
        await onCreateStudent(formData);
        setIsCreateModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudentId) return;
    setIsSubmitting(true);
    try {
      await onDeleteStudent(deletingStudentId);
      setDeletingStudentId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    if (filteredStudents.length === 0) {
      addToast('Nenhum dado', 'Não há alunos listados para exportar com os filtros atuais.', 'warning');
      return;
    }
    const schoolObj = schools.find((s) => s.id === selectedSchool);
    const classObj = classes.find((c) => c.id === selectedClass);

    pdfExportService.exportStudentsPDF(filteredStudents, classes, schools, {
      schoolName: schoolObj?.nome,
      className: classObj?.nome,
      searchTerm: searchTerm || undefined,
    });

    addToast('Relatório gerado!', `${filteredStudents.length} aluno(s) exportado(s) em PDF formatado.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Cadastro e Gestão de Alunos
          </h2>
          <p className="text-sm text-slate-500">
            {students.length} aluno(s) registrado(s) no sistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm shadow-xs hover:bg-slate-50 hover:text-blue-700 transition-colors focus:ring-2 focus:ring-blue-500"
            title="Exportar alunos exibidos em PDF formatado"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>Exportar Relatório</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToImport}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm shadow-xs hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-500"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importar CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Aluno</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* School filter */}
          <div>
            <select
              value={selectedSchool}
              onChange={(e) => {
                setSelectedSchool(e.target.value);
                setSelectedClass('all'); // Reset class when school changes
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Todas as escolas</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Class filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Todas as turmas</option>
              {filterClassesDropdown.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nome} ({cls.ano_serie})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort & clear toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>Resultados: <strong>{filteredStudents.length}</strong> de {students.length} alunos</span>
            {(searchTerm || selectedSchool !== 'all' || selectedClass !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSchool('all');
                  setSelectedClass('all');
                }}
                className="text-blue-600 font-semibold hover:underline ml-2"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Ordem alfabética:</span>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'asc' ? 'A até Z' : 'Z até A'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Students Table / Cards */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            searchTerm || selectedSchool !== 'all' || selectedClass !== 'all'
              ? 'Nenhum aluno encontrado para os filtros'
              : 'Nenhum aluno cadastrado'
          }
          description={
            searchTerm || selectedSchool !== 'all' || selectedClass !== 'all'
              ? 'Tente ajustar ou limpar seus filtros de pesquisa para visualizar outros alunos.'
              : 'Comece adicionando alunos manualmente ou importe uma planilha CSV com a turma completa.'
          }
          action={{
            label: 'Adicionar Aluno',
            onClick: handleOpenCreate,
            icon: Plus,
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-3">Aluno</th>
                  <th className="py-3.5 px-3">Matrícula</th>
                  <th className="py-3.5 px-3">Nascimento</th>
                  <th className="py-3.5 px-3">Turma / Série</th>
                  <th className="py-3.5 px-3">Escola</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const studentClass = classes.find((c) => c.id === student.turma_id);
                  const studentSchool = schools.find((s) => s.id === student.escola_id);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold text-xs shadow-2xs">
                            {student.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {student.nome}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Matricula */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {student.matricula}
                        </span>
                      </td>

                      {/* Nascimento */}
                      <td className="py-3.5 px-3 text-slate-600 text-xs whitespace-nowrap">
                        {new Date(student.data_nascimento).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Turma */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {studentClass?.nome || 'Sem turma'} ({studentClass?.ano_serie || '-'})
                        </span>
                      </td>

                      {/* Escola */}
                      <td className="py-3.5 px-3 text-slate-600 text-xs">
                        <span className="max-w-[200px] truncate block" title={studentSchool?.nome}>
                          {studentSchool?.nome || 'Escola não vinculada'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingHistoryStudent(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
                            title="Ver histórico de leituras gravadas"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>
                              {assessments.filter((a) => a.aluno_id === student.id || a.student_id === student.id).length}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Editar aluno"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingStudentId(student.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Excluir aluno"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal: Adicionar / Editar Aluno */}
      <Modal
        isOpen={isCreateModalOpen || editingStudent !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? 'Editar Aluno' : 'Adicionar Novo Aluno'}
        subtitle="Informe os dados cadastrais do estudante"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome Completo do Aluno *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Arthur Vinícius Pereira"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Matrícula / Código *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 2026-101"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data de Nascimento *
              </label>
              <input
                type="date"
                required
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Escola *
            </label>
            <select
              required
              value={formData.escola_id}
              onChange={(e) => handleSchoolChangeInForm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Turma *
            </label>
            <select
              required
              value={formData.turma_id}
              onChange={(e) => setFormData({ ...formData, turma_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {availableClassesForSelectedSchool.length === 0 ? (
                <option value="">Nenhuma turma cadastrada nesta escola</option>
              ) : (
                availableClassesForSelectedSchool.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nome} ({cls.ano_serie} • {cls.turno})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingStudent(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : editingStudent ? 'Salvar Alterações' : 'Salvar Aluno'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar Exclusão de Aluno */}
      <ConfirmModal
        isOpen={Boolean(deletingStudentId)}
        onClose={() => setDeletingStudentId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Aluno"
        message="Tem certeza de que deseja remover este aluno? As informações associadas serão excluídas permanentemente."
        confirmLabel="Sim, Excluir Aluno"
        isLoading={isSubmitting}
      />

      {/* Modal: Histórico de Leituras do Aluno */}
      <Modal
        isOpen={viewingHistoryStudent !== null}
        onClose={() => setViewingHistoryStudent(null)}
        title={viewingHistoryStudent ? `Histórico de Leituras — ${viewingHistoryStudent.nome}` : 'Histórico de Leituras'}
        description="Gravações de áudio realizadas, modalidade, duração e observações pedagógicas do aluno."
      >
        {viewingHistoryStudent && (() => {
          const studentAssessments = assessments.filter(
            (a) => a.aluno_id === viewingHistoryStudent.id || a.student_id === viewingHistoryStudent.id
          );
          const studentClass = classes.find((c) => c.id === viewingHistoryStudent.turma_id);

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Turma:</span>
                  <strong className="text-slate-900">{studentClass?.nome || 'Não informada'} ({studentClass?.ano_serie})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Matrícula:</span>
                  <strong className="text-slate-900">{viewingHistoryStudent.matricula}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Gravações:</span>
                  <strong className="text-emerald-700">{studentAssessments.length} realizada(s)</strong>
                </div>
              </div>

              {studentAssessments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <Mic className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">Nenhuma gravação encontrada</h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Este aluno ainda não possui avaliações de leitura gravadas nesta etapa.
                    </p>
                  </div>
                  {onOpenNewAssessmentForStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        const sid = viewingHistoryStudent.id;
                        const cid = viewingHistoryStudent.turma_id;
                        setViewingHistoryStudent(null);
                        onOpenNewAssessmentForStudent(sid, cid);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Gravar Primeira Leitura</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {studentAssessments.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-slate-900">{a.material_titulo}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {a.modalidade === '60_segundos' ? '60 Segundos' : 'Livre'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatDateTimeCuiaba(a.created_at)} • Duração da gravação: <strong className="font-mono text-slate-800">{formatRecordingDuration(a.duracao_segundos)}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              audioStorageService.downloadAudioFile(
                                a.id,
                                `leitura_${viewingHistoryStudent.matricula}_${a.id.slice(0, 8)}.${a.audio_mime_type.includes('mp4') ? 'mp4' : 'webm'}`
                              );
                              addToast('Download iniciado', 'Baixando gravação.', 'info');
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                            title="Baixar áudio"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          {onDeleteAssessment && (
                            <button
                              type="button"
                              onClick={() => setDeletingHistoryAssessmentId(a.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Excluir gravação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reprodutor de áudio */}
                      {a.audio_url && (
                        <audio
                          controls
                          src={a.audio_url}
                          className="w-full h-9 rounded-lg"
                          preload="none"
                        />
                      )}

                      {/* Observações */}
                      {a.observacoes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                          "{a.observacoes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                {onOpenNewAssessmentForStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      const sid = viewingHistoryStudent.id;
                      const cid = viewingHistoryStudent.turma_id;
                      setViewingHistoryStudent(null);
                      onOpenNewAssessmentForStudent(sid, cid);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Nova Leitura para este Aluno</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingHistoryStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 ml-auto"
                >
                  Fechar
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal: Confirmar Exclusão de Gravação do Histórico */}
      <ConfirmModal
        isOpen={Boolean(deletingHistoryAssessmentId)}
        onClose={() => setDeletingHistoryAssessmentId(null)}
        onConfirm={async () => {
          if (!deletingHistoryAssessmentId || !onDeleteAssessment) return;
          setIsSubmitting(true);
          try {
            await onDeleteAssessment(deletingHistoryAssessmentId);
            addToast('Gravação removida', 'A gravação foi excluída com sucesso.', 'success');
            setDeletingHistoryAssessmentId(null);
          } finally {
            setIsSubmitting(false);
          }
        }}
        title="Excluir Gravação de Leitura"
        message="Deseja realmente remover esta gravação de leitura? O arquivo de áudio e os registros serão excluídos permanentemente."
        confirmLabel="Sim, Excluir Gravação"
        isLoading={isSubmitting}
      />
    </div>
  );
};
