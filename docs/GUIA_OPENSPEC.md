# 📚 Guia Completo: OpenSpec Workflow

## 🎯 O que é OpenSpec?

OpenSpec é um sistema de **desenvolvimento orientado por especificações** que organiza o trabalho em três estágios claros:

1. **Propostas** (`changes/`) - O que **deve** ser construído
2. **Especificações** (`specs/`) - O que **está** construído (verdade atual)
3. **Arquivo** (`archive/`) - O que **foi** construído e finalizado

---

## 🔄 Workflow em 3 Estágios

### 📝 Estágio 1: Criar Propostas (Proposals)

**Quando criar uma proposta?**
- ✅ Adicionar novas funcionalidades
- ✅ Fazer mudanças que quebram APIs ou schemas
- ✅ Mudar arquitetura ou padrões
- ✅ Otimizar performance (que muda comportamento)
- ✅ Atualizar padrões de segurança

**Quando NÃO criar proposta?**
- ❌ Correção de bugs (restaurar comportamento esperado)
- ❌ Erros de digitação, formatação, comentários
- ❌ Atualizações de dependências (não quebram)
- ❌ Mudanças de configuração
- ❌ Testes para comportamento existente

**Como criar uma proposta:**

1. **Verificar contexto atual:**
   ```bash
   # Ver mudanças ativas
   openspec list
   
   # Ver especificações existentes
   openspec list --specs
   
   # Ver detalhes de uma proposta
   openspec show add-user-creation-nexus-admin
   ```

2. **Escolher um `change-id` único:**
   - Formato: kebab-case, começando com verbo
   - Exemplos: `add-user-creation-nexus-admin`, `update-auth-flow`, `remove-old-feature`
   - Deve ser único (se já existe, adicione `-2`, `-3`, etc.)

3. **Criar estrutura de arquivos:**
   ```
   openspec/changes/[change-id]/
   ├── proposal.md          # Por quê e o que muda
   ├── tasks.md            # Checklist de implementação
   ├── design.md           # Decisões técnicas (opcional)
   └── specs/
       └── [capability]/
           └── spec.md     # Especificações detalhadas
   ```

4. **Escrever `proposal.md`:**
   ```markdown
   # Change: [Descrição breve]
   
   ## Why
   [1-2 frases sobre problema/oportunidade]
   
   ## What Changes
   - [Lista de mudanças]
   - [Marcar breaking changes com **BREAKING**]
   
   ## Impact
   - Affected specs: [listar capacidades]
   - Affected code: [arquivos/sistemas chave]
   ```

5. **Escrever `specs/[capability]/spec.md`:**
   ```markdown
   ## ADDED Requirements
   ### Requirement: Nova Funcionalidade
   O sistema SHALL fazer...
   
   #### Scenario: Caso de sucesso
   - **WHEN** usuário faz ação
   - **THEN** resultado esperado
   ```

6. **Criar `tasks.md`** com checklist detalhado

7. **Criar `design.md`** (se necessário):
   - Mudanças cross-cutting (múltiplos serviços)
   - Novas dependências externas
   - Complexidade de segurança/performance/migração
   - Ambiguidades que precisam de decisões técnicas

8. **Validar a proposta:**
   ```bash
   openspec validate [change-id] --strict
   ```

9. **Solicitar aprovação** antes de implementar!

---

### 🛠️ Estágio 2: Implementar Mudanças

**IMPORTANTE:** Não comece a implementação até a proposta ser aprovada!

**Passos de implementação:**

1. **Ler `proposal.md`** - Entender o que está sendo construído
2. **Ler `design.md`** (se existir) - Revisar decisões técnicas
3. **Ler `tasks.md`** - Obter checklist de implementação
4. **Implementar tarefas sequencialmente** - Completar em ordem
5. **Confirmar conclusão** - Garantir que cada item em `tasks.md` está finalizado
6. **Atualizar checklist** - Marcar todas as tarefas como `- [x]` quando concluídas

**Exemplo de `tasks.md`:**
```markdown
## 1. Backend
- [ ] 1.1 Criar endpoint POST /admin/users
- [ ] 1.2 Implementar validação de email único
- [ ] 1.3 Adicionar hash de senha

## 2. Frontend
- [ ] 2.1 Criar página /admin/users/create
- [ ] 2.2 Implementar formulário
- [ ] 2.3 Adicionar validações
```

