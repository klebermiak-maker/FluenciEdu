import { ClassRoom, ClassTurno } from '../types/database';
import { supabase, isSupabaseConfigured, localDB } from './supabase';

export interface CreateClassDTO {
  nome: string;
  ano_serie: string;
  turno: ClassTurno;
  professor_id?: string | null;
  escola_id: string;
  ano_letivo: number;
}

export const classService = {
  async list(escolaId?: string): Promise<ClassRoom[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('classes').select('*').order('nome', { ascending: true });
      if (escolaId) {
        query = query.eq('escola_id', escolaId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    let classes = localDB.getClasses();
    if (escolaId) {
      classes = classes.filter((c) => c.escola_id === escolaId);
    }
    return classes.sort((a, b) => a.nome.localeCompare(b.nome));
  },

  async getById(id: string): Promise<ClassRoom | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data;
    }

    const classes = localDB.getClasses();
    return classes.find((c) => c.id === id) || null;
  },

  async create(payload: CreateClassDTO): Promise<ClassRoom> {
    const newClass: ClassRoom = {
      id: isSupabaseConfigured ? undefined as unknown as string : `class-${Date.now()}`,
      nome: payload.nome.trim(),
      ano_serie: payload.ano_serie.trim(),
      turno: payload.turno,
      professor_id: payload.professor_id || null,
      escola_id: payload.escola_id,
      ano_letivo: payload.ano_letivo,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          nome: newClass.nome,
          ano_serie: newClass.ano_serie,
          turno: newClass.turno,
          professor_id: newClass.professor_id,
          escola_id: newClass.escola_id,
          ano_letivo: newClass.ano_letivo,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const classes = localDB.getClasses();
    classes.push(newClass);
    localDB.saveClasses(classes);
    return newClass;
  },

  async update(id: string, payload: Partial<CreateClassDTO>): Promise<ClassRoom> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('classes')
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

    const classes = localDB.getClasses();
    const idx = classes.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Turma não encontrada');

    const updated = {
      ...classes[idx],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    classes[idx] = updated;
    localDB.saveClasses(classes);
    return updated;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return;
    }

    // Cascade delete local students in this class
    const classes = localDB.getClasses().filter((c) => c.id !== id);
    localDB.saveClasses(classes);

    const students = localDB.getStudents().filter((st) => st.turma_id !== id);
    localDB.saveStudents(students);
  }
};
