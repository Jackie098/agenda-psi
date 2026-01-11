# Persistência de Abas no Dashboard

## Objetivo

Manter a aba selecionada no dashboard do paciente e do psicólogo após recarregamento da página (F5), proporcionando melhor experiência de navegação.

## Implementação

### Técnica Utilizada: URL Query Parameters

A persistência é implementada usando query parameters na URL (`?tab=nome_da_aba`), que oferece vantagens:

1. **Persistência**: Mantém estado após F5
2. **Compartilhamento**: URLs podem ser compartilhadas com aba específica
3. **Navegação**: Funciona com botões voltar/avançar do navegador
4. **Sem cookies**: Não usa armazenamento local

## Dashboard do Paciente

### Abas Disponíveis

- `activities` - Histórico de Atividades (padrão)
- `guides` - Guias
- `psychologists` - Psicólogos
- `references` - Referências

### URLs de Exemplo

```
/dashboard/patient                        → Histórico de Atividades
/dashboard/patient?tab=activities         → Histórico de Atividades
/dashboard/patient?tab=guides             → Guias
/dashboard/patient?tab=psychologists      → Psicólogos
/dashboard/patient?tab=references         → Referências
```

### Implementação Técnica

**Arquivo**: `app/dashboard/patient/page.tsx`

```typescript
import { useSearchParams } from "next/navigation";

export default function PatientDashboard() {
  const searchParams = useSearchParams();
  
  // Ler a aba da URL ou usar 'activities' como padrão
  const currentTab = searchParams.get("tab") || "activities";

  const handleTabChange = (value: string) => {
    // Atualizar a URL com o parâmetro tab
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      {/* ... */}
    </Tabs>
  );
}
```

## Dashboard do Psicólogo

### Abas Disponíveis

- `patients` - Meus Pacientes (padrão)
- `search` - Buscar Paciente
- `guide` - Buscar Guia
- `links` - Solicitações

### URLs de Exemplo

```
/dashboard/psychologist                   → Meus Pacientes
/dashboard/psychologist?tab=patients      → Meus Pacientes
/dashboard/psychologist?tab=search        → Buscar Paciente
/dashboard/psychologist?tab=guide         → Buscar Guia
/dashboard/psychologist?tab=links         → Solicitações
```

### Implementação Técnica

**Arquivo**: `app/dashboard/psychologist/page.tsx`

```typescript
import { useSearchParams } from "next/navigation";

export default function PsychologistDashboard() {
  const searchParams = useSearchParams();
  
  // Ler a aba da URL ou usar 'patients' como padrão
  const currentTab = searchParams.get("tab") || "patients";

  const handleTabChange = (value: string) => {
    // Atualizar a URL com o parâmetro tab
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      {/* ... */}
    </Tabs>
  );
}
```

## Comportamento

### Fluxo de Navegação

1. **Primeira visita**: Abre aba padrão
   - Paciente: "Histórico de Atividades"
   - Psicólogo: "Meus Pacientes"

2. **Troca de aba**: Usuário clica em outra aba
   - URL atualiza para `?tab=nome_da_aba`
   - Sem scroll da página
   - Aba selecionada muda

3. **Recarregamento (F5)**: Página recarrega
   - Lê parâmetro `tab` da URL
   - Abre na mesma aba que estava
   - Estado preservado

4. **Navegação voltar/avançar**: Botões do navegador
   - Histórico do navegador inclui mudanças de aba
   - Voltar/avançar muda entre abas visitadas
   - Funciona como esperado

### Opção `scroll: false`

```typescript
router.push(`?${params.toString()}`, { scroll: false });
```

Esta opção garante que a página **não role para o topo** ao trocar de aba, mantendo a posição atual do scroll.

## Exemplos de Uso

### Cenário 1: Trabalho Contínuo

1. Paciente está na aba "Guias"
2. Edita uma guia
3. Acidentalmente pressiona F5
4. **Resultado**: Permanece na aba "Guias" ✅
5. Pode continuar editando sem perder contexto

### Cenário 2: Compartilhamento de Link

1. Psicólogo está vendo "Buscar Guia"
2. URL: `/dashboard/psychologist?tab=guide`
3. Copia e envia URL para colega
4. Colega abre o link
5. **Resultado**: Abre diretamente na aba "Buscar Guia" ✅

### Cenário 3: Navegação do Navegador

1. Paciente navega: Atividades → Guias → Psicólogos
2. Clica em "Voltar" do navegador
3. **Resultado**: Volta para "Guias" ✅
4. Clica em "Voltar" novamente
5. **Resultado**: Volta para "Atividades" ✅

## Benefícios

### Para o Usuário

1. **Continuidade**: Não perde contexto ao recarregar
2. **Produtividade**: Não precisa navegar de volta à aba desejada
3. **Intuitividade**: Comportamento esperado de uma aplicação moderna
4. **Compartilhamento**: Pode enviar link direto para aba específica

### Para o Sistema

1. **Simplicidade**: Solução nativa sem bibliotecas extras
2. **Compatibilidade**: Funciona com navegação do navegador
3. **SEO-friendly**: URLs descritivas (se aplicável)
4. **Sem armazenamento**: Não usa localStorage/cookies

## Considerações Técnicas

### Next.js App Router

A implementação usa hooks do Next.js 13+:
- `useSearchParams()`: Lê query parameters
- `useRouter()`: Atualiza URL
- `router.push()`: Navegação programática

### Client Component

Ambos os dashboards são Client Components (`"use client"`), necessário para:
- Usar hooks do React
- Acessar `useSearchParams` e `useRouter`
- Gerenciar estado interativo

### Validação de Abas

O sistema usa o valor da URL diretamente, mas o componente `Tabs` do ShadCN valida automaticamente:
- Se o valor não corresponder a nenhuma aba, mostra a primeira
- Garante que sempre há uma aba válida selecionada

### Fallback

Se não houver parâmetro `tab` na URL:
- Paciente: `activities` (padrão)
- Psicólogo: `patients` (padrão)

```typescript
const currentTab = searchParams.get("tab") || "activities";
```

## Futuras Melhorias

1. **Validação explícita**: Validar se o valor do parâmetro `tab` é válido
2. **Deep linking**: Suportar parâmetros adicionais (ex: `?tab=guides&guide=123`)
3. **Histórico avançado**: Salvar estado completo de cada aba (filtros, scroll, etc.)
4. **Analytics**: Rastrear quais abas são mais usadas

## Compatibilidade

- ✅ **Next.js**: 13+ (App Router)
- ✅ **Navegadores**: Todos os modernos (Chrome, Firefox, Safari, Edge)
- ✅ **Mobile**: Funciona em dispositivos móveis
- ✅ **SSR**: Compatible com Server-Side Rendering (query params disponíveis)

---

**Implementado em:** 2026-01-06  
**Arquivos:**
- `app/dashboard/patient/page.tsx`
- `app/dashboard/psychologist/page.tsx`