---

### 📦 Estágio 3: Arquivar Mudanças

Após deploy e validação:

1. **Mover proposta para arquivo:**
   ```bash
   openspec archive [change-id] --yes
   ```

2. **Atualizar especificações:**
   - As especificações em `specs/` são atualizadas automaticamente
   - Ou manualmente se necessário

3. **Validar arquivo:**
   ```bash
   openspec validate --strict
   ```

---

## 🤝 Como Trabalhar Comigo (AI Assistant)

### Quando você quer criar uma nova funcionalidade:

**Diga algo como:**
- "Quero criar uma proposta para [funcionalidade]"
- "Preciso adicionar [feature] ao sistema"
- "Crie uma proposta OpenSpec para [mudança]"

**O que eu faço:**
1. Verifico o contexto atual (`project.md`, mudanças ativas)
2. Crio a estrutura de arquivos necessária
3. Escrevo `proposal.md`, `tasks.md`, `design.md` (se necessário)
4. Crio especificações detalhadas em `specs/[capability]/spec.md`
5. Valido a proposta
6. Apresento para sua revisão e aprovação

### Quando você aprova uma proposta:

**Diga algo como:**
- "Aprovei a proposta [change-id]"
- "Pode implementar [change-id]"
- "Vamos começar a implementação"

**O que eu faço:**
1. Leio `proposal.md` e `design.md` para entender o escopo
2. Sigo `tasks.md` sequencialmente
3. Implemento cada tarefa
4. Atualizo o checklist conforme completo
5. Testo e valido as mudanças

### Quando você quer corrigir um bug:

**Diga algo como:**
- "Corrige o bug em [arquivo]"
- "Há um erro em [funcionalidade]"

**O que eu faço:**
- Corrijo diretamente (sem criar proposta, pois é restauração de comportamento)

### Quando você quer fazer uma mudança pequena:

**Diga algo como:**
- "Atualiza [arquivo] para [mudança]"
- "Adiciona [pequena feature] em [arquivo]"

**O que eu faço:**
- Se for pequena e não quebrar nada, faço diretamente
- Se for ambíguo, pergunto ou crio proposta

---

## 📋 Checklist Antes de Qualquer Tarefa

Antes de começar qualquer trabalho, eu verifico:

- [ ] Li `openspec/project.md` para entender convenções
- [ ] Verifiquei mudanças ativas em `changes/`
- [ ] Verifiquei especificações relevantes em `specs/`
- [ ] Identifiquei conflitos potenciais
- [ ] Entendi o contexto do domínio

---

## 📁 Estrutura de Diretórios

```
openspec/
├── project.md              # Convenções do projeto
├── AGENTS.md               # Instruções para AI (este guia)
│
├── specs/                  # VERDADE ATUAL - O que está construído
│   └── [capability]/
│       ├── spec.md         # Requisitos e cenários
│       └── design.md       # Padrões técnicos
│
├── changes/                # PROPOSTAS - O que deve ser construído
│   ├── [change-id]/
│   │   ├── proposal.md     # Por quê e o que muda
│   │   ├── tasks.md        # Checklist de implementação
│   │   ├── design.md       # Decisões técnicas (opcional)
│   │   └── specs/
│   │       └── [capability]/
│   │           └── spec.md # Mudanças nas especificações
│   │
│   └── archive/            # ARQUIVO - O que foi construído
│       └── YYYY-MM-DD-[change-id]/
```

---

## 🎨 Formato de Especificações

### Requisitos (Requirements)

Cada requisito DEVE ter pelo menos um cenário:

```markdown
### Requirement: Nome do Requisito
O sistema SHALL fazer algo específico.

#### Scenario: Nome do Cenário
- **WHEN** condição inicial
- **AND** ação adicional (opcional)
- **THEN** resultado esperado
- **AND** resultado adicional (opcional)
```

### Operações Delta

