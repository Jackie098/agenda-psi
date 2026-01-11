# Correção: Constraint UNIQUE no linkedPsychologistId

## 🐛 Problema Identificado

**Erro:** `Unique constraint failed on the fields: linkedPsychologistId`

**Causa:** O campo `linkedPsychologistId` tinha constraint `@unique` que impedia o mesmo psicólogo de ser vinculado a referências de **diferentes pacientes**.

### Comportamento Incorreto:

```
❌ ANTES da correção:
- Paciente A: referência "Dra. Maria" → vincula ao psychologistId X ✓
- Paciente B: referência "Dra. Maria" → vincula ao psychologistId X ✗ (ERRO!)
  
Constraint: linkedPsychologistId deve ser único no sistema TODO
```

## ✅ Solução Implementada

Mudança no schema Prisma:

```prisma
# ANTES (❌):
linkedPsychologistId  String?  @unique

# DEPOIS (✅):
linkedPsychologistId  String?

@@unique([patientId, linkedPsychologistId])
@@index([linkedPsychologistId])
```

### Comportamento Correto:

```
✅ DEPOIS da correção:
- Paciente A: referência "Dra. Maria" → vincula ao psychologistId X ✓
- Paciente B: referência "Dra. Maria" → vincula ao psychologistId X ✓
- Paciente A: referência "Maria Santos" → vincula ao psychologistId X ✗
  
Constraint: (patientId + linkedPsychologistId) deve ser único
```

## 📊 Nova Constraint Composta

```sql
CREATE UNIQUE INDEX "psychologist_references_patientId_linkedPsychologistId_key" 
ON "psychologist_references"("patientId", "linkedPsychologistId");
```

**Regra:** Um paciente não pode ter duas referências diferentes vinculadas ao mesmo psicólogo.

### Exemplos:

| Paciente | Referência | Psicólogo Vinculado | Status |
|----------|------------|---------------------|---------|
| Carlos | "Dra. Maria" | psychId123 | ✅ Permitido |
| Matheus | "Dra. Maria Santos" | psychId123 | ✅ Permitido (paciente diferente) |
| Carlos | "Maria Santos" | psychId123 | ❌ Bloqueado (mesmo paciente + mesmo psicólogo) |
| Carlos | "Dr. João" | psychId456 | ✅ Permitido (psicólogo diferente) |

## 🔧 Arquivos Modificados

1. **prisma/schema.prisma**
   - Removido `@unique` de `linkedPsychologistId`
   - Adicionado `@@unique([patientId, linkedPsychologistId])`
   - Adicionado `@@index([linkedPsychologistId])`

2. **Migration SQL**
   - `prisma/migrations/20260106153924_fix_psychologist_reference_unique_constraint/migration.sql`
   - Remove constraint antiga
   - Cria nova constraint composta

## 🎯 Impacto

### Antes (Problema):
- Erro ao tentar vincular `jaceline@gmail.com` (psicóloga) a referência do `matheus@gmail.com`
- Mesmo psicólogo só podia estar em uma referência no sistema todo
- Limitação severa de uso real

### Depois (Corrigido):
- ✅ Mesmo psicólogo pode ser vinculado a referências de diferentes pacientes
- ✅ Impede duplicação por paciente (mesmo paciente não pode ter 2 refs → mesmo psicólogo)
- ✅ Modelo de dados correto e flexível

## 🚀 Aplicação

```bash
# Migration aplicada com:
DATABASE_URL="postgresql://postgres:1234@localhost:5431/agenda_psi?schema=public" \
npx prisma migrate deploy

# Prisma Client regenerado:
DATABASE_URL="postgresql://postgres:1234@localhost:5431/agenda_psi?schema=public" \
npx prisma generate
```

## ✅ Status

**Correção aplicada com sucesso!** O erro não deve mais ocorrer.

### Validações que Permaneceram:

A API (`app/api/references/[id]/link/route.ts`) continua validando corretamente:

1. ✓ Referência deve pertencer ao paciente
2. ✓ Referência não pode já estar vinculada
3. ✓ Psicólogo deve existir
4. ✓ Deve existir vínculo ACEITO entre paciente e psicólogo
5. ✓ Paciente não pode ter outra referência vinculada ao mesmo psicólogo

## 🔄 Reinício Necessário

Após aplicar a migration, **reinicie o servidor Next.js** para que o Prisma Client atualizado seja carregado:

```bash
# Parar servidor (Ctrl+C)
npm run dev
```

---

**Data da Correção:** 2025-01-06  
**Migration:** `20260106153924_fix_psychologist_reference_unique_constraint`

