# Histórico Consolidado de Atividades

## Objetivo

Fornecer ao paciente uma visão unificada de todas as suas atividades no sistema, incluindo faciais registradas, consultas realizadas e eventos relacionados a guias (criação, expiração, encerramento).

## Funcionalidades

### 1. Timeline Unificada

O histórico de atividades consolida em uma única interface todas as ações do paciente:

- **Faciais Registradas**: Cada facial aparece com data, hora, guia utilizada, empresa e créditos adicionados (+1).
- **Consultas Realizadas**: Cada consulta mostra data, hora, psicólogo, duração e créditos utilizados (-1 ou -2).
- **Eventos de Guias**:
  - **Guia Criada**: Registro quando uma nova guia é adicionada ao sistema.
  - **Guia Expirada**: Registro automático quando uma guia atinge sua data de validade.
  - **Guia Encerrada**: Registro quando o paciente encerra manualmente uma guia.

### 2. Filtros Avançados

#### Filtro por Data
- **Data Inicial**: Filtra atividades a partir de uma data específica.
- **Data Final**: Filtra atividades até uma data específica.
- **Range de Datas**: Combina data inicial e final para período específico.

#### Filtro por Tipo
- **Todos os tipos**: Exibe todas as atividades (padrão).
- **Faciais**: Apenas registros de faciais.
- **Consultas**: Apenas registros de consultas.
- **Guias Criadas**: Apenas registros de criação de guias.
- **Guias Expiradas**: Apenas registros de expiração automática.
- **Guias Encerradas**: Apenas registros de encerramento manual.

#### Limpar Filtros
Botão dedicado para resetar todos os filtros e voltar à visualização completa.

### 3. Interface Visual

#### Estrutura da Atividade
Cada atividade no timeline exibe:
- **Badge colorido** indicando o tipo
- **Ícone** representativo da ação
- **Data e hora** formatadas em português
- **Descrição** da atividade
- **Detalhes específicos** de acordo com o tipo

#### Cores e Badges
- **Facial**: Badge verde/default - Ação positiva (adiciona créditos)
- **Consulta**: Badge azul/secondary - Ação neutra
- **Guia Criada**: Badge outline - Informativo
- **Guia Expirada/Encerrada**: Badge vermelho/destructive - Ação negativa

### 4. Ordenação

Todas as atividades são exibidas em ordem cronológica decrescente (mais recente primeiro), independente do tipo de atividade.

## Modelo de Dados

### ActivityLog

Novo model criado no Prisma para armazenar eventos de guias:

```prisma
model ActivityLog {
  id          String       @id @default(cuid())
  type        ActivityType
  description String
  metadata    Json?        // Dados específicos do evento
  occurredAt  DateTime
  patientId   String
  createdAt   DateTime     @default(now())

  patient     Patient      @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@index([type])
  @@index([occurredAt])
}

enum ActivityType {
  FACIAL
  SESSION
  GUIDE_EXPIRED
  GUIDE_CLOSED
  GUIDE_CREATED
}
```

### Metadata por Tipo

Cada tipo de atividade armazena informações específicas no campo `metadata`:

#### GUIDE_CREATED
```json
{
  "guideNumber": "12345",
  "company": "Unimed",
  "totalCredits": 8,
  "expirationDate": "2026-12-31T00:00:00.000Z"
}
```

#### GUIDE_EXPIRED
```json
{
  "guideNumber": "12345",
  "company": "Unimed",
  "remainingCredits": 3
}
```

#### GUIDE_CLOSED
```json
{
  "guideNumber": "12345",
  "company": "Unimed",
  "remainingCredits": 5
}
```

## API Endpoints

### GET /api/activities

Retorna todas as atividades do paciente autenticado.

#### Query Parameters
- `startDate`: Data inicial (ISO 8601 format)
- `endDate`: Data final (ISO 8601 format)
- `type`: Tipos de atividade (separados por vírgula)

#### Exemplos

**Todas as atividades:**
```
GET /api/activities
```

**Atividades de janeiro de 2026:**
```
GET /api/activities?startDate=2026-01-01&endDate=2026-01-31
```

**Apenas faciais e consultas:**
```
GET /api/activities?type=FACIAL,SESSION
```

**Guias expiradas nos últimos 30 dias:**
```
GET /api/activities?type=GUIDE_EXPIRED&startDate=2025-12-07
```

#### Resposta