- `## ADDED Requirements` - Novas capacidades
- `## MODIFIED Requirements` - Comportamento alterado (copiar requisito completo!)
- `## REMOVED Requirements` - Funcionalidades removidas
- `## RENAMED Requirements` - Apenas mudança de nome

**⚠️ IMPORTANTE:** Ao usar `MODIFIED`, sempre copie o requisito COMPLETO e edite. Não faça deltas parciais!

---

## 🔍 Comandos Úteis

```bash
# Listar mudanças ativas
openspec list

# Listar especificações
openspec list --specs

# Ver detalhes de uma mudança
openspec show add-user-creation-nexus-admin

# Validar uma proposta
openspec validate add-user-creation-nexus-admin --strict

# Arquivar após deploy
openspec archive add-user-creation-nexus-admin --yes
```

---

## 📊 Estado Atual do Projeto

### Mudanças Ativas:
- `integrate-frontend-backend` - Integração do frontend Next.js com backend FastAPI (em implementação)
- `add-user-creation-nexus-admin` - Criação de usuários no Nexus Admin (proposta criada, aguardando aprovação)

### Especificações Existentes:
- Verificar com `openspec list --specs` para ver todas as capacidades documentadas

---

## 💡 Dicas de Trabalho

### Para Você (Desenvolvedor):

1. **Sempre revise propostas antes de aprovar** - Leia `proposal.md` e `design.md`
2. **Aprove explicitamente** - Diga "aprovo" ou "pode implementar"
3. **Peça esclarecimentos** - Se algo não estiver claro, pergunte
4. **Valide após implementação** - Teste as funcionalidades antes de arquivar

### Para Mim (AI Assistant):

1. **Sempre verifico contexto** antes de criar propostas
2. **Sempre valido** propostas antes de apresentar
3. **Sempre sigo** `tasks.md` sequencialmente
4. **Sempre atualizo** checklists conforme completo
5. **Sempre pergunto** se algo for ambíguo

---

## 🚀 Exemplo Prático Completo

### 1. Você pede:
> "Quero criar uma proposta para adicionar criação de usuários no Nexus Admin"

### 2. Eu crio:
- `openspec/changes/add-user-creation-nexus-admin/proposal.md`
- `openspec/changes/add-user-creation-nexus-admin/tasks.md`
- `openspec/changes/add-user-creation-nexus-admin/design.md`
- `openspec/changes/add-user-creation-nexus-admin/specs/user-management/spec.md`

### 3. Você revisa e aprova:
> "Aprovei a proposta add-user-creation-nexus-admin"

### 4. Eu implemento:
- Sigo `tasks.md` sequencialmente
- Implemento backend (endpoint POST /admin/users)
- Implemento frontend (páginas e formulários)
- Atualizo checklists

### 5. Você testa e valida:
> "Funcionou! Pode arquivar"

### 6. Eu arquivo:
```bash
openspec archive add-user-creation-nexus-admin --yes
```

---

## ❓ Perguntas Frequentes

**P: Preciso criar proposta para tudo?**
R: Não. Apenas para novas funcionalidades, breaking changes, mudanças arquiteturais. Bugs e mudanças pequenas podem ser feitas diretamente.

**P: Como sei se uma proposta está aprovada?**
R: Você precisa me dizer explicitamente "aprovo" ou "pode implementar". Eu não assumo aprovação automática.

**P: Posso modificar uma proposta depois de criada?**
R: Sim! Você pode pedir para ajustar qualquer parte da proposta antes da aprovação.

**P: O que acontece se eu não arquivar uma mudança?**
R: A mudança fica em `changes/` indefinidamente. É importante arquivar após deploy para manter organização.

**P: Como vejo o histórico de mudanças?**
R: Verifique `openspec/changes/archive/` para ver todas as mudanças arquivadas.

---

## 🎯 Resumo Rápido

1. **Nova funcionalidade?** → Crie proposta → Aprove → Implemente → Arquivar
2. **Bug fix?** → Corrija diretamente
3. **Mudança pequena?** → Faça diretamente (ou pergunte se ambíguo)
4. **Sempre valide** antes de arquivar
5. **Sempre comunique** aprovações explicitamente

---

**Lembre-se:** Especificações são a verdade. Mudanças são propostas. Mantenha-os sincronizados! 🎯
