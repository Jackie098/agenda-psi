# Edição e Exclusão de Guias

## Objetivo

Permitir que pacientes tenham controle total sobre suas guias, incluindo a capacidade de corrigir datas de validade e excluir guias cadastradas incorretamente.

## Funcionalidades

### 1. Edição de Guias

#### Alterar Data de Validade

Pacientes podem atualizar a data de validade de qualquer guia.

**Casos de Uso:**
- Corrigir erro ao cadastrar data
- Estender validade após negociação com empresa
- Ajustar data para passado (casos específicos de correção)

**Regras:**
- Qualquer data pode ser definida (inclusive no passado)
- **Reativação automática**: Se a guia estiver expirada, ainda tiver créditos disponíveis e a nova data for futura, o status volta automaticamente para ACTIVE
- Guias completas (sem créditos) permanecem completas mesmo com data futura
- Validação de expiração ocorre também no próximo GET de guias

**Exemplo 1 - Guia com créditos:**
```
Guia expirada em: 01/12/2025
Créditos: 3/8 (5 disponíveis)
Nova data definida: 31/03/2026 (futura)
Resultado: Status muda IMEDIATAMENTE para ACTIVE ✅
```

**Exemplo 2 - Guia sem créditos:**
```
Guia completa em: 01/12/2025
Créditos: 8/8 (0 disponíveis)
Nova data definida: 31/03/2026 (futura)
Resultado: Status permanece COMPLETED (sem créditos) ❌
```

**Exemplo 3 - Data no passado:**
```
Guia expirada em: 01/12/2025
Créditos: 3/8 (5 disponíveis)
Nova data definida: 01/11/2025 (passado)
Resultado: Status permanece EXPIRED (data no passado) ❌
```

#### Encerrar Guia Antecipadamente

Pacientes podem encerrar manualmente uma guia ativa.

**Casos de Uso:**
- Não vai mais usar a guia
- Prefere não acumular créditos daquela empresa
- Limpeza de guias antigas

**Regras:**
- Apenas guias com status ACTIVE podem ser encerradas
- Créditos restantes são **perdidos** (não transferidos para saldo)
- Confirmação obrigatória antes de encerrar
- Evento `GUIDE_CLOSED` é registrado no histórico de atividades

**Alerta Exibido:**
```
"Ao encerrar a guia antecipadamente, os X créditos restantes 
serão perdidos. Esta ação não pode ser desfeita."
```

### 2. Exclusão de Guias

Pacientes podem excluir guias que foram cadastradas por engano.

**Regras de Validação:**
- ✅ **Permitido**: Guia sem nenhuma facial registrada
- ❌ **Bloqueado**: Guia com 1 ou mais faciais registradas
- Verificação: `guide.facialRecords.length === 0`

**Motivo da Restrição:**
Guias com faciais não podem ser excluídas para manter a integridade do histórico. Faciais são registros permanentes que referenciam a guia utilizada.

**Mensagem de Erro:**
```
"Não é possível excluir guia com faciais registradas"
```

**Alternativa:**
Se uma guia tem faciais mas não será mais usada, o paciente pode **encerrá-la antecipadamente** ao invés de excluí-la.

## Interface do Usuário

### Lista de Guias

Cada guia exibe dois botões de ação:

```
┌─────────────────────────────────────────────┐
│ Guia #12345 • Unimed          [✏️] [🗑️]    │
│ Status: ATIVA                                │
│ Créditos: 5/8 • Validade: 31/12/2026        │
│ 3 faciais registradas                        │
└─────────────────────────────────────────────┘
```

- **✏️ Botão Editar**: Sempre visível
- **🗑️ Botão Excluir**: Visível apenas se `facialRecords.length === 0`

### Dialog de Edição

Modal que abre ao clicar em "Editar":

**Seção: Informações Atuais**
- Número da guia
- Empresa
- Créditos utilizados/total
- Data de validade atual

**Seção: Editar Data**
- Date picker para nova data
- Texto: "Você pode selecionar qualquer data (inclusive no passado)"

**Seção: Encerramento (se aplicável)**
- Botão vermelho: "Encerrar Guia Antecipadamente"
- Texto: "X créditos restantes"
- Exibido apenas se status = ACTIVE e remainingCredits > 0

**Botões de Ação**
- "Cancelar" (outline)
- "Salvar Alterações" (primary, desabilitado até selecionar nova data)

### Dialog de Confirmação de Encerramento

AlertDialog que abre ao clicar em "Encerrar Guia":

```
┌─────────────────────────────────────────┐
│ Tem certeza?                             │
│                                          │
│ Ao encerrar a guia antecipadamente, os  │
│ 5 créditos restantes serão perdidos.    │
│ Esta ação não pode ser desfeita.        │
│                                          │
│              [Cancelar] [Sim, Encerrar] │
└─────────────────────────────────────────┘
```

### Dialog de Confirmação de Exclusão

