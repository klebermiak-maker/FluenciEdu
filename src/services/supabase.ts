import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { School, ClassRoom, Student, Profile } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('seu-projeto')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// LOCAL STORAGE PERSISTENCE LAYER (FALLBACK)
// ==========================================
// Permite que o sistema funcione de forma fluida e completa na fase de testes,
// persistindo todas as operações CRUD no navegador caso o Supabase não esteja conectado.

const STORAGE_KEYS = {
  SCHOOLS: 'fluenciedu_itauba_schools_v2',
  CLASSES: 'fluenciedu_itauba_classes_v2',
  STUDENTS: 'fluenciedu_itauba_students_v2',
  PROFILES: 'fluenciedu_itauba_profiles_v2',
  CURRENT_USER: 'fluenciedu_itauba_current_user_v2',
};

const DEFAULT_SCHOOLS: School[] = [
  {
    id: 'school-1',
    nome: 'E.M.E.F. Paulo Freire',
    municipio: 'Itaúba',
    estado: 'MT',
    codigo: 'ESC-ITB-001',
    responsavel: 'Profª. Maria Clara da Silva',
    email: 'paulofreire@itauba.mt.gov.br',
    created_at: new Date('2026-02-10T10:00:00Z').toISOString(),
  },
  {
    id: 'school-2',
    nome: 'E.M.E.F. Santa Terezinha',
    municipio: 'Itaúba',
    estado: 'MT',
    codigo: 'ESC-ITB-002',
    responsavel: 'Prof. Carlos Eduardo Mendes',
    email: 'santaterezinha@itauba.mt.gov.br',
    created_at: new Date('2026-02-15T14:30:00Z').toISOString(),
  },
  {
    id: 'school-3',
    nome: 'Centro Educacional Pequeno Príncipe',
    municipio: 'Itaúba',
    estado: 'MT',
    codigo: 'ESC-ITB-003',
    responsavel: 'Helena Santos de Oliveira',
    email: 'pequenoprincipe@itauba.mt.gov.br',
    created_at: new Date('2026-03-01T09:15:00Z').toISOString(),
  }
];

const DEFAULT_CLASSES: ClassRoom[] = [
  {
    id: 'class-1',
    nome: '2º Ano A',
    ano_serie: '2º Ano',
    turno: 'Manhã',
    professor_id: 'user-demo-1',
    escola_id: 'school-1',
    ano_letivo: 2026,
    created_at: new Date('2026-02-12T11:00:00Z').toISOString(),
  },
  {
    id: 'class-2',
    nome: '2º Ano B',
    ano_serie: '2º Ano',
    turno: 'Tarde',
    professor_id: 'user-demo-1',
    escola_id: 'school-1',
    ano_letivo: 2026,
    created_at: new Date('2026-02-12T11:30:00Z').toISOString(),
  },
  {
    id: 'class-3',
    nome: '3º Ano A - Matutino',
    ano_serie: '3º Ano',
    turno: 'Manhã',
    professor_id: 'user-demo-1',
    escola_id: 'school-1',
    ano_letivo: 2026,
    created_at: new Date('2026-02-14T08:00:00Z').toISOString(),
  },
  {
    id: 'class-4',
    nome: '1º Ano Alfabetização',
    ano_serie: '1º Ano',
    turno: 'Manhã',
    professor_id: 'user-demo-2',
    escola_id: 'school-2',
    ano_letivo: 2026,
    created_at: new Date('2026-02-16T15:00:00Z').toISOString(),
  },
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'student-1',
    nome: 'Alice Ferreira Santos',
    matricula: '2026-0012',
    data_nascimento: '2018-04-15',
    turma_id: 'class-1',
    escola_id: 'school-1',
    created_at: new Date('2026-02-13T10:00:00Z').toISOString(),
  },
  {
    id: 'student-2',
    nome: 'Bernardo Lima Costa',
    matricula: '2026-0015',
    data_nascimento: '2018-08-22',
    turma_id: 'class-1',
    escola_id: 'school-1',
    created_at: new Date('2026-02-13T10:05:00Z').toISOString(),
  },
  {
    id: 'student-3',
    nome: 'Camila Rodrigues de Souza',
    matricula: '2026-0019',
    data_nascimento: '2018-01-30',
    turma_id: 'class-1',
    escola_id: 'school-1',
    created_at: new Date('2026-02-13T10:10:00Z').toISOString(),
  },
  {
    id: 'student-4',
    nome: 'Davi Lucca Ribeiro',
    matricula: '2026-0024',
    data_nascimento: '2018-11-12',
    turma_id: 'class-1',
    escola_id: 'school-1',
    created_at: new Date('2026-02-13T10:15:00Z').toISOString(),
  },
  {
    id: 'student-5',
    nome: 'Enzo Gabriel Alencar',
    matricula: '2026-0033',
    data_nascimento: '2018-05-09',
    turma_id: 'class-2',
    escola_id: 'school-1',
    created_at: new Date('2026-02-13T10:20:00Z').toISOString(),
  },
  {
    id: 'student-6',
    nome: 'Fernanda Martins de Paiva',
    matricula: '2026-0041',
    data_nascimento: '2017-09-18',
    turma_id: 'class-3',
    escola_id: 'school-1',
    created_at: new Date('2026-02-15T09:00:00Z').toISOString(),
  },
  {
    id: 'student-7',
    nome: 'Gabriel Barbosa Silveira',
    matricula: '2026-0045',
    data_nascimento: '2017-03-27',
    turma_id: 'class-3',
    escola_id: 'school-1',
    created_at: new Date('2026-02-15T09:10:00Z').toISOString(),
  },
  {
    id: 'student-8',
    nome: 'Heloísa Helena Fagundes',
    matricula: '2026-0050',
    data_nascimento: '2019-02-14',
    turma_id: 'class-4',
    escola_id: 'school-2',
    created_at: new Date('2026-02-17T11:00:00Z').toISOString(),
  }
];

export const localDB = {
  getSchools(): School[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(DEFAULT_SCHOOLS));
      return DEFAULT_SCHOOLS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SCHOOLS;
    }
  },
  saveSchools(schools: School[]): void {
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
  },

  getClasses(): ClassRoom[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
      return DEFAULT_CLASSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CLASSES;
    }
  },
  saveClasses(classes: ClassRoom[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  getStudents(): Student[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
      return DEFAULT_STUDENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_STUDENTS;
    }
  },
  saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getProfiles(): Profile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) {
      const defaultProfiles: Profile[] = [
        {
          id: 'user-demo-1',
          nome: 'Profª. Juliana Albuquerque',
          email: 'juliana.prof@itauba.mt.gov.br',
          role: 'professor',
          escola_id: 'school-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'user-demo-2',
          nome: 'Coordenador Marcos Valério',
          email: 'semec.gestor@itauba.mt.gov.br',
          role: 'gestor',
          escola_id: 'school-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'user-demo-3',
          nome: 'Administrador SEMEC Itaúba',
          email: 'admin.semec@itauba.mt.gov.br',
          role: 'admin',
          escola_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(defaultProfiles));
      return defaultProfiles;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
  saveProfiles(profiles: Profile[]): void {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  },

  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(DEFAULT_SCHOOLS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  }
};
