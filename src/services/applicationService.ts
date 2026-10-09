import { ReadingApplication, ReadingApplicationStatus, ReadingMaterialType, AssessmentMode } from '../types/database';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const STORAGE_KEY = 'fluenciedu_reading_applications_v1';
const COLLECTION_NAME = 'applications';

export interface CreateApplicationPayload {
  titulo: string;
  descricao?: string;
  turma_id: string;
  escola_id: string;
  professor_id: string;
  professor_nome: string;
  data_prevista: string; // YYYY-MM-DD
  material_id: string;
  material_titulo: string;
  material_tipo: ReadingMaterialType;
  material_conteudo_snapshot: string;
  modalidade: AssessmentMode;
  protocolo_versao: string;
  alunos_ids: string[];
}

function getLocalApplications(): ReadingApplication[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalApplications(items: ReadingApplication[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const applicationService = {
  async list(escolaId?: string, turmaId?: string): Promise<ReadingApplication[]> {
    let items: ReadingApplication[] = [];

    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        items = snap.docs.map((d) => d.data() as ReadingApplication);
        saveLocalApplications(items);
      } else {
        items = getLocalApplications();
      }
    } catch (err) {
      console.warn('Carregando aplicações do cache local devido ao Firestore:', err);
      items = getLocalApplications();
    }

    if (escolaId) {
      items = items.filter((a) => a.escola_id === escolaId);
    }
    if (turmaId) {
      items = items.filter((a) => a.turma_id === turmaId);
    }

    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getById(id: string): Promise<ReadingApplication | null> {
    const list = await this.list();
    return list.find((a) => a.id === id) || null;
  },

  async create(payload: CreateApplicationPayload): Promise<ReadingApplication> {
    const id = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowUtc = new Date().toISOString();

    const newApp: ReadingApplication = {
      id,
      titulo: payload.titulo.trim(),
      descricao: payload.descricao?.trim() || '',
      turma_id: payload.turma_id,
      escola_id: payload.escola_id,
      professor_id: payload.professor_id,
      professor_nome: payload.professor_nome,
      data_prevista: payload.data_prevista,
      material_id: payload.material_id,
      material_titulo: payload.material_titulo,
      material_tipo: payload.material_tipo,
      material_conteudo_snapshot: payload.material_conteudo_snapshot,
      modalidade: payload.modalidade,
      protocolo_versao: payload.protocolo_versao,
      alunos_ids: payload.alunos_ids,
      alunos_ausentes: [],
      selected_tentativa_por_aluno: {},
      status: 'em_andamento',
      created_at: nowUtc,
      updated_at: nowUtc,
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), newApp);
    } catch (err) {
      console.warn('Erro ao salvar aplicação no Firestore, mantendo em armazenamento local:', err);
    }

    const current = getLocalApplications();
    current.unshift(newApp);
    saveLocalApplications(current);

    return newApp;
  },

  async update(id: string, patch: Partial<ReadingApplication>): Promise<ReadingApplication> {
    const list = getLocalApplications();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Aplicação não encontrada.');

    const updated: ReadingApplication = {
      ...list[index],
      ...patch,
      updated_at: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...patch,
        updated_at: updated.updated_at,
      });
    } catch (err) {
      console.warn('Erro ao atualizar aplicação no Firestore:', err);
    }

    list[index] = updated;
    saveLocalApplications(list);
    return updated;
  },

  async toggleStudentAbsent(applicationId: string, studentId: string, isAbsent: boolean): Promise<ReadingApplication> {
    const app = await this.getById(applicationId);
    if (!app) throw new Error('Aplicação não encontrada.');

    const currentAbsent = new Set(app.alunos_ausentes || []);
    if (isAbsent) {
      currentAbsent.add(studentId);
    } else {
      currentAbsent.delete(studentId);
    }

    return this.update(applicationId, {
      alunos_ausentes: Array.from(currentAbsent),
    });
  },

  async setSelectedTentativa(
    applicationId: string,
    studentId: string,
    assessmentId: string
  ): Promise<ReadingApplication> {
    const app = await this.getById(applicationId);
    if (!app) throw new Error('Aplicação não encontrada.');

    const selectedMap = { ...(app.selected_tentativa_por_aluno || {}) };
    selectedMap[studentId] = assessmentId;

    return this.update(applicationId, {
      selected_tentativa_por_aluno: selectedMap,
    });
  },

  async completeApplication(id: string): Promise<ReadingApplication> {
    const nowUtc = new Date().toISOString();
    return this.update(id, {
      status: 'concluida',
      data_conclusao: nowUtc,
    });
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      console.warn('Erro ao excluir aplicação no Firestore:', err);
    }

    const current = getLocalApplications().filter((a) => a.id !== id);
    saveLocalApplications(current);
  },
};
