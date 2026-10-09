-- ==============================================================================
-- FLUENCIEDU - ESQUEMA DE BANCO DE DADOS POSTGRESQL / SUPABASE (FASE 1)
-- ==============================================================================
-- Este arquivo contém a modelagem completa do banco de dados para a Fase 1 do
-- sistema de avaliação de fluência leitora para os anos iniciais do Ensino Fundamental.
-- Inclui tabelas, chaves estrangeiras, índices, RLS (Row Level Security),
-- trigger de criação de perfil automático e bucket de storage para áudios futuros.

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Escolas (schools)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    municipio VARCHAR(150) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    responsavel VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentários da tabela schools
COMMENT ON TABLE public.schools IS 'Cadastro de escolas públicas ou privadas atendidas pelo programa de fluência.';

-- 3. Tabela de Perfis de Usuários (profiles)
-- Vinculado diretamente a auth.users do Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'professor' CHECK (role IN ('admin', 'gestor', 'professor')),
    escola_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Perfil estendido dos usuários autenticados (professores, gestores e administradores).';

-- 4. Tabela de Turmas (classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    ano_serie VARCHAR(50) NOT NULL, -- Ex: '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'
    turno VARCHAR(50) NOT NULL CHECK (turno IN ('Manhã', 'Tarde', 'Integral', 'Noite')),
    professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    escola_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    ano_letivo INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.classes IS 'Turmas escolares dos anos iniciais do Ensino Fundamental.';

-- 5. Tabela de Alunos (students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    matricula VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    turma_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    escola_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_escola_matricula UNIQUE (escola_id, matricula)
);

COMMENT ON TABLE public.students IS 'Alunos matriculados que realizarão as avaliações de fluência.';

-- 6. Tabela de Avaliações (assessments) - Preparada para as próximas fases
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    escola_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'analisada')),
    audio_path TEXT, -- Caminho do áudio gravado no Supabase Storage
    duracao_segundos NUMERIC(6, 2),
    palavras_por_minuto NUMERIC(6, 2),
    precisao_leitura NUMERIC(5, 2),
    nivel_fluencia VARCHAR(50), -- 'Pré-leitor', 'Leitor Iniciante', 'Leitor Fluente', etc.
    transcricao TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.assessments IS 'Estrutura preparada para as avaliações de leitura com gravação e IA (Fases futuras).';

-- ==============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_escola ON public.profiles(escola_id);
CREATE INDEX IF NOT EXISTS idx_classes_escola ON public.classes(escola_id);
CREATE INDEX IF NOT EXISTS idx_classes_professor ON public.classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_students_turma ON public.students(turma_id);
CREATE INDEX IF NOT EXISTS idx_students_escola ON public.students(escola_id);
CREATE INDEX IF NOT EXISTS idx_students_nome ON public.students(nome);
CREATE INDEX IF NOT EXISTS idx_assessments_student ON public.assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_turma ON public.assessments(turma_id);

-- ==============================================================================
-- TRIGGER PARA ATUALIZAR 'updated_at'
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_schools_updated_at ON public.schools;
CREATE TRIGGER set_schools_updated_at BEFORE UPDATE ON public.schools
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_classes_updated_at ON public.classes;
CREATE TRIGGER set_classes_updated_at BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- TRIGGER PARA SINCRONIZAÇÃO AUTOMÁTICA DE PERFIL (auth.users -> public.profiles)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'professor'),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para Profiles
CREATE POLICY "Usuários autenticados podem ver perfis"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 2. Políticas para Escolas
CREATE POLICY "Usuários autenticados podem visualizar escolas"
    ON public.schools FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem criar escolas"
    ON public.schools FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar escolas"
    ON public.schools FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem excluir escolas"
    ON public.schools FOR DELETE
    TO authenticated
    USING (true);

-- 3. Políticas para Turmas (classes)
CREATE POLICY "Usuários autenticados podem visualizar turmas"
    ON public.classes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem criar turmas"
    ON public.classes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar turmas"
    ON public.classes FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem excluir turmas"
    ON public.classes FOR DELETE
    TO authenticated
    USING (true);

-- 4. Políticas para Alunos (students)
CREATE POLICY "Usuários autenticados podem visualizar alunos"
    ON public.students FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem cadastrar alunos"
    ON public.students FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar alunos"
    ON public.students FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem excluir alunos"
    ON public.students FOR DELETE
    TO authenticated
    USING (true);

-- 5. Políticas para Avaliações (assessments)
CREATE POLICY "Usuários autenticados podem visualizar avaliações"
    ON public.assessments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem criar avaliações"
    ON public.assessments FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ==============================================================================
-- SUPABASE STORAGE - BUCKET DE GRAVAÇÕES DE ÁUDIO (PREPARADO PARA FUTURO)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Política de upload de áudio para usuários autenticados
CREATE POLICY "Permitir upload de áudio de leitura para usuários autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-recordings');

-- Política de leitura de áudio para usuários autenticados
CREATE POLICY "Permitir audição de gravações para usuários autenticados"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-recordings');
