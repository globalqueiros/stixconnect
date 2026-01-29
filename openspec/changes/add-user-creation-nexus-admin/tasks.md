# Tasks: Adicionar Criação de Usuários no Nexus Admin

## 1. Backend - Endpoint de Criação de Usuários

### 1.1 Criar Schema de Criação
- [x] 1.1.1 Adicionar `UserCreateAdmin` em `app/schemas/schemas.py` com todos os campos necessários
- [x] 1.1.2 Incluir validação de senha (mínimo 8 caracteres)
- [x] 1.1.3 Incluir campos opcionais: telefone, CPF, data_nascimento, especialidade, CRM, endereco
- [x] 1.1.4 Garantir que role seja obrigatório e válido (enum UserRole)

### 1.2 Implementar Endpoint POST
- [x] 1.2.1 Adicionar `POST /admin/users` em `app/routers/users.py`
- [x] 1.2.2 Implementar validação de email único
- [x] 1.2.3 Implementar validação de CPF único (se fornecido)
- [x] 1.2.4 Implementar hash de senha com bcrypt
- [x] 1.2.5 Criar usuário com role especificado
- [x] 1.2.6 Retornar `UserResponse` com status 201
- [x] 1.2.7 Adicionar tratamento de erros (email duplicado, CPF duplicado, role inválido)

### 1.3 Validações e Segurança
- [x] 1.3.1 Garantir que apenas admins possam criar usuários (usar `require_admin`)
- [x] 1.3.2 Validar formato de email
- [x] 1.3.3 Validar formato de CPF (se fornecido)
- [x] 1.3.4 Validar senha (mínimo 8 caracteres, recomendado: maiúscula, minúscula, número)

## 2. Frontend - Cliente API

### 2.1 Criar Cliente API (se não existir)
- [x] 2.1.1 Criar `src/app/lib/api-client.ts` no Nexus Admin
- [x] 2.1.2 Implementar cliente HTTP com axios ou fetch
- [x] 2.1.3 Adicionar interceptors para JWT token
- [x] 2.1.4 Configurar baseURL para backend FastAPI
- [x] 2.1.5 Implementar tratamento de erros (401, 403, 500)

### 2.2 Criar Serviço de Usuários
- [x] 2.2.1 Criar `src/app/services/user.service.ts`
- [x] 2.2.2 Implementar `createUser(userData)` que chama `POST /admin/users`
- [x] 2.2.3 Implementar `getUsers()` que chama `GET /admin/users`
- [x] 2.2.4 Implementar `updateUser(id, userData)` que chama `PUT /admin/users/{id}`
- [x] 2.2.5 Implementar `deleteUser(id)` que chama `DELETE /admin/users/{id}`

## 3. Frontend - Interface de Criação

### 3.1 Criar Estrutura de Páginas
- [x] 3.1.1 Criar `src/app/admin/users/page.tsx` - Listagem de usuários
- [x] 3.1.2 Criar `src/app/admin/users/create/page.tsx` - Formulário de criação
- [x] 3.1.3 Criar `src/app/admin/users/[id]/edit/page.tsx` - Formulário de edição

### 3.2 Componente de Formulário
- [x] 3.2.1 Criar `src/app/admin/users/components/UserForm.tsx`
- [x] 3.2.2 Adicionar campo: Nome (obrigatório, texto)
- [x] 3.2.3 Adicionar campo: Email (obrigatório, tipo email)
- [x] 3.2.4 Adicionar campo: Senha (obrigatório, tipo password, com validação)
- [x] 3.2.5 Adicionar campo: Confirmar Senha (obrigatório, validação de match)
- [x] 3.2.6 Adicionar campo: Role (obrigatório, select com 14 opções)
- [x] 3.2.7 Adicionar campo: Telefone (opcional, máscara brasileira)
- [x] 3.2.8 Adicionar campo: CPF (opcional, máscara CPF)
- [x] 3.2.9 Adicionar campo: Data de Nascimento (opcional, date picker)
- [x] 3.2.10 Adicionar campo: Especialidade (opcional, texto, visível apenas para médicos)
- [x] 3.2.11 Adicionar campo: CRM (opcional, texto, visível apenas para médicos)
- [x] 3.2.12 Adicionar campo: Endereço (opcional, textarea)

