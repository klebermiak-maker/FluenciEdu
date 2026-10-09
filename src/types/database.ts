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
export type ReadingMaterialType = 'palavras' | 'pseudopalavras' | 'texto_curto';
export type AssessmentMode = 'livre' | '60_segundos';
export type AssessmentAudioStorageStatus = 'salvo' | 'pendente_upload' | 'falha';

export interface ReadingMaterial {
  id: string;
  titulo: string;
  tipo: ReadingMaterialType;
  ano_escolar: string;
  conteudo: string;
  descricao?: string;
  is_exemplo?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Assessment {
  id: string;
  escola_id: string;
  professor_id: string;
  professor_nome: string;
  turma_id: string;
  student_id: string; // compatibility
  aluno_id: string;
  material_id: string;
  material_titulo: string;
  material_tipo: ReadingMaterialType;
  material_conteudo_snapshot: string;
  modalidade: AssessmentMode;
  data_inicio: string; // UTC ISO string
  duracao_segundos: number; // Real effective duration
  audio_url: string; // Playable URL (blob, signed, or storage)
  audio_storage_path: string; // Unique file path in storage
  audio_mime_type: string;
  audio_size_bytes: number;
  observacoes?: string | null;
  status_armazenamento: AssessmentAudioStorageStatus;
  status: AssessmentStatus;
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
  | 'materials'
  | 'import'
  | 'assessments'
  | 'reports'
  | 'profile';
