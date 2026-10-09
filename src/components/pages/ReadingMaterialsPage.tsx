import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Mic, 
  BookOpen, 
  Sparkles, 
  Info,
  Check,
  Filter
} from 'lucide-react';
import { ReadingMaterial, ReadingMaterialType } from '../../types/database';
import { CreateMaterialDTO } from '../../services/materialService';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../../contexts/ToastContext';

interface ReadingMaterialsPageProps {
  materials: ReadingMaterial[];
  onCreateMaterial: (payload: CreateMaterialDTO) => Promise<void>;
  onUpdateMaterial: (id: string, payload: Partial<CreateMaterialDTO>) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
  onStartAssessmentWithMaterial: (materialId: string) => void;
}

const TIPOS: { id: ReadingMaterialType; label: string; desc: string; color: string }[] = [
  { 
    id: 'palavras', 
    label: 'Lista de Palavras', 
    desc: 'Palavras reais e frequentes para reconhecimento automático',
    color: 'bg-blue-100 text-blue-800 border-blue-200' 
  },
  { 
    id: 'pseudopalavras', 
    label: 'Pseudopalavras', 
    desc: 'Palavras inventadas para avaliação da rota fonológica pura',
    color: 'bg-amber-100 text-amber-800 border-amber-200' 
  },
  { 
    id: 'texto_curto', 
    label: 'Texto Curto', 
    desc: 'Narrativas breves para verificação de ritmo e prosódia',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200' 
  },
];

export const ReadingMaterialsPage: React.FC<ReadingMaterialsPageProps> = ({
  materials,
  onCreateMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onStartAssessmentWithMaterial,
}) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ReadingMaterial | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateMaterialDTO>({
    titulo: '',
    tipo: 'palavras',
    ano_escolar: '1º e 2º Ano',
    conteudo: '',
    descricao: '',
  });

  // Filtered
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = 
      m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.ano_escolar.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || m.tipo === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenCreate = () => {
    setFormData({
      titulo: '',
      tipo: 'palavras',
      ano_escolar: '1º e 2º Ano',
      conteudo: '',
      descricao: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (m: ReadingMaterial) => {
    setEditingMaterial(m);
    setFormData({
      titulo: m.titulo,
      tipo: m.tipo,
      ano_escolar: m.ano_escolar,
      conteudo: m.conteudo,
      descricao: m.descricao || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.conteudo.trim()) {
      addToast('Campos obrigatórios', 'Preencha o título e o conteúdo do material.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMaterial) {
        await onUpdateMaterial(editingMaterial.id, formData);
        setEditingMaterial(null);
      } else {
        await onCreateMaterial(formData);
        setIsCreateModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMaterialId) return;
    setIsSubmitting(true);
    try {
      await onDeleteMaterial(deletingMaterialId);
      setDeletingMaterialId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Aviso de Prática Pedagógica */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Aviso sobre os Materiais de Leitura:</p>
          <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
            Os materiais disponíveis nesta seção são exemplos originais para treino e prática pedagógica formativa.
            Eles não possuem equivalência nem substituem os instrumentos oficiais e sigilosos das avaliações do CAEd / MEC.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Materiais de Leitura
          </h2>
          <p className="text-sm text-slate-500">
            {materials.length} material(is) cadastrado(s) para aplicação e prática
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Material</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por título ou conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTypeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos ({materials.length})
          </button>
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTypeFilter(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTypeFilter === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Materiais */}
      {filteredMaterials.length === 0 ? (
        <EmptyState
          title="Nenhum material encontrado"
          description="Ajuste os filtros de busca ou cadastre um novo texto ou lista."
          icon={FileText}
          actionLabel="Cadastrar Material"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((m) => {
            const tipoInfo = TIPOS.find((t) => t.id === m.tipo) || TIPOS[0];
            const wordCount = m.conteudo.trim().split(/\s+/).filter(Boolean).length;

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tipoInfo.color}`}>
                      {tipoInfo.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {m.ano_escolar}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mb-1">{m.titulo}</h3>
                  {m.descricao && (
                    <p className="text-xs text-slate-500 mb-3">{m.descricao}</p>
                  )}

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 font-serif text-slate-700 text-xs sm:text-sm line-clamp-4 leading-relaxed mb-3">
                    {m.conteudo}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {wordCount} palavras • {m.conteudo.length} caracteres
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onStartAssessmentWithMaterial(m.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-colors"
                      title="Iniciar avaliação com este material"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Avaliar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar material"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingMaterialId(m.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Excluir material"
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

      {/* Modal de Criação / Edição */}
      <Modal
        isOpen={isCreateModalOpen || editingMaterial !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingMaterial(null);
        }}
        title={editingMaterial ? 'Editar Material de Leitura' : 'Cadastrar Material de Leitura'}
        description="Defina o tipo, ano escolar e o texto a ser apresentado aos estudantes."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título do Material *
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Palavras Frequentes 2º Ano / O Pássaro e o Sol"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Material *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as ReadingMaterialType })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="palavras">Lista de Palavras</option>
                <option value="pseudopalavras">Lista de Pseudopalavras</option>
                <option value="texto_curto">Texto Curto</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ano / Ciclo Escolar *
              </label>
              <select
                value={formData.ano_escolar}
                onChange={(e) => setFormData({ ...formData, ano_escolar: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="1º Ano">1º Ano</option>
                <option value="1º e 2º Ano">1º e 2º Ano</option>
                <option value="2º Ano">2º Ano</option>
                <option value="2º e 3º Ano">2º e 3º Ano</option>
                <option value="3º Ano">3º Ano</option>
                <option value="4º Ano">4º Ano</option>
                <option value="4º e 5º Ano">4º e 5º Ano</option>
                <option value="5º Ano">5º Ano</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Conteúdo do Texto / Palavras *
            </label>
            <textarea
              required
              rows={6}
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Digite o texto ou as palavras separadas por espaço..."
              className="w-full p-3.5 rounded-xl border border-slate-200 text-sm font-serif focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {formData.conteudo.trim().split(/\s+/).filter(Boolean).length} palavras digitadas
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição / Orientações (Opcional)
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Orientações pedagógicas para o aplicador..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingMaterial(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : editingMaterial ? 'Atualizar Material' : 'Cadastrar Material'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Exclusão */}
      <ConfirmModal
        isOpen={deletingMaterialId !== null}
        onClose={() => setDeletingMaterialId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Material de Leitura"
        message="Deseja realmente remover este material? Avaliações já gravadas anteriormente continuarão preservadas com suas cópias congeladas intactas."
        confirmText="Sim, Excluir Material"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