```json
[
  {
    "id": "facial_123",
    "type": "FACIAL",
    "date": "2026-01-06T14:30:00.000Z",
    "description": "Facial registrada",
    "details": {
      "guide": "12345",
      "company": "Unimed",
      "credits": 1
    }
  },
  {
    "id": "session_456",
    "type": "SESSION",
    "date": "2026-01-05T10:00:00.000Z",
    "description": "Consulta realizada",
    "details": {
      "duration": 50,
      "psychologist": "Dr. João Silva",
      "credits": -2
    }
  },
  {
    "id": "log_789",
    "type": "GUIDE_EXPIRED",
    "date": "2026-01-04T23:59:59.000Z",
    "description": "Guia 67890 expirou",
    "details": {
      "guideNumber": "67890",
      "company": "Amil",
      "remainingCredits": 3
    }
  }
]
```

## Componentes Frontend

### ActivityTimeline

Componente principal localizado em `components/patient/activity-timeline.tsx`.

**Funcionalidades:**
- Renderização da timeline de atividades
- Sistema de filtros (data e tipo)
- Formatação de datas em português
- Estados de loading e vazio
- Badges e ícones personalizados por tipo
- Detalhes expansíveis para cada atividade

**Props:** Nenhuma (componente standalone)

## Integração no Dashboard

### Localização
Dashboard do Paciente > Aba "Histórico de Atividades"

### Substituições
As abas anteriores foram consolidadas:
- ❌ Aba "Consultas" (removida)
- ❌ Aba "Histórico de Faciais" (removida)
- ✅ Aba "Histórico de Atividades" (nova - consolida tudo)

### Estrutura Final
1. Histórico de Atividades (default)
2. Guias
3. Psicólogos
4. Referências

## Registro Automático de Eventos

### Criação de Guia
Quando uma nova guia é criada via `POST /api/guides`, um evento `GUIDE_CREATED` é registrado automaticamente no `ActivityLog`.

### Expiração de Guia
Quando o sistema detecta uma guia expirada (durante `GET /api/guides`), além de atualizar o status, registra um evento `GUIDE_EXPIRED` no `ActivityLog`.

### Encerramento Manual
Quando o paciente encerra uma guia manualmente via `PATCH /api/guides/[id]`, um evento `GUIDE_CLOSED` é registrado no `ActivityLog`.

## Benefícios

1. **Visão Unificada**: Todas as ações em um só lugar
2. **Rastreabilidade**: Histórico completo e permanente
3. **Transparência**: Paciente vê exatamente o que aconteceu e quando
4. **Auditoria**: Facilita identificação de inconsistências
5. **UX Aprimorada**: Navegação simplificada com filtros poderosos
6. **Performance**: Filtros server-side reduzem tráfego de dados
7. **Escalabilidade**: Design preparado para novos tipos de atividades

## Exemplos de Uso

### Cenário 1: Verificar Atividades do Mês
1. Abrir "Histórico de Atividades"
2. Definir data inicial: 01/01/2026
3. Definir data final: 31/01/2026
4. Ver todas as atividades do período

### Cenário 2: Rastrear Faciais Específicas
1. Abrir "Histórico de Atividades"
2. Selecionar filtro tipo: "Faciais"
3. Ver apenas registros de faciais com guia e empresa

### Cenário 3: Auditar Guias Expiradas
1. Abrir "Histórico de Atividades"
2. Selecionar filtro tipo: "Guias Expiradas"
3. Ver quais guias expiraram e quantos créditos restavam

### Cenário 4: Timeline Completa
1. Abrir "Histórico de Atividades"
2. Não aplicar filtros
3. Ver sequência cronológica de todas as ações realizadas

## Considerações Técnicas

### Performance
- Índices no banco: `patientId`, `type`, `occurredAt`
- Filtros aplicados no servidor (reduz payload)
- Paginação pode ser implementada futuramente se necessário

### Consistência
- Eventos registrados em transações junto com ações principais
- Garantia de que cada ação tem seu respectivo log

### Extensibilidade
- Fácil adicionar novos tipos de atividade
- Metadata JSON permite diferentes estruturas de dados
- Sistema preparado para notificações futuras

---

**Implementado em:** 2026-01-06  
**Componentes:**
- `app/api/activities/route.ts`
- `components/patient/activity-timeline.tsx`
- `prisma/schema.prisma` (ActivityLog model)

