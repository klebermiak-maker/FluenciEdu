import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Mail, 
  User, 
  Eye, 
  Edit3, 
  Trash2, 
  GraduationCap, 
  Users, 
  X,
  ExternalLink,
  School as SchoolIcon
} from 'lucide-react';
import { School, ClassRoom, Student } from '../../types/database';
import { CreateSchoolDTO } from '../../services/schoolService';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../../contexts/ToastContext';

interface SchoolsPageProps {
  schools: School[];
  classes: ClassRoom[];
  students: Student[];
  onCreateSchool: (payload: CreateSchoolDTO) => Promise<void>;
  onUpdateSchool: (id: string, payload: Partial<CreateSchoolDTO>) => Promise<void>;
  onDeleteSchool: (id: string) => Promise<void>;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
}

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const SchoolsPage: React.FC<SchoolsPageProps> = ({
  schools,
  classes,
  students,
  onCreateSchool,
  onUpdateSchool,
  onDeleteSchool,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [viewingSchool, setViewingSchool] = useState<School | null>(null);
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateSchoolDTO>({
    nome: '',
    municipio: 'Itaúba',
    estado: 'MT',
    codigo: '',
    responsavel: '',
    email: '',
  });

  // Filtered Schools
  const filteredSchools = schools.filter((school) => {
    const term = searchTerm.toLowerCase();
    return (
      school.nome.toLowerCase().includes(term) ||
      school.municipio.toLowerCase().includes(term) ||
      school.codigo.toLowerCase().includes(term) ||
      school.responsavel.toLowerCase().includes(term)
    );
  });

  const handleOpenCreate = () => {
    setFormData({
      nome: '',
      municipio: 'Itaúba',
      estado: 'MT',
      codigo: '',
      responsavel: '',
      email: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      nome: school.nome,
      municipio: school.municipio,
      estado: school.estado,
      codigo: school.codigo,
      responsavel: school.responsavel,
      email: school.email,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.municipio.trim() || !formData.responsavel.trim()) {
      addToast('Campos obrigatórios', 'Preencha o nome, município e responsável.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSchool) {
        await onUpdateSchool(editingSchool.id, formData);
        setEditingSchool(null);
      } else {
        await onCreateSchool(formData);
        setIsCreateModalOpen(false);
      }
    } catch {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchoolId) return;
    setIsSubmitting(true);
    try {
      await onDeleteSchool(deletingSchoolId);
      setDeletingSchoolId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Escolas Participantes
          </h2>
          <p className="text-sm text-slate-500">
            {schools.length} unidade(s) de ensino cadastrada(s) no programa de fluência
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Escola</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, município, código ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg bg-slate-100"
          >
            Limpar busca
          </button>
        )}
      </div>

      {/* Schools Cards Grid */}
      {filteredSchools.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchTerm ? 'Nenhuma escola encontrada' : 'Nenhuma escola cadastrada'}
          description={
            searchTerm
              ? 'Tente ajustar os termos da sua pesquisa ou limpe o filtro.'
              : 'Cadastre a primeira escola da rede municipal para vincular turmas e estudantes.'
          }
          action={
            searchTerm
              ? { label: 'Limpar pesquisa', onClick: () => setSearchTerm('') }
              : { label: 'Cadastrar Escola', onClick: handleOpenCreate, icon: Plus }
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchools.map((school) => {
            const schoolClasses = classes.filter((c) => c.escola_id === school.id);
            const schoolStudents = students.filter((s) => s.escola_id === school.id);

            return (
              <div
                key={school.id}
                className="flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shrink-0">
                      <SchoolIcon className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {school.codigo || 'S/ CÓD'}
                    </span>
                  </div>

                  {/* Title & City */}
                  <h3 className="mt-3 text-base font-bold text-slate-900 line-clamp-1" title={school.nome}>
                    {school.nome}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{school.municipio} - {school.estado}</span>
                  </div>

                  {/* Contact info */}
                  <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{school.responsavel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{school.email}</span>
                    </div>
                  </div>

                  {/* Stats Badges */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {schoolClasses.length} turmas
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Users className="w-3.5 h-3.5" />
                      {schoolStudents.length} alunos
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewingSchool(school)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver detalhes</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(school)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Editar escola"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSchoolId(school.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Excluir escola"
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

      {/* Modal: Criar / Editar Escola */}
      <Modal
        isOpen={isCreateModalOpen || editingSchool !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingSchool(null);
        }}
        title={editingSchool ? 'Editar Escola' : 'Cadastrar Nova Escola'}
        subtitle="Informe os dados da instituição de ensino"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome da Escola *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: E.M.E.F. Monteiro Lobato"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Município *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: São Paulo"
                value={formData.municipio}
                onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estado (UF) *
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {ESTADOS_BRASIL.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Código da Escola / INEP
            </label>
            <input
              type="text"
              placeholder="Ex: ESC-SP-042 ou Código INEP"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Responsável / Diretor(a) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Profª. Maria Clara da Silva"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail de Contato *
              </label>
              <input
                type="email"
                required
                placeholder="escola@educacao.gov.br"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingSchool(null);
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
              {isSubmitting ? 'Salvando...' : editingSchool ? 'Salvar Alterações' : 'Cadastrar Escola'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Visualizar Detalhes da Escola */}
      {viewingSchool && (
        <Modal
          isOpen={Boolean(viewingSchool)}
          onClose={() => setViewingSchool(null)}
          title={viewingSchool.nome}
          subtitle={`Código: ${viewingSchool.codigo || 'Não informado'}`}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="font-semibold text-slate-500">Localização:</span>
                <p className="font-bold text-slate-800 mt-0.5">{viewingSchool.municipio} - {viewingSchool.estado}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Responsável:</span>
                <p className="font-bold text-slate-800 mt-0.5">{viewingSchool.responsavel}</p>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-slate-500">E-mail:</span>
                <p className="font-bold text-slate-800 mt-0.5">{viewingSchool.email}</p>
              </div>
            </div>

            {/* Turmas vinculadas */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Turmas Vinculadas ({classes.filter((c) => c.escola_id === viewingSchool.id).length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {classes.filter((c) => c.escola_id === viewingSchool.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhuma turma vinculada a esta escola ainda.</p>
                ) : (
                  classes
                    .filter((c) => c.escola_id === viewingSchool.id)
                    .map((cls) => {
                      const count = students.filter((s) => s.turma_id === cls.id).length;
                      return (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{cls.nome}</span>
                            <span className="text-slate-500 ml-2">({cls.ano_serie} • {cls.turno})</span>
                          </div>
                          <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {count} aluno(s)
                          </span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingSchool(null)}
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
        isOpen={Boolean(deletingSchoolId)}
        onClose={() => setDeletingSchoolId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Escola"
        message="Tem certeza que deseja excluir esta escola? Todas as turmas e alunos vinculados a ela também serão removidos. Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir Escola"
        isLoading={isSubmitting}
      />
    </div>
  );
};
