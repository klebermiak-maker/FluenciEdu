import { ClassRoom, ClassTurno } from '../types/database';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { localDB } from './supabase';

export interface CreateClassDTO {
  nome: string;
  ano_serie: string;
  turno: ClassTurno;
  professor_id?: string | null;
  escola_id: string;
  ano_letivo: number;
}

const COLLECTION_NAME = 'classes';

export const classService = {
  async list(escolaId?: string): Promise<ClassRoom[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        let classes = snap.docs.map((d) => d.data() as ClassRoom);
        localDB.saveClasses(classes);
        if (escolaId) {
          classes = classes.filter((c) => c.escola_id === escolaId);
        }
        return classes.sort((a, b) => a.nome.localeCompare(b.nome));
      }
    } catch (err) {
      console.warn('Carregando turmas do cache local devido ao Firestore:', err);
    }

    let classes = localDB.getClasses();
    if (escolaId) {
      classes = classes.filter((c) => c.escola_id === escolaId);
    }
    return classes.sort((a, b) => a.nome.localeCompare(b.nome));
  },

  async getById(id: string): Promise<ClassRoom | null> {
    const classes = await this.list();
    return classes.find((c) => c.id === id) || null;
  },

  async create(payload: CreateClassDTO): Promise<ClassRoom> {
    const id = `class-${Date.now()}`;
    const newClass: ClassRoom = {
      id,
      nome: payload.nome.trim(),
      ano_serie: payload.ano_serie.trim(),
      turno: payload.turno,
      professor_id: payload.professor_id || null,
      escola_id: payload.escola_id,
      ano_letivo: payload.ano_letivo,
      created_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), newClass);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    }

    const classes = localDB.getClasses();
    classes.push(newClass);
    localDB.saveClasses(classes);
    return newClass;
  },

  async update(id: string, payload: Partial<CreateClassDTO>): Promise<ClassRoom> {
    const classes = localDB.getClasses();
    const idx = classes.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Turma não encontrada');

    const updated: ClassRoom = {
      ...classes[idx],
      ...payload,
      updated_at: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...payload,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }

    classes[idx] = updated;
    localDB.saveClasses(classes);
    return updated;
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }

    // Cascade delete local students in this class
    const classes = localDB.getClasses().filter((c) => c.id !== id);
    localDB.saveClasses(classes);

    const students = localDB.getStudents().filter((st) => st.turma_id !== id);
    localDB.saveStudents(students);
  },
};
