import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Users, 
  Edit3, 
  Trash2, 
  Eye, 
  Building2, 
  Calendar, 
  Clock, 
  UserCheck,
  Filter,
  FileDown
} from 'lucide-react';
import { ClassRoom, School, Student, ClassTurno } from '../../types/database';
import { CreateClassDTO } from '../../services/classService';
import { pdfExportService } from '../../services/pdfExportService';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../../contexts/ToastContext';

interface ClassesPageProps {
  classes: ClassRoom[];
  schools: School[];
  students: Student[];
  onCreateClass: (payload: CreateClassDTO) => Promise<void>;
  onUpdateClass: (id: string, payload: Partial<CreateClassDTO>) => Promise<void>;
  onDeleteClass: (id: string) => Promise<void>;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
  onOpenCreateStudentForClass?: (classId: string) => void;
}

const ANOS_SERIES = [
  '1º Ano',
  '2º Ano',
  '3º Ano',
  '4º Ano',
  '5º Ano',
];

const TURNOS: ClassTurno[] = ['Manhã', 'Tarde', 'Integral', 'Noite'];

export const ClassesPage: React.FC<ClassesPageProps> = ({
  classes,
  schools,
  students,
  onCreateClass,
  onUpdateClass,
  onDeleteClass,
  isCreateModalOpen,
  setIsCreateModalOpen,
  onOpenCreateStudentForClass,
}) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');

  // Modals state
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [viewingClass, setViewingClass] = useState<ClassRoom | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateClassDTO>({
    nome: '',
    ano_serie: '2º Ano',
    turno: 'Manhã',
    professor_id: null,
    escola_id: schools[0]?.id || '',
    ano_letivo: 2026,
  });

  // Filter classes
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.ano_serie.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool =
      selectedSchoolFilter === 'all' || cls.escola_id === selectedSchoolFilter;

    return matchesSearch && matchesSchool;
  });

  const handleOpenCreate = () => {
    if (schools.length === 0) {
      addToast('Atenção', 'Cadastre ao menos uma escola antes de criar turmas.', 'warning');
      return;
    }
    setFormData({
      nome: '',
      ano_serie: '2º Ano',
      turno: 'Manhã',
      professor_id: null,
      escola_id: schools[0]?.id || '',
      ano_letivo: 2026,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    setFormData({
      nome: cls.nome,
      ano_serie: cls.ano_serie,
      turno: cls.turno,
      professor_id: cls.professor_id,
      escola_id: cls.escola_id,
      ano_letivo: cls.ano_letivo,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      addToast('Campo obrigatório', 'Informe o nome da turma.', 'warning');
      return;
    }
    if (!formData.escola_id) {
      addToast('Campo obrigatório', 'Selecione a escola vinculada.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClass) {
        await onUpdateClass(editingClass.id, formData);
        setEditingClass(null);
      } else {
        await onCreateClass(formData);
        setIsCreateModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingClassId) return;
    setIsSubmitting(true);
    try {
      await onDeleteClass(deletingClassId);
      setDeletingClassId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    if (filteredClasses.length === 0) {
      addToast('Nenhum dado', 'Não há turmas listadas para exportar com os filtros atuais.', 'warning');
      return;
    }
    const schoolObj = schools.find((s) => s.id === selectedSchoolFilter);

    pdfExportService.exportClassesPDF(filteredClasses, schools, students, {
      schoolName: schoolObj?.nome,
      searchTerm: searchTerm || undefined,
    });

    addToast('Relatório gerado!', `${filteredClasses.length} turma(s) exportada(s) em PDF formatado.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Gerenciamento de Turmas
          </h2>
          <p className="text-sm text-slate-500">
            {classes.length} turma(s) organizadas para as avaliações de fluência leitora
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm shadow-xs hover:bg-slate-50 hover:text-blue-700 transition-colors focus:ring-2 focus:ring-blue-500"
            title="Exportar turmas exibidas em PDF formatado"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>Exportar Relatório</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Turma</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou série da turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Filter by school */}
        <div className="w-full sm:w-64">
          <select
            value={selectedSchoolFilter}
            onChange={(e) => setSelectedSchoolFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Todas as escolas ({schools.length})</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={searchTerm || selectedSchoolFilter !== 'all' ? 'Nenhuma turma encontrada' : 'Nenhuma turma cadastrada'}
          description={
            searchTerm || selectedSchoolFilter !== 'all'
              ? 'Tente ajustar os filtros ou a busca para localizar as turmas.'
              : 'Cadastre as turmas das escolas participantes para associar os estudantes.'
          }
          action={{
            label: 'Cadastrar Turma',
            onClick: handleOpenCreate,
            icon: Plus,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const school = schools.find((s) => s.id === cls.escola_id);
            const classStudents = students.filter((s) => s.turma_id === cls.id);

            return (
              <div
                key={cls.id}
                className="flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Badge & Year */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {cls.ano_serie}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Ano Letivo {cls.ano_letivo}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900 truncate" title={cls.nome}>
                    {cls.nome}
                  </h3>

                  {/* School name */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{school?.nome || 'Escola não encontrada'}</span>
                  </div>

                  {/* Turno */}
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Turno: {cls.turno}</span>
                  </div>

                  {/* Student Count Badge */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Alunos matriculados:</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Users className="w-3.5 h-3.5" />
                      {classStudents.length} aluno(s)
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewingClass(cls)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver alunos</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Editar turma"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingClassId(cls.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Excluir turma"
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

      {/* Modal: Criar / Editar Turma */}
      <Modal
        isOpen={isCreateModalOpen || editingClass !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingClass(null);
        }}
        title={editingClass ? 'Editar Turma' : 'Cadastrar Nova Turma'}
        subtitle="Informe a série, escola e turno da sala de aula"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome da Turma *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 2º Ano A, 3º Ano Alfabetização"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Escola Vinculada *
            </label>
            <select
              required
              value={formData.escola_id}
              onChange={(e) => setFormData({ ...formData, escola_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.nome} ({school.municipio} - {school.estado})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ano / Série *
              </label>
              <select
                value={formData.ano_serie}
                onChange={(e) => setFormData({ ...formData, ano_serie: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {ANOS_SERIES.map((serie) => (
                  <option key={serie} value={serie}>{serie}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Turno *
              </label>
              <select
                value={formData.turno}
                onChange={(e) => setFormData({ ...formData, turno: e.target.value as ClassTurno })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {TURNOS.map((turno) => (
                  <option key={turno} value={turno}>{turno}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ano Letivo *
            </label>
            <input
              type="number"
              required
              min={2020}
              max={2035}
              value={formData.ano_letivo}
              onChange={(e) => setFormData({ ...formData, ano_letivo: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingClass(null);
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
              {isSubmitting ? 'Salvando...' : editingClass ? 'Salvar Alterações' : 'Cadastrar Turma'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Visualizar Lista de Alunos da Turma */}
      {viewingClass && (
        <Modal
          isOpen={Boolean(viewingClass)}
          onClose={() => setViewingClass(null)}
          title={`Turma: ${viewingClass.nome}`}
          subtitle={`${schools.find((s) => s.id === viewingClass.escola_id)?.nome || ''} • ${viewingClass.ano_serie} • Turno ${viewingClass.turno}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Alunos da Turma ({students.filter((s) => s.turma_id === viewingClass.id).length})
              </h4>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
              {students.filter((s) => s.turma_id === viewingClass.id).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nenhum aluno cadastrado nesta turma ainda.
                </div>
              ) : (
                students
                  .filter((s) => s.turma_id === viewingClass.id)
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((student, idx) => (
                    <div key={student.id} className="flex items-center justify-between p-3 hover:bg-slate-50 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono w-5">{idx + 1}.</span>
                        <div>
                          <p className="font-bold text-slate-900">{student.nome}</p>
                          <p className="text-[11px] text-slate-500">Matrícula: {student.matricula}</p>
                        </div>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        Nasc: {new Date(student.data_nascimento).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingClass(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar Exclusão */}
      <ConfirmModal
        isOpen={Boolean(deletingClassId)}
        onClose={() => setDeletingClassId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Turma"
        message="Tem certeza que deseja excluir esta turma? Todos os alunos associados a ela também serão desvinculados ou removidos. Deseja continuar?"
        confirmLabel="Sim, Excluir Turma"
        isLoading={isSubmitting}
      />
    </div>
  );
};
