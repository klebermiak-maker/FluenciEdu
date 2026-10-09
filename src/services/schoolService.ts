import { School } from '../types/database';
import { supabase, isSupabaseConfigured, localDB } from './supabase';

export interface CreateSchoolDTO {
  nome: string;
  municipio: string;
  estado: string;
  codigo: string;
  responsavel: string;
  email: string;
}

export const schoolService = {
  async list(): Promise<School[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return localDB.getSchools().sort((a, b) => a.nome.localeCompare(b.nome));
  },

  async getById(id: string): Promise<School | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data;
    }
    const schools = localDB.getSchools();
    return schools.find((s) => s.id === id) || null;
  },

  async create(payload: CreateSchoolDTO): Promise<School> {
    const newSchool: School = {
      id: isSupabaseConfigured ? undefined as unknown as string : `school-${Date.now()}`,
      nome: payload.nome.trim(),
      municipio: payload.municipio.trim(),
      estado: payload.estado.trim().toUpperCase(),
      codigo: payload.codigo.trim().toUpperCase(),
      responsavel: payload.responsavel.trim(),
      email: payload.email.trim().toLowerCase(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('schools')
        .insert([{
          nome: newSchool.nome,
          municipio: newSchool.municipio,
          estado: newSchool.estado,
          codigo: newSchool.codigo,
          responsavel: newSchool.responsavel,
          email: newSchool.email
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const schools = localDB.getSchools();
    schools.push(newSchool);
    localDB.saveSchools(schools);
    return newSchool;
  },

  async update(id: string, payload: Partial<CreateSchoolDTO>): Promise<School> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('schools')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const schools = localDB.getSchools();
    const index = schools.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Escola não encontrada');

    const updated = {
      ...schools[index],
      ...payload,
      updated_at: new Date().toISOString()
    };
    schools[index] = updated;
    localDB.saveSchools(schools);
    return updated;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return;
    }

    // Cascade delete local classes and students
    const schools = localDB.getSchools().filter((s) => s.id !== id);
    localDB.saveSchools(schools);

    const classes = localDB.getClasses().filter((c) => c.escola_id !== id);
    localDB.saveClasses(classes);

    const students = localDB.getStudents().filter((st) => st.escola_id !== id);
    localDB.saveStudents(students);
  }
};
