export type UserRole = 'admin' | 'gestor' | 'professor';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  escola_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  nome: string;
  municipio: string;
  estado: string;
  codigo: string;
  responsavel: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export type ClassTurno = 'Manhã' | 'Tarde' | 'Integral' | 'Noite';

export interface ClassRoom {
  id: string;
  nome: string;
  ano_serie: string;
  turno: ClassTurno;
  professor_id?: string | null;
  escola_id: string;
  ano_letivo: number;
  created_at: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  nome: string;
  matricula: string;
  data_nascimento: string; // YYYY-MM-DD
  turma_id: string;
  escola_id: string;
  created_at: string;
  updated_at?: string;
}

export type AssessmentStatus = 'pendente' | 'em_andamento' | 'concluida' | 'analisada';

export interface Assessment {
  id: string;
  student_id: string;
  turma_id: string;
  escola_id: string;
  evaluator_id?: string | null;
  status: AssessmentStatus;
  audio_path?: string | null;
  duracao_segundos?: number | null;
  palavras_por_minuto?: number | null;
  precisao_leitura?: number | null;
  nivel_fluencia?: string | null;
  transcricao?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CSVPreviewItem {
  id: string;
  nome: string;
  matricula: string;
  data_nascimento: string;
  turma: string;
  turma_id?: string;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

export type NavigationPage = 
  | 'dashboard'
  | 'schools'
  | 'classes'
  | 'students'
  | 'import'
  | 'assessments'
  | 'reports'
  | 'profile';
