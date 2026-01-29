## ADDED Requirements

### Requirement: Criação de Usuários por Administrador
O sistema SHALL permitir que administradores criem contas de usuários através de interface web no Nexus Admin, com suporte para todos os 14 roles disponíveis.

#### Scenario: Admin cria usuário médico
- **WHEN** um administrador acessa `/admin/users/create` no Nexus Admin
- **AND** preenche nome, email, senha, role "doctor", especialidade e CRM
- **AND** submete o formulário
- **THEN** o sistema SHALL criar o usuário no backend FastAPI
- **AND** SHALL retornar confirmação de sucesso
- **AND** SHALL redirecionar para listagem de usuários

#### Scenario: Admin cria usuário enfermeiro
- **WHEN** um administrador cria usuário com role "nurse"
- **THEN** o sistema SHALL criar usuário com role de enfermeiro
- **AND** SHALL permitir acesso às funcionalidades de enfermagem no StixConnect

#### Scenario: Admin cria conta de administrador
- **WHEN** um administrador cria usuário com role "admin"
- **THEN** o sistema SHALL criar usuário com permissões administrativas
- **AND** SHALL permitir acesso ao Nexus Admin e todas as áreas administrativas

#### Scenario: Validação de email duplicado
- **WHEN** administrador tenta criar usuário com email já existente
- **THEN** o sistema SHALL retornar erro 400
- **AND** SHALL exibir mensagem "Email já cadastrado"
- **AND** SHALL impedir criação do usuário

#### Scenario: Validação de CPF duplicado
- **WHEN** administrador tenta criar usuário com CPF já existente
- **THEN** o sistema SHALL retornar erro 400
- **AND** SHALL exibir mensagem "CPF já cadastrado"
- **AND** SHALL impedir criação do usuário

#### Scenario: Validação de senha fraca
- **WHEN** administrador define senha com menos de 8 caracteres
- **THEN** o sistema SHALL exibir erro de validação no formulário
- **AND** SHALL impedir submissão do formulário
- **AND** SHALL sugerir senha com mínimo 8 caracteres

### Requirement: Formulário de Criação de Usuário
O sistema SHALL fornecer formulário estruturado com todos os campos necessários para criação de usuário, com validação em tempo real.

#### Scenario: Campos obrigatórios
- **WHEN** administrador acessa formulário de criação
- **THEN** o sistema SHALL exibir campos: Nome, Email, Senha, Confirmar Senha, Role
- **AND** SHALL marcar estes campos como obrigatórios
- **AND** SHALL impedir submissão se algum campo obrigatório estiver vazio

#### Scenario: Campos opcionais
- **WHEN** administrador acessa formulário de criação
- **THEN** o sistema SHALL exibir campos opcionais: Telefone, CPF, Data de Nascimento, Endereço
- **AND** SHALL permitir submissão mesmo com estes campos vazios

#### Scenario: Campos condicionais para médicos
- **WHEN** administrador seleciona role "doctor"
- **THEN** o sistema SHALL exibir campos adicionais: Especialidade, CRM
- **AND** SHALL ocultar estes campos quando outro role é selecionado

#### Scenario: Validação de email em tempo real
- **WHEN** administrador digita email no formulário
- **THEN** o sistema SHALL validar formato de email em tempo real
- **AND** SHALL exibir erro se formato for inválido
- **AND** SHALL remover erro quando formato for válido

#### Scenario: Validação de confirmação de senha
- **WHEN** administrador digita senha e confirmação de senha
- **THEN** o sistema SHALL verificar se senhas coincidem
- **AND** SHALL exibir erro se senhas não coincidirem
- **AND** SHALL remover erro quando senhas coincidirem

### Requirement: Listagem de Usuários
O sistema SHALL permitir que administradores visualizem todos os usuários criados, com opções de busca, filtro e ações.

#### Scenario: Visualizar lista de usuários
- **WHEN** administrador acessa `/admin/users`
- **THEN** o sistema SHALL exibir tabela com: Nome, Email, Role, Status, Ações
- **AND** SHALL carregar usuários do backend via `GET /admin/users`
- **AND** SHALL exibir indicador de loading durante carregamento

#### Scenario: Buscar usuário
- **WHEN** administrador digita termo de busca (nome ou email)
- **THEN** o sistema SHALL filtrar lista de usuários
- **AND** SHALL atualizar tabela com resultados filtrados
- **AND** SHALL enviar parâmetro `search` para backend

#### Scenario: Filtrar por role
- **WHEN** administrador seleciona role no filtro
- **THEN** o sistema SHALL filtrar lista mostrando apenas usuários com aquele role
- **AND** SHALL enviar parâmetro `role` para backend

#### Scenario: Editar usuário
- **WHEN** administrador clica em "Editar" na lista
- **THEN** o sistema SHALL redirecionar para `/admin/users/{id}/edit`
- **AND** SHALL carregar dados do usuário no formulário
- **AND** SHALL permitir atualização de campos (exceto senha, que requer fluxo separado)

#### Scenario: Desativar usuário
- **WHEN** administrador clica em "Desativar" na lista
- **THEN** o sistema SHALL exibir confirmação
- **AND** SHALL chamar `DELETE /admin/users/{id}` no backend
- **AND** SHALL atualizar status do usuário para inativo
- **AND** SHALL atualizar lista sem recarregar página

### Requirement: Segurança e Permissões
O sistema SHALL garantir que apenas administradores possam criar e gerenciar usuários.

#### Scenario: Acesso não autorizado
- **WHEN** usuário sem role "admin" tenta acessar `/admin/users`
- **THEN** o sistema SHALL redirecionar para página de não autorizado
- **AND** SHALL retornar erro 403 do backend

#### Scenario: Validação de token JWT
- **WHEN** Nexus Admin faz requisição para backend FastAPI
- **THEN** o sistema SHALL incluir token JWT no header Authorization
- **AND** backend SHALL validar token antes de processar requisição
- **AND** SHALL retornar 401 se token inválido ou expirado

#### Scenario: Hash de senha
- **WHEN** administrador cria usuário com senha
- **THEN** o sistema SHALL hashear senha com bcrypt antes de salvar
- **AND** SHALL nunca armazenar senha em texto plano
- **AND** SHALL nunca retornar senha em respostas da API

### Requirement: Feedback Visual
O sistema SHALL fornecer feedback claro de sucesso, erro e estados de carregamento.

#### Scenario: Sucesso na criação
- **WHEN** usuário é criado com sucesso
- **THEN** o sistema SHALL exibir notificação de sucesso
- **AND** SHALL redirecionar para listagem após 2 segundos
- **AND** SHALL destacar usuário recém-criado na lista

#### Scenario: Erro na criação
- **WHEN** criação de usuário falha (ex: email duplicado)
- **THEN** o sistema SHALL exibir notificação de erro com mensagem específica
- **AND** SHALL manter formulário preenchido
- **AND** SHALL destacar campo com erro

#### Scenario: Loading durante submissão
- **WHEN** administrador submete formulário
- **THEN** o sistema SHALL exibir indicador de loading
- **AND** SHALL desabilitar botão de submit
- **AND** SHALL ocultar indicador quando requisição completar
