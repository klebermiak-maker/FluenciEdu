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

## 📋 Checklist de Funcionalidades — FASE 1

| Módulo / Requisito | Status | Observações |
|---|:---:|---|
| **1. Autenticação** | ✅ Concluído | Login, Cadastro, Recuperação de senha, Logout, Persistência e Proteção de Rotas. Botões de acesso rápido demo (Professor, Gestor, Admin). |
| **2. Perfil do Usuário** | ✅ Concluído | Edição de nome, e-mail institucional, vínculo com escola, troca de função (Admin, Gestor, Professor) e alteração de senha. |
| **3. Cadastro de Escolas** | ✅ Concluído | CRUD completo (Criar, Editar, Visualizar com turmas vinculadas, Excluir com modal de confirmação). |
| **4. Cadastro de Turmas** | ✅ Concluído | CRUD completo (Nome, Ano/Série, Turno, Ano Letivo, Escola vinculada, contagem de alunos e modal de confirmação de exclusão). |
| **5. Cadastro de Alunos** | ✅ Concluído | CRUD completo, pesquisa por nome/matrícula, filtros combinados por escola e turma, ordenação alfabética (A-Z, Z-A). |
| **6. Importação de Alunos via CSV** | ✅ Concluído | Upload com drag & drop, download de modelo `.csv`, validação rigorosa campo por campo, prevenção de duplicação, prévia com resumo de erros e confirmação/cancelamento. Estrutura preparada para arquivos Excel. |
| **7. Dashboard Principal** | ✅ Concluído | 4 cards métricos (Escolas, Turmas, Alunos, Avaliações), resumo das turmas com alunos matriculados e área preparada com métricas de fluência (PPM, precisão, níveis leitor). |
| **8. Menu e Navegação Responsiva** | ✅ Concluído | Sidebar lateral responsiva com gaveta mobile, badges dos perfis, status do banco de dados e navegação completa. |
| **9. Banco de Dados PostgreSQL & Supabase** | ✅ Concluído | Arquivo `supabase/schema.sql` com modelagem das tabelas `profiles`, `schools`, `classes`, `students`, `assessments`, triggers e bucket de áudio. |
| **10. Segurança & Validação** | ✅ Concluído | Políticas RLS, modais de confirmação destrutiva, validação de campos e toasts acessíveis de feedback. |
| **11. Design & Acessibilidade** | ✅ Concluído | Layout responsivo em tons educacionais (azul e esmeralda), contraste adequado, navegação por teclado e sem quebra em celulares, tablets ou desktops. |
| **12. Progressive Web App (PWA)** | ✅ Concluído | Manifesto web, ícones, meta tags iOS/Android e service worker para cache offline. |

---

## 🔮 Próximas Fases Planejadas

- **FASE 2 — Gravação de Áudio & IA:**
  - Cronômetro de leitura (60s)
  - Captura e streaming de áudio via microfone (Web Audio API)
  - Upload para o bucket `audio-recordings` no Supabase Storage
  - Transcrição e contagem de Palavras Corretas Por Minuto (PCPM) com IA
  - Avaliação de precisão e hesitações
- **FASE 3 — Relatórios & Diagnósticos:**
  - Gráficos de evolução por turma e escola
  - Painel analítico para Secretarias Municipais de Educação
  - Fichas diagnósticas individuais de leitura para reuniões pedagógicas
