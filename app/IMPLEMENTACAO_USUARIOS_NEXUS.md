# ✅ Implementação: Criação de Usuários no Nexus Admin

**Status**: Implementação Completa ✅  
**Data**: 19/01/2026  
**Proposta OpenSpec**: `add-user-creation-nexus-admin`

## 📋 Resumo

Implementação completa da funcionalidade de criação e gerenciamento de usuários no Nexus Admin, permitindo que administradores criem contas para todos os 14 perfis do sistema StixConnect.

## ✅ O que foi implementado

### Backend (FastAPI)

1. **Schema `UserCreateAdmin`** (`stixconnect-backend/app/schemas/schemas.py`)
   - Campos obrigatórios: nome, email, senha, role
   - Campos opcionais: telefone, CPF, data_nascimento, especialidade, CRM, endereco
   - Validação de senha (mínimo 8 caracteres)

2. **Endpoint `POST /admin/users`** (`stixconnect-backend/app/routers/users.py`)
   - Criação de usuários por administradores
   - Validação de email único
   - Validação de CPF único (se fornecido)
   - Hash de senha com bcrypt
   - Suporte para todos os 14 roles
   - Retorna `UserResponse` com status 201

### Frontend (Nexus Admin)

1. **Cliente API** (`nexus_admin/nexus_admin/src/app/lib/api-client.ts`)
   - Cliente HTTP com axios
   - Interceptors para JWT token
   - Tratamento de erros (401, 403, 500)
   - Gerenciamento de token no localStorage

2. **Serviço de Usuários** (`nexus_admin/nexus_admin/src/app/services/user.service.ts`)
   - `createUser()` - Criar usuário
   - `getUsers()` - Listar usuários com filtros
   - `getUserById()` - Buscar usuário por ID
   - `updateUser()` - Atualizar usuário
   - `deleteUser()` - Desativar usuário
   - `reactivateUser()` - Reativar usuário

3. **Componente UserForm** (`nexus_admin/nexus_admin/src/app/admin/users/components/UserForm.tsx`)
   - Formulário completo com validação
   - Campos condicionais para médicos (especialidade, CRM)
   - Validação de email, CPF, senha
   - Formatação automática de CPF e telefone
   - Feedback visual de erros

4. **Páginas**
   - **Listagem** (`/admin/users/page.tsx`)
     - Tabela com todos os usuários
     - Busca por nome, email ou CPF
     - Filtro por role
     - Paginação
     - Ações: Editar, Desativar/Reativar
   
   - **Criação** (`/admin/users/create/page.tsx`)
     - Formulário de criação completo
     - Validação em tempo real
     - Feedback de sucesso/erro
   
   - **Edição** (`/admin/users/[id]/edit/page.tsx`)
     - Formulário de edição
     - Carregamento de dados do usuário
     - Atualização de campos permitidos

5. **Menu de Navegação**
   - Link "Usuários" adicionado ao menu do admin

## 🔧 Configuração Necessária

### Variável de Ambiente

O Nexus Admin precisa da variável `NEXT_PUBLIC_API_URL` apontando para o backend FastAPI:

```env
# nexus_admin/nexus_admin/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Para produção:
```env
NEXT_PUBLIC_API_URL=https://api.stixconnect.com
```

### Autenticação JWT

O Nexus Admin precisa obter um token JWT do backend FastAPI para fazer requisições. Existem duas opções:

**Opção 1: Endpoint de login admin no backend**
Criar endpoint `/auth/admin-login` que aceita credenciais do admin e retorna JWT.

**Opção 2: Sincronizar NextAuth com JWT**
Fazer login no NextAuth e automaticamente obter JWT do backend.

**Por enquanto**: O token precisa ser configurado manualmente no `localStorage` ou via código após login.

## 📝 Como Usar

### 1. Configurar Backend

Certifique-se de que o backend FastAPI está rodando na porta 8000 (ou configure a URL correta).

### 2. Configurar Frontend

1. Criar arquivo `.env.local` em `nexus_admin/nexus_admin/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. Instalar dependências (se necessário):
```bash
cd nexus_admin/nexus_admin
npm install
```

