# Change: Adicionar Criação de Usuários no Nexus Admin

## Why
Atualmente, o Nexus Admin não possui uma interface estruturada para criar contas de usuários (enfermeiros, médicos, administradores, etc.). A criação de usuários precisa ser feita diretamente no banco de dados ou através de scripts, o que é ineficiente e não escalável. Esta mudança adiciona uma interface completa no Nexus Admin para gerenciar a criação de usuários com todos os 14 perfis disponíveis no sistema, incluindo a capacidade de criar contas de administrador.

## What Changes

### Backend
- **ADDED**: Endpoint `POST /admin/users` no backend FastAPI para criação de usuários por administradores
- **ADDED**: Validação de campos obrigatórios e únicos (email, CPF) na criação
- **ADDED**: Geração automática de senha temporária ou senha definida pelo admin
- **ADDED**: Suporte para todos os 14 roles de usuário na criação

### Frontend - Nexus Admin
- **ADDED**: Nova página `/admin/users/create` com formulário estruturado para criação de usuários
- **ADDED**: Formulário com campos para: nome, email, senha, role, telefone, CPF, data de nascimento, especialidade (para médicos), CRM (para médicos), endereço
- **ADDED**: Seletor de role com todos os 14 perfis disponíveis
- **ADDED**: Validação de formulário no frontend (email válido, senha forte, CPF formatado)
- **ADDED**: Feedback visual de sucesso/erro após criação
- **ADDED**: Listagem de usuários criados com opção de editar/desativar
- **ADDED**: Página `/admin/users` para gerenciar todos os usuários

### Integração
- **ADDED**: Cliente API no Nexus Admin para comunicação com backend FastAPI
- **ADDED**: Autenticação JWT no Nexus Admin para acessar endpoints administrativos

## Impact

### Affected Specs
- `user-management` - Nova capacidade de gerenciamento de usuários via interface administrativa

### Affected Code
- `stixconnect-backend/app/routers/users.py` - Adicionar endpoint POST para criação
- `stixconnect-backend/app/schemas/schemas.py` - Adicionar schema UserCreateAdmin
- `nexus_admin/nexus_admin/src/app/admin/users/` - Nova estrutura de páginas
- `nexus_admin/nexus_admin/src/app/lib/api-client.ts` - Cliente API para backend (se não existir)
- `nexus_admin/nexus_admin/src/app/admin/components/` - Componentes de formulário

### Breaking Changes
Nenhuma. Esta é uma adição de funcionalidade que não altera comportamentos existentes.

### Dependencies
- Backend FastAPI já possui endpoints de listagem e atualização de usuários
- Backend já possui sistema de autenticação JWT e RBAC
- Nexus Admin já possui estrutura de autenticação NextAuth