### 3.3 Validação de Formulário
- [x] 3.3.1 Implementar validação de email (formato válido)
- [x] 3.3.2 Implementar validação de senha (mínimo 8 caracteres, feedback visual)
- [x] 3.3.3 Implementar validação de CPF (formato e dígitos verificadores)
- [x] 3.3.4 Implementar validação de telefone (formato brasileiro)
- [x] 3.3.5 Mostrar campos condicionais baseados no role selecionado
- [x] 3.3.6 Adicionar mensagens de erro claras para cada campo

### 3.4 UI/UX
- [x] 3.4.1 Criar layout responsivo (mobile-friendly)
- [x] 3.4.2 Adicionar loading state durante submissão
- [x] 3.4.3 Adicionar toast/notificação de sucesso após criação
- [x] 3.4.4 Adicionar toast/notificação de erro com mensagem específica
- [x] 3.4.5 Adicionar botão "Cancelar" que volta para listagem
- [x] 3.4.6 Adicionar botão "Criar Usuário" com estado disabled durante validação

## 4. Frontend - Listagem de Usuários

### 4.1 Página de Listagem
- [x] 4.1.1 Criar tabela com colunas: Nome, Email, Role, Status, Ações
- [x] 4.1.2 Implementar paginação (se backend suportar)
- [x] 4.1.3 Implementar busca/filtro por nome, email ou role
- [x] 4.1.4 Adicionar botão "Criar Novo Usuário" que redireciona para `/admin/users/create`
- [x] 4.1.5 Adicionar badge de status (Ativo/Inativo)
- [x] 4.1.6 Adicionar badge de role com cores diferentes

### 4.2 Ações na Listagem
- [x] 4.2.1 Adicionar botão "Editar" que abre formulário de edição
- [x] 4.2.2 Adicionar botão "Desativar/Ativar" com confirmação
- [ ] 4.2.3 Adicionar botão "Ver Detalhes" (opcional, modal ou página)

## 5. Integração e Testes

### 5.1 Integração Backend-Frontend
- [ ] 5.1.1 Testar criação de usuário com role "admin"
- [ ] 5.1.2 Testar criação de usuário com role "doctor"
- [ ] 5.1.3 Testar criação de usuário com role "nurse"
- [ ] 5.1.4 Testar criação de usuário com todos os 14 roles
- [ ] 5.1.5 Testar validação de email duplicado
- [ ] 5.1.6 Testar validação de CPF duplicado
- [ ] 5.1.7 Testar criação com campos opcionais preenchidos
- [ ] 5.1.8 Testar criação com campos opcionais vazios

### 5.2 Testes de Interface
- [ ] 5.2.1 Testar formulário em diferentes tamanhos de tela
- [ ] 5.2.2 Testar validação de campos em tempo real
- [ ] 5.2.3 Testar feedback de erro/sucesso
- [ ] 5.2.4 Testar navegação entre páginas
- [ ] 5.2.5 Testar permissões (apenas admin pode acessar)

### 5.3 Testes de Segurança
- [ ] 5.3.1 Verificar que não-admin não pode acessar `/admin/users`
- [ ] 5.3.2 Verificar que tokens JWT são validados corretamente
- [ ] 5.3.3 Verificar que senhas são hasheadas antes de salvar
- [ ] 5.3.4 Verificar que senhas não aparecem em logs ou respostas

## 6. Documentação

### 6.1 Documentação de API
- [ ] 6.1.1 Atualizar documentação Swagger com novo endpoint
- [ ] 6.1.2 Adicionar exemplos de request/response
- [ ] 6.1.3 Documentar códigos de erro possíveis

### 6.2 Documentação de Uso
- [ ] 6.2.1 Criar guia de uso da interface de criação de usuários
- [ ] 6.2.2 Documentar todos os campos do formulário
- [ ] 6.2.3 Documentar regras de validação
