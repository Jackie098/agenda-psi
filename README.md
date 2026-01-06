# Agenda Psi

Sistema de gerenciamento de créditos e consultas psicológicas.

## Stack Técnica

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: ShadCN/UI, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (Auth.js)
- **Validation**: Zod
- **Forms**: React Hook Form

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar PostgreSQL

**Opção A: Usando Docker (Recomendado)**

```bash
docker-compose up -d
```

**Opção B: PostgreSQL Local**

Certifique-se de ter o PostgreSQL instalado e rodando. Crie o banco de dados:

```sql
CREATE DATABASE agenda_psi;
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure suas variáveis:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/agenda_psi?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"
```

### 4. Executar migrations do Prisma

```bash
npx prisma migrate dev --name init
```

### 5. Popular banco de dados com dados de exemplo

```bash
npm run db:seed
```

Dados de exemplo criados:
- **Paciente**: paciente@example.com / 11999999999
- **Psicólogo**: psicologo@example.com / 11988888888
- Empresas: Unimed, Amil, Bradesco Saúde, SulAmérica
- 1 guia ativa com 8 créditos (3 usados)
- 3 registros faciais
- 2 sessões registradas
- 1 vínculo aceito entre paciente e psicólogo

### 6. Executar o projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
agenda-psi/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboards (paciente e psicólogo)
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx           # Página inicial
├── components/            # Componentes React
│   └── ui/               # Componentes ShadCN
├── lib/                   # Utilitários
│   ├── prisma.ts         # Cliente Prisma
│   └── utils.ts          # Funções auxiliares
├── prisma/               # Schema e migrations
│   └── schema.prisma     # Schema do banco
└── public/               # Arquivos estáticos
```

## Regras de Negócio

### Sistema de Créditos

- **Facial → Guia → Saldo**: Bater facial consome 1 crédito da guia e adiciona 1 ao saldo
- **Consulta → Saldo**: Subtrair do saldo (1 para 30min, 2 para 50min)
- **Saldo negativo**: Permitido sem limite
- **Seleção de guia**: 
  - Automática (FIFO - First-In-First-Out) quando há apenas uma guia ativa
  - Manual quando há múltiplas guias ativas (padrão: mais antiga)
- **Histórico de faciais**: Registro completo com data, hora e guia utilizada

### Vínculos Paciente-Psicólogo

- Solicitação pode ser feita por **email ou WhatsApp** de ambos os lados
- Requer aceitação da outra parte
- **Aceitação automática** quando há solicitações mútuas
- **Bloqueio temporário** de 7 dias após rejeição
- Validações contra duplicatas e auto-vinculação

### Referências de Psicólogos

- Paciente pode criar referências mesmo sem vínculo estabelecido
- Referências podem ser **vinculadas a psicólogos reais** após estabelecer vínculo
- Sessões passadas são automaticamente atualizadas ao vincular
- Um psicólogo real pode estar vinculado a apenas **uma referência por paciente**

### Histórico de Atividades

- **Timeline Unificada**: Faciais, consultas e eventos de guias em uma única visualização
- **Filtros Avançados**: Por data (range) e tipo de atividade
- **Eventos Automáticos**: Registro de criação, expiração e encerramento de guias
- **Ordenação**: Cronológica decrescente (mais recente primeiro)
- **Detalhes Completos**: Informações específicas para cada tipo de atividade

### Gestão de Guias

- **Edição de Data**: Alterar data de validade (qualquer data permitida, inclusive passado)
- **Encerramento Manual**: Encerrar guia antecipadamente (créditos restantes são perdidos)
- **Exclusão**: Remover guia apenas se não tiver faciais registradas
- **Validação Automática**: Status atualizado automaticamente ao listar guias
- **Eventos Registrados**: Todas as ações geram eventos no histórico de atividades

### Restrições

- Aviso se mais de 1 facial por dia (não bloqueia)
- Guias têm data de validade obrigatória
- Múltiplas guias ativas simultâneas permitidas
- Paciente ou psicólogo podem registrar consultas (sem aprovação)
- Psicólogo acessa apenas dados de pacientes vinculados

## Funcionalidades de UX

### Persistência de Abas
- Aba selecionada persiste após recarregamento (F5)
- URLs compartilháveis: `/dashboard/patient?tab=guides`
- Compatível com navegação do navegador (voltar/avançar)
- Sem necessidade de cookies ou localStorage

## Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa linter
- `npx prisma studio` - Abre interface visual do banco

## Endpoints da API

### Pacientes

- `POST /api/facials` - Registrar facial (com seleção opcional de guia)
- `GET /api/facials` - Listar histórico de faciais
- `POST /api/sessions` - Registrar consulta
- `GET /api/sessions` - Listar consultas
- `GET /api/activities` - Listar histórico consolidado de atividades (com filtros)
- `GET /api/guides` - Listar guias
- `POST /api/guides` - Criar nova guia
- `PATCH /api/guides/:id` - Editar guia (data de validade ou encerrar)
- `DELETE /api/guides/:id` - Excluir guia (apenas se sem faciais)
- `GET /api/balance` - Consultar saldo
- `POST /api/references` - Criar referência de psicólogo
- `GET /api/references` - Listar referências
- `PUT /api/references/:id/link` - Vincular referência a psicólogo real
- `DELETE /api/references/:id/link` - Desvincular referência

### Psicólogos

- `GET /api/psychologists/guide/:number` - Buscar guia por número
- `GET /api/psychologists/patient?email=` - Buscar paciente
- `POST /api/sessions` - Registrar consulta de paciente
- `GET /api/psychologists/patients` - Listar pacientes vinculados

### Vínculos (Ambos)

- `POST /api/links/request` - Solicitar vínculo por email/WhatsApp
- `GET /api/links` - Listar vínculos
- `PUT /api/links/:id` - Aceitar/rejeitar vínculo
- `DELETE /api/links/:id` - Remover vínculo

