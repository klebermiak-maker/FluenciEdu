# FluenciEdu Itaúba - MT — Avaliação de Fluência Leitora (Fase 1)

Sistema de gestão e avaliação de fluência leitora para a Rede Municipal de Ensino de **Itaúba - MT** (estudantes dos anos iniciais do Ensino Fundamental - 1º ao 5º ano), sob coordenação da Secretaria Municipal de Educação e Cultura (SEMEC) e alinhado às diretrizes da BNCC e avaliações diagnósticas (CAEd / MEC).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Arquitetura:** Componentes modulares, Context API, Hooks customizados
- **Navegação & Layout:** Sidebar lateral responsiva com gaveta mobile (drawer) e topbar adaptável
- **PWA:** Manifest (`manifest.json`), Service Worker (`sw.js`), ícones SVG e meta-tags
- **Backend / Persistência:** Supabase (PostgreSQL, Supabase Auth, Row Level Security e Supabase Storage) + Camada de persistência local para testes rápidos imediatos
- **Validações:** Validação de formulários, detecção de duplicidades por matrícula e parser de arquivos CSV

---

## 🚀 Como Executar e Configurar

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` com base no `.env.example`:
```env
# Conexão com o Supabase (Opcional para testes - o sistema possui fallback local persistente)
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-anon-key-aqui"
```

### 3. Execução do Banco de Dados no Supabase
1. Acesse o **SQL Editor** no painel do seu projeto Supabase.
2. Copie e cole o conteúdo do arquivo `supabase/schema.sql`.
3. Execute o script. Ele criará automaticamente:
   - Tabelas: `schools`, `profiles`, `classes`, `students`, `assessments`
   - Chaves estrangeiras, índices e restrições de integridade
   - Triggers para atualização automática de `updated_at` e criação de perfil pós-cadastro no `auth.users`
   - Políticas completas de Row Level Security (RLS)
   - Bucket no Supabase Storage: `audio-recordings` para as gravações das próximas fases

### 4. Rodando em Desenvolvimento
```bash
npm run dev
```
O aplicativo iniciará na porta padrão `3000`.

---

## 📋 Checklist de Funcionalidades — FASE 1 & FASE 2

| Módulo / Requisito | Status | Observações |
|---|:---:|---|
| **1. Autenticação** | ✅ Concluído | Login, Cadastro, Recuperação de senha, Logout, Persistência e Proteção de Rotas. |
| **2. Perfil do Usuário** | ✅ Concluído | Edição de dados, vínculo com escola, troca de função e alteração de senha. |
| **3. Cadastro de Escolas** | ✅ Concluído | CRUD completo de escolas municipais de Itaúba - MT com modais de confirmação. |
| **4. Cadastro de Turmas** | ✅ Concluído | CRUD completo com vínculo por escola e ano letivo. |
| **5. Cadastro de Alunos** | ✅ Concluído | CRUD completo, busca por nome/matrícula, filtros e ordenação alfabética. |
| **6. Importação via CSV** | ✅ Concluído | Upload com drag & drop, download de modelo, validação de duplicidade e prévia. |
| **7. Exportação em PDF** | ✅ Concluído | Botão "Exportar Relatório" em PDF formatado com dados de Itaúba - MT (SEMEC). |
| **8. Materiais de Leitura (Fase 2)** | ✅ Concluído | CRUD de listas de palavras, pseudopalavras e textos curtos com exemplos práticos. |
| **9. Gravação Real com Microfone (Fase 2)** | ✅ Concluído | Captura via Web Audio API e MediaRecorder com teste visual de volume antes de iniciar. |
| **10. Cronômetro de Leitura (Fase 2)** | ✅ Concluído | Modalidade Livre e 60 Segundos (com encerramento automático e tempo real decorrido). |
| **11. Tela de Leitura & Fullscreen (Fase 2)** | ✅ Concluído | Letras grandes com controle de fonte (A- / A+), sem interrupções sonoras. |
| **12. Armazenamento e Histórico (Fase 2)** | ✅ Concluído | Persistência em nuvem (Firestore / Storage) e IndexedDB local com fuso de Itaúba (America/Cuiaba). |

---

## 🔮 Próximas Fases Planejadas

- **FASE 3 — Análise de IA & Diagnósticos Pedagógicos:**
  - Transcrição fonética e textual automatizada da leitura gravada
  - Contagem de Palavras Lidas Por Minuto (PPM / PCPM)
  - Identificação de hesitações, omissões e substituições de palavras
  - Gráficos de evolução por turma e escola para a SEMEC Itaúba - MT
  - Fichas diagnósticas individuais de leitura para reuniões pedagógicas e conselhos de classe
