import { Student } from '../types/database';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { localDB } from './supabase';

export interface CreateStudentDTO {
  nome: string;
  matricula: string;
  data_nascimento: string;
  turma_id: string;
  escola_id: string;
}

export interface StudentFilters {
  escola_id?: string;
  turma_id?: string;
  search?: string;
  sortBy?: 'nome_asc' | 'nome_desc' | 'recent';
}

const COLLECTION_NAME = 'students';

export const studentService = {
  async list(filters?: StudentFilters): Promise<Student[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        let students = snap.docs.map((d) => d.data() as Student);
        localDB.saveStudents(students);

        if (filters?.escola_id) {
          students = students.filter((s) => s.escola_id === filters.escola_id);
        }
        if (filters?.turma_id) {
          students = students.filter((s) => s.turma_id === filters.turma_id);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase().trim();
          students = students.filter(
            (s) =>
              s.nome.toLowerCase().includes(q) ||
              s.matricula.toLowerCase().includes(q)
          );
        }

        if (filters?.sortBy === 'nome_desc') {
          students.sort((a, b) => b.nome.localeCompare(a.nome));
        } else if (filters?.sortBy === 'recent') {
          students.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else {
          students.sort((a, b) => a.nome.localeCompare(b.nome));
        }

        return students;
      }
    } catch (err) {
      console.warn('Carregando alunos do cache local devido ao Firestore:', err);
    }

    let students = localDB.getStudents();

    if (filters?.escola_id) {
      students = students.filter((s) => s.escola_id === filters.escola_id);
    }
    if (filters?.turma_id) {
      students = students.filter((s) => s.turma_id === filters.turma_id);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      students = students.filter(
        (s) =>
          s.nome.toLowerCase().includes(q) ||
          s.matricula.toLowerCase().includes(q)
      );
    }

    if (filters?.sortBy === 'nome_desc') {
      students.sort((a, b) => b.nome.localeCompare(a.nome));
    } else if (filters?.sortBy === 'recent') {
      students.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      students.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return students;
  },

  async getById(id: string): Promise<Student | null> {
    const students = await this.list();
    return students.find((s) => s.id === id) || null;
  },

  async create(payload: CreateStudentDTO): Promise<Student> {
    const matriculaNormalized = payload.matricula.trim().toUpperCase();
    const nomeNormalized = payload.nome.trim();

    // Check duplicate matricula in school
    const existingList = await this.list({ escola_id: payload.escola_id });
    const duplicate = existingList.find(
      (s) => s.matricula.toUpperCase() === matriculaNormalized
    );
    if (duplicate) {
      throw new Error(`Já existe um aluno com a matrícula "${payload.matricula}" nesta escola.`);
    }

    const id = `student-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newStudent: Student = {
      id,
      nome: nomeNormalized,
      matricula: matriculaNormalized,
      data_nascimento: payload.data_nascimento,
      turma_id: payload.turma_id,
      escola_id: payload.escola_id,
      created_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), newStudent);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    }

    const students = localDB.getStudents();
    students.push(newStudent);
    localDB.saveStudents(students);
    return newStudent;
  },

  async update(id: string, payload: Partial<CreateStudentDTO>): Promise<Student> {
    const students = localDB.getStudents();
    const idx = students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Aluno não encontrado');

    const updated: Student = {
      ...students[idx],
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

    students[idx] = updated;
    localDB.saveStudents(students);
    return updated;
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }

    const students = localDB.getStudents().filter((s) => s.id !== id);
    localDB.saveStudents(students);
  },

  async importBatch(
    items: {
      nome: string;
      matricula: string;
      data_nascimento: string;
      turma_id: string;
      escola_id: string;
    }[]
  ): Promise<{ insertedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let insertedCount = 0;

    for (const item of items) {
      try {
        await this.create(item);
        insertedCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${item.nome} (${item.matricula}): ${msg}`);
      }
    }

    return { insertedCount, errors };
  },
};
