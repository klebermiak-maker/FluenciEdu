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
  arquivado?: boolean;
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
  codigo_inep?: string;
  arquivado?: boolean;
  created_at: string;
  updated_at?: string;
}

export type AssessmentStatus = 'pendente' | 'em_andamento' | 'concluida' | 'analisada';
export type ReadingMaterialType = 'palavras' | 'pseudopalavras' | 'texto_curto';
export type AssessmentMode = 'livre' | '60_segundos';
export type AssessmentAudioStorageStatus = 'salvo' | 'pendente_upload' | 'falha';

export type WordMarkingType = 'correta' | 'substituida' | 'omitida' | 'incorreta' | 'pendente';
export type ComplementaryOccurrence = 'autocorrecao' | 'repeticao' | 'insercao';
export type ProsodyScore = 0 | 1 | 2 | 3; // 0 = Não avaliado, 1 = Apoio frequente, 2 = Em desenvolvimento, 3 = Consistente
export type CorrectionStatus = 'nao_avaliada' | 'em_correcao' | 'revisada';

export interface WordEvaluation {
  id: string; // unique per word instance
  index: number;
  palavra_original: string;
  pontuacao_anexa?: string;
  status: WordMarkingType;
  palavra_lida?: string;
  ocorrencias: ComplementaryOccurrence[];
  nao_alcancada?: boolean;
}

export interface ProsodyRubric {
  pontuacao_pausas: ProsodyScore;
  entonacao: ProsodyScore;
  ritmo_continuidade: ProsodyScore;
  agrupamento_sentido: ProsodyScore;
  comentarios?: string;
}

export interface EvaluationDetails {
  id: string;
  assessment_id: string;
  estado_correcao: CorrectionStatus;
  protocolo_versao: string;
  segmentacao_versao: string;
  tempo_inicio_segundos: number;
  tempo_fim_segundos: number;
  tempo_avaliado_segundos: number;
  ultima_palavra_alcancada_index: number;
  palavras_marcadas: WordEvaluation[];
  total_palavras_trecho: number; // N
  total_corretas: number; // C
  total_erros: number; // Substituídas + Omitidas + Incorretas
  total_substituicoes: number;
  total_omissoes: number;
  total_incorretas: number;
  total_autocorrecoes: number;
  total_repeticoes: number;
  total_insercoes: number;
  pcpm: number; // (C * 60) / T
  precisao_percentual: number; // (C / N) * 100
  rubrica_prosodia?: ProsodyRubric;
  observacoes_professor?: string;
  encaminhamentos_pedagogicos?: string;
  sugestao_transcricao_ia?: string;
  professor_revisor_id: string;
  professor_revisor_nome: string;
  data_revisao?: string;
  created_at: string;
  updated_at: string;
}

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
  avaliacao_detalhes?: EvaluationDetails;
  aplicacao_id?: string | null;
  tentativa_numero?: number; // 1, 2, 3...
  is_tentativa_selecionada?: boolean;
  created_at: string;
  updated_at?: string;
}

export type ApplicationStudentStatus = 'sem_gravacao' | 'gravacao_salva' | 'em_correcao' | 'revisada' | 'ausente';
export type ReadingApplicationStatus = 'em_andamento' | 'concluida' | 'arquivada';

export interface ReadingApplication {
  id: string;
  titulo: string; // ex: "Diagnóstico 1º Bimestre - 2º Ano A"
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
  alunos_ids: string[]; // Participantes selecionados
  alunos_ausentes: string[]; // Alunos marcados como ausentes nesta aplicação
  selected_tentativa_por_aluno?: Record<string, string>; // aluno_id -> assessment_id
  status: ReadingApplicationStatus;
  data_conclusao?: string;
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
  codigo_inep?: string;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

export type NavigationPage = 
  | 'dashboard'
  | 'applications'
  | 'schools'
  | 'classes'
  | 'students'
  | 'materials'
  | 'import'
  | 'assessments'
  | 'reports'
  | 'guide'
  | 'profile';