AlertDialog que abre ao clicar em "Excluir":

```
┌─────────────────────────────────────────┐
│ Confirmar Exclusão                       │
│                                          │
│ Tem certeza que deseja excluir a guia   │
│ #12345?                                  │
│ Esta ação não pode ser desfeita.        │
│                                          │
│                [Cancelar] [Sim, Excluir] │
└─────────────────────────────────────────┘
```

## API Endpoints

### PATCH /api/guides/[id]

Atualiza uma guia existente.

#### Body Parameters

```typescript
{
  expirationDate?: string;  // ISO 8601 format
  status?: 'EXPIRED';       // Para encerrar manualmente
}
```

#### Validações
- Guia deve existir
- Guia deve pertencer ao paciente autenticado
- Se `status = EXPIRED`, cria evento GUIDE_CLOSED

#### Exemplos

**Alterar data de validade:**
```json
PATCH /api/guides/guide_123
{
  "expirationDate": "2026-03-31T00:00:00.000Z"
}
```

**Encerrar guia:**
```json
PATCH /api/guides/guide_123
{
  "status": "EXPIRED"
}
```

**Alterar data e encerrar (apenas uma ação por vez):**
```json
// Fazer em duas requisições separadas
```

#### Resposta de Sucesso

```json
{
  "message": "Guia atualizada com sucesso",
  "guide": {
    "id": "guide_123",
    "number": "12345",
    "expirationDate": "2026-03-31T00:00:00.000Z",
    "status": "EXPIRED",
    // ... demais campos
  }
}
```

#### Respostas de Erro

**404 - Guia não encontrada:**
```json
{ "error": "Guia não encontrada" }
```

**403 - Guia não pertence ao usuário:**
```json
{ "error": "Esta guia não pertence a você" }
```

### DELETE /api/guides/[id]

Exclui uma guia permanentemente.

#### Validações
- Guia deve existir
- Guia deve pertencer ao paciente autenticado
- Guia NÃO pode ter faciais registradas

#### Exemplo

```
DELETE /api/guides/guide_123
```

#### Resposta de Sucesso

```json
{
  "message": "Guia excluída com sucesso"
}
```

#### Respostas de Erro

**404 - Guia não encontrada:**
```json
{ "error": "Guia não encontrada" }
```

**403 - Guia não pertence ao usuário:**
```json
{ "error": "Esta guia não pertence a você" }
```

**400 - Guia tem faciais:**
```json
{ "error": "Não é possível excluir guia com faciais registradas" }
```

## Componentes Frontend

### EditGuideDialog

Componente localizado em `components/patient/edit-guide-dialog.tsx`.

**Props:**
```typescript
interface EditGuideDialogProps {
  guide: Guide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}
```

**Features:**
- Date picker para nova data de validade
- Botão de encerramento com confirmação
- Validação de campos
- Estados de loading
- Toasts de feedback

### GuidesList (Atualizado)

Componente atualizado em `components/patient/guides-list.tsx`.

**Novas Features:**
- Botão "Editar" em cada guia
- Botão "Excluir" condicional (apenas se sem faciais)
- Integração com EditGuideDialog
- AlertDialog para confirmação de exclusão
- Handlers para edição e exclusão

## Registro de Eventos

### Encerramento Manual

Quando uma guia é encerrada via PATCH com `status: "EXPIRED"`, o sistema:

1. Atualiza o status da guia para EXPIRED
2. Cria um ActivityLog:

```typescript
{
  type: "GUIDE_CLOSED",
  description: "Guia 12345 encerrada manualmente",
  metadata: {
    guideNumber: "12345",
    company: "Unimed",
    remainingCredits: 5
  },
  occurredAt: new Date(),
  patientId: "patient_id"
}
```

3. Este evento aparece no Histórico de Atividades

### Exclusão

Exclusão de guia **não** gera evento no ActivityLog, pois:
- Apenas guias sem faciais podem ser excluídas
- São guias que nunca foram efetivamente utilizadas
- Não há impacto no histórico do paciente

## Fluxo de Uso

### Cenário 1: Corrigir Data Errada

1. Paciente cadastrou guia com data errada
2. Abre lista de guias
3. Clica em "Editar" na guia incorreta
4. Seleciona nova data no date picker
5. Clica em "Salvar Alterações"
6. Sistema atualiza e exibe toast de sucesso
7. Lista de guias recarrega com data corrigida

### Cenário 1.1: Reativar Guia Expirada com Créditos

1. Paciente tem guia EXPIRADA em 01/12/2025
2. Guia ainda tem 5 créditos disponíveis (3/8 usados)
3. Clica em "Editar" na guia expirada
4. Seleciona data futura: 31/03/2026
5. Clica em "Salvar Alterações"
6. Sistema:
   - Atualiza data para 31/03/2026
   - **Muda status de EXPIRED para ACTIVE automaticamente**
   - Exibe toast: "Guia atualizada com sucesso"
