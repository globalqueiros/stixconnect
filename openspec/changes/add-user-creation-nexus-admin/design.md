# Design: Adicionar Criação de Usuários no Nexus Admin

## Context

O Nexus Admin é um painel administrativo separado do StixConnect principal, rodando na porta 3001. Atualmente, não possui interface para criar usuários do sistema StixConnect. O backend FastAPI já possui endpoints para listar e atualizar usuários, mas falta o endpoint de criação.

O sistema StixConnect suporta 14 roles diferentes de usuário:
- admin, doctor, nurse, receptionist, physiotherapist, nutritionist, hairdresser, psychologist, speech_therapist, acupuncturist, clinical_psypedagogist, caregiver, patient, supervisor

## Goals

1. Permitir que administradores criem contas de usuários através de interface web
2. Suportar criação de todos os 14 tipos de roles
3. Validar dados antes de criar usuário
4. Fornecer feedback claro de sucesso/erro
5. Permitir gerenciamento completo (criar, listar, editar, desativar)

## Non-Goals

- Não implementar recuperação de senha nesta fase
- Não implementar convite por email nesta fase
- Não implementar importação em massa de usuários
- Não implementar histórico de alterações/auditoria nesta fase

## Decisions

### Decision 1: Endpoint Backend
**O que**: Criar endpoint `POST /admin/users` no backend FastAPI existente
**Por quê**: 
- Backend já possui estrutura de autenticação e RBAC
- Mantém consistência com outros endpoints administrativos (`/admin/users` já existe para listagem)
- Reutiliza schemas e validações existentes

**Alternativas consideradas**:
- Criar endpoint separado `/users/create` - Rejeitado por inconsistência com padrão REST
- Criar endpoint no Nexus Admin (API Route) - Rejeitado por violar separação de responsabilidades

### Decision 2: Cliente API no Nexus Admin
**O que**: Criar cliente API dedicado no Nexus Admin para comunicação com backend FastAPI
**Por quê**:
- Nexus Admin atualmente usa NextAuth, mas precisa se comunicar com backend FastAPI
- Necessário para autenticação JWT e interceptors
- Permite reutilização em outras funcionalidades futuras

**Alternativas consideradas**:
- Usar fetch direto - Rejeitado por falta de interceptors e tratamento centralizado de erros
- Usar axios - Aceito, biblioteca leve e bem suportada

### Decision 3: Estrutura de Páginas
**O que**: Criar estrutura `/admin/users` com subpáginas para criar, listar e editar
**Por quê**:
- Segue padrão Next.js App Router
- Organização clara e escalável
- Fácil navegação e manutenção

**Estrutura**:
```
/admin/users/
  ├── page.tsx          # Listagem
  ├── create/
  │   └── page.tsx      # Formulário de criação
  └── [id]/
      └── edit/
          └── page.tsx  # Formulário de edição
```

### Decision 4: Campos do Formulário
**O que**: Formulário completo com todos os campos relevantes, alguns obrigatórios e outros opcionais
**Campos obrigatórios**: nome, email, senha, role
**Campos opcionais**: telefone, CPF, data_nascimento, especialidade, CRM, endereço

**Por quê**:
- Nome, email, senha e role são essenciais para criar usuário
- Outros campos podem ser preenchidos depois ou são específicos de certos roles
- Especialidade e CRM são relevantes apenas para médicos

### Decision 5: Validação de Senha
**O que**: Mínimo 8 caracteres, com recomendação de complexidade
**Por quê**:
- Backend já valida mínimo 8 caracteres
- Não forçar complexidade excessiva na primeira versão
- Feedback visual pode sugerir senha forte sem bloquear

**Alternativas consideradas**:
- Forçar maiúscula, minúscula, número e símbolo - Rejeitado por ser muito restritivo
- Sem validação - Rejeitado por segurança

