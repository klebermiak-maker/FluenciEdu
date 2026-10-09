import { Student } from '../types/database';
import { supabase, isSupabaseConfigured, localDB } from './supabase';

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

export const studentService = {
  async list(filters?: StudentFilters): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('students').select('*');

      if (filters?.escola_id) {
        query = query.eq('escola_id', filters.escola_id);
      }
      if (filters?.turma_id) {
        query = query.eq('turma_id', filters.turma_id);
      }
      if (filters?.search) {
        query = query.or(`nome.ilike.%${filters.search}%,matricula.ilike.%${filters.search}%`);
      }

      if (filters?.sortBy === 'nome_desc') {
        query = query.order('nome', { ascending: false });
      } else if (filters?.sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('nome', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
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
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data;
    }

    const students = localDB.getStudents();
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

    const newStudent: Student = {
      id: isSupabaseConfigured ? undefined as unknown as string : `student-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nome: nomeNormalized,
      matricula: matriculaNormalized,
      data_nascimento: payload.data_nascimento,
      turma_id: payload.turma_id,
      escola_id: payload.escola_id,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          nome: newStudent.nome,
          matricula: newStudent.matricula,
          data_nascimento: newStudent.data_nascimento,
          turma_id: newStudent.turma_id,
          escola_id: newStudent.escola_id,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const students = localDB.getStudents();
    students.push(newStudent);
    localDB.saveStudents(students);
    return newStudent;
  },

  async update(id: string, payload: Partial<CreateStudentDTO>): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const students = localDB.getStudents();
    const idx = students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Aluno não encontrado');

    const updated = {
      ...students[idx],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    students[idx] = updated;
    localDB.saveStudents(students);
    return updated;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      return;
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
  }
};