7. Lista recarrega mostrando guia ATIVA com badge verde
8. Paciente pode usar os 5 créditos restantes

### Cenário 2: Excluir Guia Cadastrada por Engano

1. Paciente cadastrou guia duplicada (sem faciais)
2. Abre lista de guias
3. Clica em "Excluir" na guia incorreta
4. Confirma exclusão no dialog
5. Sistema exclui e exibe toast de sucesso
6. Guia desaparece da lista

### Cenário 3: Tentar Excluir Guia com Faciais

1. Paciente tenta excluir guia que já usou
2. Abre lista de guias
3. **Botão "Excluir" não aparece** (preventivo)
4. Se tentar via API diretamente: erro 400

### Cenário 4: Encerrar Guia que Não Vai Mais Usar

1. Paciente tem guia com 5 créditos restantes
2. Decide não usar mais (mudou de empresa)
3. Abre lista de guias
4. Clica em "Editar"
5. Clica em "Encerrar Guia Antecipadamente"
6. Lê alerta: "5 créditos serão perdidos"
7. Confirma encerramento
8. Sistema:
   - Muda status para EXPIRED
   - Cria evento GUIDE_CLOSED
   - Exibe toast de sucesso
9. Lista recarrega com guia expirada
10. Evento aparece no Histórico de Atividades

## Considerações de Design

### Por que Créditos São Perdidos?

Ao encerrar uma guia antecipadamente, os créditos restantes não são transferidos para o saldo porque:

1. **Integridade do Sistema**: Créditos vêm de faciais via guias específicas
2. **Rastreabilidade**: Transferir quebraria o vínculo guia → facial → saldo
3. **Simplificidade**: Evita lógica complexa de ajustes retroativos
4. **Decisão Consciente**: Paciente é alertado e decide conscientemente

### Por que Não Permitir Exclusão com Faciais?

1. **Integridade Referencial**: Faciais referenciam a guia utilizada
2. **Auditoria**: Histórico deve ser permanente e rastreável
3. **Cascade Delete**: Excluir guia excluiria todas as faciais associadas
4. **Solução Alternativa**: Encerramento manual preserva histórico

### Por que Permitir Datas no Passado?

1. **Correções**: Erros de cadastro podem ocorrer
2. **Flexibilidade**: Casos especiais de ajuste
3. **Controle**: Paciente tem autonomia sobre seus dados
4. **Sem Efeito Retroativo**: Mudar data não altera faciais já registradas

### Por que Reativar Automaticamente?

1. **UX Intuitiva**: Usuário espera que guia volte a funcionar ao estender validade
2. **Sem Créditos = Sem Reativação**: Guias completas não podem ser usadas de qualquer forma
3. **Data Passada = Expirada**: Lógica consistente com validação automática
4. **Sem Necessidade de Duas Ações**: Não precisa editar data + manualmente mudar status

## Validações e Regras

### Edição de Data
- ✅ Qualquer data (passado, presente, futuro)
- ✅ Reativação automática se: expirada + com créditos + data futura
- ✅ Validação de expiração também na próxima consulta
- ❌ Não aceita datas inválidas (formato)
- ❌ Guias completas não são reativadas (mesmo com data futura)

### Encerramento Manual
- ✅ Apenas guias ACTIVE
- ✅ Requer confirmação explícita
- ✅ Cria evento no histórico
- ❌ Não transfere créditos restantes
- ❌ Não pode ser desfeito

### Exclusão
- ✅ Qualquer status de guia
- ✅ Requer confirmação explícita
- ❌ Bloqueada se houver faciais
- ❌ Não cria evento no histórico
- ❌ Não pode ser desfeita

## Testes Recomendados

1. **Editar data válida**: Deve atualizar com sucesso
2. **Editar data no passado**: Deve aceitar e manter status
3. **Editar data futura em guia expirada com créditos**: Deve reativar para ACTIVE
4. **Editar data futura em guia completa**: Status deve permanecer COMPLETED
5. **Encerrar guia ativa**: Deve criar evento GUIDE_CLOSED
6. **Tentar encerrar guia completa**: Botão não deve aparecer
7. **Excluir guia sem faciais**: Deve excluir com sucesso
8. **Tentar excluir guia com faciais**: Deve mostrar erro
9. **Botão excluir não aparece**: Quando há faciais
10. **Confirmação de encerramento**: Deve mostrar créditos restantes
11. **Confirmação de exclusão**: Deve mostrar número da guia
12. **Atualização de lista**: Deve recarregar após edição/exclusão
13. **Reativação visual**: Status badge deve mudar de vermelho para verde

---

**Implementado em:** 2026-01-06  
**Componentes:**
- `app/api/guides/[id]/route.ts`
- `components/patient/edit-guide-dialog.tsx`
- `components/patient/guides-list.tsx` (atualizado)