### Decision 6: Autenticação JWT no Nexus Admin
**O que**: Nexus Admin se autentica no backend FastAPI usando JWT tokens
**Por quê**:
- Backend já usa JWT
- Permite reutilizar sistema de autenticação existente
- Mantém consistência com StixConnect frontend

**Fluxo**:
1. Admin faz login no Nexus Admin (NextAuth)
2. Nexus Admin obtém JWT do backend FastAPI (pode ser via endpoint especial ou credenciais compartilhadas)
3. Nexus Admin usa JWT em todas as requisições para backend

**Alternativas consideradas**:
- Manter apenas NextAuth - Rejeitado por não permitir comunicação com backend FastAPI
- Criar bridge entre NextAuth e JWT - Aceito como solução intermediária

## Risks / Trade-offs

### Risk 1: Dupla Autenticação
**Risco**: Nexus Admin usa NextAuth, mas precisa JWT do backend FastAPI
**Mitigação**: 
- Criar endpoint `/auth/admin-login` no backend que aceita credenciais do Nexus Admin
- Ou armazenar credenciais de admin no backend e fazer login automático
- Ou sincronizar sessão NextAuth com JWT do backend

### Risk 2: Validação de CPF
**Risco**: Validação de CPF pode ser complexa e ter edge cases
**Mitigação**: 
- Usar biblioteca de validação de CPF (ex: `cpf-cnpj-validator`)
- Ou validar apenas formato básico no frontend, validação completa no backend

### Risk 3: Campos Condicionais
**Risco**: Mostrar campos apenas para certos roles pode confundir usuário
**Mitigação**: 
- Feedback visual claro quando campos aparecem/desaparecem
- Tooltip explicando por que campo é relevante para o role

### Risk 4: Performance na Listagem
**Risco**: Listar muitos usuários pode ser lento
**Mitigação**: 
- Backend já suporta paginação (skip/limit)
- Implementar paginação no frontend
- Adicionar busca/filtro para reduzir resultados

## Migration Plan

### Fase 1: Backend (1-2 dias)
1. Adicionar schema `UserCreateAdmin` em `schemas.py`
2. Implementar endpoint `POST /admin/users` em `users.py`
3. Testar endpoint com Postman/curl
4. Atualizar documentação Swagger

### Fase 2: Cliente API (1 dia)
1. Criar `api-client.ts` no Nexus Admin
2. Implementar interceptors JWT
3. Criar `user.service.ts`
4. Testar comunicação com backend

### Fase 3: Interface (2-3 dias)
1. Criar estrutura de páginas
2. Criar componente `UserForm`
3. Implementar validações
4. Adicionar feedback visual
5. Criar página de listagem

### Fase 4: Integração e Testes (1-2 dias)
1. Testar fluxo completo de criação
2. Testar todos os 14 roles
3. Testar validações
4. Testar permissões
5. Ajustes finais

## Open Questions

1. **Autenticação JWT no Nexus Admin**: Como o Nexus Admin obtém JWT do backend? Precisa fazer login separado ou pode usar credenciais do NextAuth?
   - **Resposta provisória**: Criar endpoint `/auth/admin-login` que aceita credenciais do admin e retorna JWT

2. **Validação de CPF**: Implementar validação completa (dígitos verificadores) ou apenas formato?
   - **Resposta provisória**: Validação de formato no frontend, validação completa no backend (se biblioteca disponível)

3. **Geração de Senha**: Admin define senha ou sistema gera senha temporária?
   - **Resposta provisória**: Admin define senha, com opção futura de gerar senha aleatória

4. **Notificação por Email**: Enviar email ao usuário criado com credenciais?
   - **Resposta provisória**: Não nesta fase, pode ser adicionado depois

5. **Campos Específicos por Role**: Além de especialidade/CRM para médicos, outros roles precisam campos específicos?
   - **Resposta provisória**: Não nesta fase, campos específicos podem ser adicionados depois conforme necessidade
