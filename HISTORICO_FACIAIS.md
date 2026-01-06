# Histórico de Faciais

## Objetivo
Permitir que pacientes visualizem um histórico completo de todas as faciais registradas, incluindo data, hora e guia utilizada.

## Funcionalidades

### 1. Visualização do Histórico
- **Localização**: Dashboard do Paciente > Aba "Histórico de Faciais"
- **Informações exibidas**:
  - Data (formato DD/MM/AAAA)
  - Hora (formato HH:MM)
  - Número da guia utilizada
  - Empresa da guia
  - Créditos adicionados (+1 por facial)
- **Ordenação**: Faciais mais recentes aparecem primeiro
- **Contagem**: Badge mostrando total de faciais registradas

### 2. Interface
- **Tabela**: Organização clara com colunas:
  - Data e Hora
  - Guia (número)
  - Empresa
  - Créditos (+1)
- **Estado vazio**: Mensagem motivacional quando não há faciais registradas
- **Design**: Card com título, descrição e tabela responsiva

### 3. Registro Automático
Cada facial registrada automaticamente salva:
```typescript
{
  id: string;           // ID único
  patientId: string;    // ID do paciente
  guideId: string;      // ID da guia utilizada
  recordedAt: DateTime; // Data e hora do registro (automático)
}
```

## Implementação Técnica

### Backend
**API Endpoint**: `GET /api/facials`
- Autenticação: Requer paciente logado
- Retorna: Lista de faciais com dados da guia e empresa
- Ordenação: DESC por `recordedAt`

```typescript
// Exemplo de resposta
[
  {
    id: "facial1",
    recordedAt: "2026-01-06T14:30:00Z",
    guide: {
      number: "12345",
      company: {
        name: "Empresa XYZ"
      }
    }
  }
]
```

### Frontend
**Componente**: `components/patient/facials-history.tsx`
- Busca automática ao montar
- Loading state com skeleton
- Formatação de data/hora em português (pt-BR)
- Badge para contagem total
- Toast notifications para erros

**Integração**:
- Nova aba no dashboard do paciente
- Atualização automática após novo registro (via callback)

## Fluxo de Uso

1. **Paciente registra facial**
   - Seleciona guia (se múltiplas disponíveis)
   - Clica em "Registrar Facial"
   - Sistema registra: data/hora automática + guia escolhida

2. **Visualizar histórico**
   - Acessa aba "Histórico de Faciais"
   - Vê lista completa ordenada por data
   - Identifica qual guia foi usada em cada registro

3. **Benefícios**
   - Transparência no processo
   - Rastreabilidade de créditos
   - Auditoria de registros

## Regras de Negócio

1. **Registro automático**: Data/hora são capturadas no momento do clique
2. **Imutabilidade**: Faciais registradas não podem ser editadas ou deletadas
3. **Persistência**: Mesmo após guia expirar, o histórico permanece
4. **Privacidade**: Cada paciente vê apenas suas próprias faciais

## Exemplos de Uso

### Cenário 1: Múltiplas guias
Um paciente tem 3 guias ativas de empresas diferentes. Ao longo do tempo:
- Semana 1: 5 faciais na guia #12345 (Empresa A)
- Semana 2: 3 faciais na guia #67890 (Empresa B)
- Semana 3: 2 faciais na guia #11111 (Empresa C)

O histórico mostra todos os 10 registros com suas respectivas guias e empresas.

### Cenário 2: Auditoria de créditos
Paciente verifica que tem 15 créditos. Acessa o histórico e confirma:
- 20 faciais registradas (+20 créditos)
- 5 consultas realizadas (-5 créditos)
- Saldo final: 15 créditos ✓

## Futuras Melhorias
- Filtros por período (mês, semana)
- Filtros por guia/empresa
- Exportar histórico (PDF, CSV)
- Gráficos de frequência
- Estatísticas (média por semana, etc.)

