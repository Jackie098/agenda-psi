# Guia de Configuração - Agenda Psi

## 🚀 Início Rápido

### 1. Configurar Banco de Dados

**Opção A: Usando Docker (Recomendado)**

```bash
# Iniciar PostgreSQL com Docker
docker-compose up -d

# Verificar se está rodando
docker ps
```

**Opção B: PostgreSQL Local**

Se você já tem PostgreSQL instalado localmente, crie o banco:

```sql
CREATE DATABASE agenda_psi;
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agenda_psi?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

Para gerar uma chave secreta segura:

```bash
openssl rand -base64 32
```

### 3. Executar Migrations

```bash
npx prisma migrate dev --name init
```

### 4. Popular Banco com Dados de Exemplo

```bash
npm run db:seed
```

### 5. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 👥 Contas de Teste

Após executar o seed, você pode fazer login com:

### Paciente
- **Email**: paciente@example.com
- **WhatsApp**: 11999999999

### Psicólogo
- **Email**: psicologo@example.com
- **WhatsApp**: 11988888888

## 📋 Funcionalidades Implementadas

### Para Pacientes
✅ Dashboard com saldo de créditos  
✅ Registro de faciais (adiciona créditos)  
✅ Gerenciamento de guias (múltiplas guias simultâneas)  
✅ Registro de consultas (subtrai créditos)  
✅ Histórico completo de sessões  
✅ Gerenciamento de vínculos com psicólogos  
✅ Criação de referências de psicólogos  
✅ Saldo negativo permitido  
✅ Aviso ao registrar mais de 1 facial por dia  

### Para Psicólogos
✅ Dashboard com lista de pacientes vinculados  
✅ Busca de pacientes por email/WhatsApp  
✅ Consulta de guias por número  
✅ Visualização de saldo e guias dos pacientes  
✅ Gerenciamento de solicitações de vínculo  
✅ Acesso apenas a dados de pacientes vinculados  

### Sistema
✅ Autenticação com NextAuth.js  
✅ Roles (Paciente/Psicólogo)  
✅ API REST completa  
✅ Validação com Zod  
✅ UI moderna com ShadCN/UI  
✅ Responsivo (mobile-first)  
✅ Notificações toast  
✅ Tratamento de erros  

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm run start

# Prisma Studio (interface visual do banco)
npx prisma studio

# Resetar banco de dados
npx prisma migrate reset

# Gerar Prisma Client
npx prisma generate

# Verificar linter
npm run lint
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- `users` - Usuários do sistema (base)
- `patients` - Perfil de pacientes
- `psychologists` - Perfil de psicólogos
- `companies` - Empresas/Convênios
- `guides` - Guias de créditos
- `facial_records` - Registros de faciais
- `sessions` - Consultas realizadas
- `psychologist_references` - Referências de psicólogos
- `patient_psychologist_links` - Vínculos entre pacientes e psicólogos

## 🎯 Regras de Negócio

### Sistema de Créditos
1. **Facial → Guia → Saldo**: Bater facial consome 1 crédito da guia e adiciona 1 ao saldo
2. **Consulta → Saldo**: Consulta subtrai do saldo (1 para 30min, 2 para 50min)
3. **Saldo negativo**: Permitido sem limite
4. **Seleção automática de guia**: FIFO (First-In-First-Out)

### Restrições
- Aviso (não bloqueio) se mais de 1 facial por dia
- Guias têm data de validade obrigatória
- Múltiplas guias ativas simultâneas permitidas
- Paciente ou psicólogo podem registrar consultas (sem aprovação)
- Psicólogo só acessa dados de pacientes vinculados

## 🐛 Troubleshooting

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Se usando Docker: `docker-compose up -d`
- Verifique a `DATABASE_URL` no arquivo `.env`

### Erro: "NextAuth configuration error"
- Verifique se `NEXTAUTH_SECRET` está definido no `.env`
- Gere uma nova chave com: `openssl rand -base64 32`

### Erro ao fazer login
- Verifique se executou o seed: `npm run db:seed`
- Tente criar uma nova conta pela interface

### Porta 3000 já em uso
```bash
# Encontrar processo usando a porta
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar outra porta
PORT=3001 npm run dev
```

## 📝 Próximos Passos (Melhorias Futuras)

- [ ] Autenticação com senha (bcrypt)
- [ ] Upload de documentos/guias
- [ ] Notificações por email/WhatsApp
- [ ] Relatórios e gráficos
- [ ] Exportação de dados (PDF/Excel)
- [ ] Agendamento de consultas
- [ ] Lembretes automáticos
- [ ] Modo escuro
- [ ] Testes automatizados
- [ ] Deploy (Vercel + Supabase/Neon)

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do terminal onde o `npm run dev` está rodando
2. Console do navegador (F12)
3. Logs do Prisma Studio
4. Arquivo `.env` está configurado corretamente