### 3. Obter Token JWT

Antes de usar a interface, é necessário obter um token JWT do backend:

1. Fazer login no backend FastAPI via `/auth/login`
2. Copiar o `access_token` retornado
3. No console do navegador (F12), executar:
```javascript
localStorage.setItem('api_token', 'SEU_TOKEN_AQUI');
```

Ou adicionar código no Nexus Admin para fazer login automático após autenticação NextAuth.

### 4. Acessar Interface

1. Acessar `/admin/users` no Nexus Admin
2. Clicar em "Criar Novo Usuário"
3. Preencher formulário
4. Selecionar role desejado (14 opções disponíveis)
5. Para médicos, preencher especialidade e CRM
6. Salvar

## 🎯 Funcionalidades

### Criação de Usuários
- ✅ Criar usuários com qualquer um dos 14 roles
- ✅ Validação de email único
- ✅ Validação de CPF único
- ✅ Campos condicionais para médicos
- ✅ Hash de senha automático

### Listagem e Gerenciamento
- ✅ Listar todos os usuários
- ✅ Buscar por nome, email ou CPF
- ✅ Filtrar por role
- ✅ Paginação
- ✅ Editar usuários
- ✅ Desativar/Reativar usuários

### Segurança
- ✅ Apenas admins podem criar/gerenciar usuários
- ✅ Validação de token JWT
- ✅ Senhas hasheadas com bcrypt
- ✅ Validação de dados no frontend e backend

## 📊 Roles Suportados

1. **admin** - Administrador
2. **doctor** - Médico
3. **nurse** - Enfermeiro
4. **receptionist** - Atendente
5. **physiotherapist** - Fisioterapeuta
6. **nutritionist** - Nutricionista
7. **hairdresser** - Cabeleireiro
8. **psychologist** - Psicóloga
9. **speech_therapist** - Fonoaudióloga
10. **acupuncturist** - Acupuntura
11. **clinical_psypedagogist** - Psicopedagoga Clínica
12. **caregiver** - Cuidador
13. **patient** - Paciente
14. **supervisor** - Supervisor

## ⚠️ Próximos Passos (Opcional)

1. **Autenticação Automática**: Implementar integração NextAuth → JWT automática
2. **Notificações**: Adicionar toast notifications para feedback
3. **Validação CPF**: Implementar validação completa de CPF (dígitos verificadores)
4. **Geração de Senha**: Opção de gerar senha aleatória
5. **Email de Boas-vindas**: Enviar email ao usuário criado com credenciais

## 🐛 Troubleshooting

### Erro: "401 Unauthorized"
- Verificar se token JWT está configurado no localStorage
- Verificar se token não expirou (renovar via `/auth/refresh`)

### Erro: "403 Forbidden"
- Verificar se usuário tem role "admin"
- Verificar se token JWT contém role correta

### Erro: "Email já cadastrado"
- Email deve ser único no sistema
- Verificar se usuário já existe

### Erro: "CPF já cadastrado"
- CPF deve ser único no sistema (se fornecido)
- Verificar se CPF já está em uso

## 📚 Arquivos Criados/Modificados

### Backend
- `stixconnect-backend/app/schemas/schemas.py` - Adicionado `UserCreateAdmin`
- `stixconnect-backend/app/routers/users.py` - Adicionado `POST /admin/users`

### Frontend
- `nexus_admin/nexus_admin/src/app/lib/api-client.ts` - Novo
- `nexus_admin/nexus_admin/src/app/services/user.service.ts` - Novo
- `nexus_admin/nexus_admin/src/app/admin/users/components/UserForm.tsx` - Novo
- `nexus_admin/nexus_admin/src/app/admin/users/page.tsx` - Novo
- `nexus_admin/nexus_admin/src/app/admin/users/create/page.tsx` - Novo
- `nexus_admin/nexus_admin/src/app/admin/users/[id]/edit/page.tsx` - Novo
- `nexus_admin/nexus_admin/src/app/admin/lib/navlinks.tsx` - Modificado (adicionado link Usuários)

---

**Implementação concluída com sucesso!** ✅
