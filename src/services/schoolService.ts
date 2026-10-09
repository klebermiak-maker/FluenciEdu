import { School } from '../types/database';
import { db, handleFirestoreError, OperationType, seedFirestoreIfEmpty } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { localDB } from './supabase';

export interface CreateSchoolDTO {
  nome: string;
  municipio: string;
  estado: string;
  codigo: string;
  responsavel: string;
  email: string;
}

const COLLECTION_NAME = 'schools';

export const schoolService = {
  async list(): Promise<School[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        const schools = snap.docs.map((d) => d.data() as School);
        // Sync local cache
        localDB.saveSchools(schools);
        return schools.sort((a, b) => a.nome.localeCompare(b.nome));
      } else {
        const defaults = localDB.getSchools();
        const classesDef = localDB.getClasses();
        const studentsDef = localDB.getStudents();
        await seedFirestoreIfEmpty(defaults, classesDef, studentsDef);
        return defaults.sort((a, b) => a.nome.localeCompare(b.nome));
      }
    } catch (err) {
      console.warn('Carregando escolas do cache local devido ao Firestore:', err);
    }
    return localDB.getSchools().sort((a, b) => a.nome.localeCompare(b.nome));
  },

  async getById(id: string): Promise<School | null> {
    const schools = await this.list();
    return schools.find((s) => s.id === id) || null;
  },

  async create(payload: CreateSchoolDTO): Promise<School> {
    const id = `school-${Date.now()}`;
    const newSchool: School = {
      id,
      nome: payload.nome.trim(),
      municipio: payload.municipio.trim(),
      estado: payload.estado.trim().toUpperCase(),
      codigo: payload.codigo.trim().toUpperCase(),
      responsavel: payload.responsavel.trim(),
      email: payload.email.trim().toLowerCase(),
      created_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), newSchool);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    }

    const schools = localDB.getSchools();
    schools.push(newSchool);
    localDB.saveSchools(schools);
    return newSchool;
  },

  async update(id: string, payload: Partial<CreateSchoolDTO>): Promise<School> {
    const schools = localDB.getSchools();
    const index = schools.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Escola não encontrada');

    const updated: School = {
      ...schools[index],
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

    schools[index] = updated;
    localDB.saveSchools(schools);
    return updated;
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }

    // Cascade delete local classes and students
    const schools = localDB.getSchools().filter((s) => s.id !== id);
    localDB.saveSchools(schools);

    const classes = localDB.getClasses().filter((c) => c.escola_id !== id);
    localDB.saveClasses(classes);

    const students = localDB.getStudents().filter((st) => st.escola_id !== id);
    localDB.saveStudents(students);
  },
};
