import { Assessment, AssessmentMode, ReadingMaterialType } from '../types/database';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { audioStorageService } from './audioStorageService';

const STORAGE_KEY = 'fluenciedu_assessments_v2';
const COLLECTION_NAME = 'assessments';

export interface CreateAssessmentPayload {
  escola_id: string;
  professor_id: string;
  professor_nome: string;
  turma_id: string;
  aluno_id: string;
  material_id: string;
  material_titulo: string;
  material_tipo: ReadingMaterialType;
  material_conteudo_snapshot: string;
  modalidade: AssessmentMode;
  data_inicio: string; // UTC ISO string
  duracao_segundos: number; // Real recorded duration
  audio_mime_type: string;
  observacoes?: string;
  aplicacao_id?: string | null;
  tentativa_numero?: number;
  is_tentativa_selecionada?: boolean;
}

export interface AssessmentFilterOptions {
  escola_id?: string;
  turma_id?: string;
  aluno_id?: string;
  material_tipo?: string;
  startDate?: string;
  endDate?: string;
}

function getLocalAssessments(): Assessment[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalAssessments(items: Assessment[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const assessmentService = {
  async list(filters?: AssessmentFilterOptions): Promise<Assessment[]> {
    let items: Assessment[] = [];

    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        items = snap.docs.map((d) => d.data() as Assessment);
        saveLocalAssessments(items);
      } else {
        items = getLocalAssessments();
      }
    } catch {
      items = getLocalAssessments();
    }

    if (filters?.escola_id) {
      items = items.filter((a) => a.escola_id === filters.escola_id);
    }
    if (filters?.turma_id) {
      items = items.filter((a) => a.turma_id === filters.turma_id);
    }
    if (filters?.aluno_id) {
      items = items.filter((a) => a.aluno_id === filters.aluno_id || a.student_id === filters.aluno_id);
    }
    if (filters?.material_tipo) {
      items = items.filter((a) => a.material_tipo === filters.material_tipo);
    }
    if (filters?.startDate) {
      const start = new Date(filters.startDate).getTime();
      items = items.filter((a) => new Date(a.created_at).getTime() >= start);
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate).getTime() + 86400000;
      items = items.filter((a) => new Date(a.created_at).getTime() <= end);
    }

    // Ordenação decrescente pela mais recente
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getById(id: string): Promise<Assessment | null> {
    const list = await this.list();
    return list.find((a) => a.id === id) || null;
  },

  /**
   * Criação atômica e consistente: salva o áudio no storage e grava o registro no banco.
   * Não deixa uma avaliação salva sem o arquivo de áudio correspondente.
   */
  async create(payload: CreateAssessmentPayload, audioBlob: Blob): Promise<Assessment> {
    const assessmentId = `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Salvar o arquivo de áudio de forma persistente
    const storageResult = await audioStorageService.saveAudio(
      assessmentId,
      audioBlob,
      payload.audio_mime_type
    );

    const nowUtc = new Date().toISOString();

    const record: Assessment = {
      id: assessmentId,
      escola_id: payload.escola_id,
      professor_id: payload.professor_id,
      professor_nome: payload.professor_nome,
      turma_id: payload.turma_id,
      student_id: payload.aluno_id,
      aluno_id: payload.aluno_id,
      material_id: payload.material_id,
      material_titulo: payload.material_titulo,
      material_tipo: payload.material_tipo,
      material_conteudo_snapshot: payload.material_conteudo_snapshot,
      modalidade: payload.modalidade,
      data_inicio: payload.data_inicio,
      duracao_segundos: Math.round(payload.duracao_segundos * 10) / 10,
      audio_url: storageResult.audioUrl,
      audio_storage_path: storageResult.storagePath,
      audio_mime_type: payload.audio_mime_type,
      audio_size_bytes: storageResult.sizeBytes,
      observacoes: payload.observacoes?.trim() || null,
      status_armazenamento: 'salvo',
      status: 'concluida',
      aplicacao_id: payload.aplicacao_id || null,
      tentativa_numero: payload.tentativa_numero || 1,
      is_tentativa_selecionada: payload.is_tentativa_selecionada ?? true,
      created_at: nowUtc,
      updated_at: nowUtc,
    };

    // 2. Persistir no Firestore
    try {
      await setDoc(doc(db, COLLECTION_NAME, assessmentId), record);
    } catch (err) {
      console.warn('Erro ao salvar no Firestore, mantendo em armazenamento local:', err);
      // Salva no IndexedDB/local para não perder a gravação
    }

    // 3. Persistir no cache local
    const current = getLocalAssessments();
    current.unshift(record);
    saveLocalAssessments(current);

    return record;
  },

  async updateNotes(id: string, observacoes: string): Promise<Assessment> {
    const list = getLocalAssessments();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Avaliação não encontrada.');

    const updated: Assessment = {
      ...list[index],
      observacoes: observacoes.trim(),
      updated_at: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        observacoes: updated.observacoes,
        updated_at: updated.updated_at,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }

    list[index] = updated;
    saveLocalAssessments(list);
    return updated;
  },

  /**
   * Salva os detalhes completos da correção (rascunho ou revisão finalizada).
   */
  async saveEvaluationDetails(id: string, details: import('../types/database').EvaluationDetails): Promise<Assessment> {
    const list = getLocalAssessments();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Avaliação não encontrada.');

    const updated: Assessment = {
      ...list[index],
      avaliacao_detalhes: details,
      status: details.estado_correcao === 'revisada' ? 'analisada' : 'em_andamento',
      updated_at: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        avaliacao_detalhes: details,
        status: updated.status,
        updated_at: updated.updated_at,
      });
    } catch (err) {
      console.warn('Erro ao atualizar detalhes no Firestore, mantendo no cache local:', err);
    }

    list[index] = updated;
    saveLocalAssessments(list);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const record = await this.getById(id);

    // 1. Remover arquivo de áudio do storage
    if (record) {
      await audioStorageService.deleteAudio(id, record.audio_storage_path);
    }

    // 2. Remover registro do Firestore
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }

    // 3. Remover do cache local
    const list = getLocalAssessments().filter((a) => a.id !== id);
    saveLocalAssessments(list);
  },
};
