# Guia do Workflow OpenSpec - Como Trabalhar com IA Assistente

## 📋 Visão Geral

O OpenSpec é um sistema de **desenvolvimento orientado por especificações** que organiza mudanças em 3 estágios:

1. **Propostas** (`changes/`) - O que DEVE ser construído
2. **Especificações** (`specs/`) - O que JÁ foi construído (verdade atual)
3. **Arquivo** (`archive/`) - O que FOI completado

## 🔄 Os 3 Estágios do Workflow

### Estágio 1: Criar Propostas de Mudança

**Quando criar uma proposta:**
- ✅ Adicionar novas funcionalidades
- ✅ Fazer mudanças que quebram compatibilidade (API, schema)
- ✅ Mudar arquitetura ou padrões
- ✅ Otimizar performance (que muda comportamento)
- ✅ Atualizar padrões de segurança

**Quando NÃO criar proposta:**
- ❌ Correção de bugs (restaurar comportamento esperado)
- ❌ Erros de digitação, formatação, comentários
- ❌ Atualizações de dependências (não quebram compatibilidade)
- ❌ Mudanças de configuração
- ❌ Testes para comportamento existente

**Como solicitar uma proposta:**
Você pode me pedir de várias formas:
- "Help me create a change proposal"
- "Help me plan a change"
- "I want to create a spec proposal"
- "Quero criar uma proposta para [funcionalidade]"

**O que eu faço:**
1. Analiso o contexto do projeto (`openspec/project.md`)
2. Verifico mudanças pendentes e especificações existentes
3. Crio estrutura da proposta:
   - `proposal.md` - Por quê, o que muda, impacto
   - `tasks.md` - Checklist de implementação
   - `design.md` - Decisões técnicas (se necessário)
   - `specs/[capability]/spec.md` - Especificações detalhadas

**Formato das especificações:**
```markdown
## ADDED Requirements
### Requirement: Nova Funcionalidade
O sistema SHALL fazer algo...

#### Scenario: Caso de sucesso
- **WHEN** usuário faz ação
- **THEN** resultado esperado
```

**Importante:** 
- ⚠️ **NÃO implemento código até a proposta ser aprovada**
- ⚠️ Valido a proposta antes de apresentar
- ⚠️ Aguardo sua aprovação antes de começar implementação

---

### Estágio 2: Implementar Mudanças

**Quando começar implementação:**
- ✅ Proposta foi revisada e aprovada por você
- ✅ Você me pede explicitamente para implementar

**Como solicitar implementação:**
- "Please implement [change-id]"
- "Vamos implementar a proposta [nome]"
- "Start implementing the changes"

**O que eu faço:**
1. Leio `proposal.md` para entender o escopo
2. Leio `design.md` (se existir) para decisões técnicas
3. Sigo `tasks.md` sequencialmente
4. Implemento código seguindo as especificações
5. Atualizo checklist marcando tarefas como concluídas `- [x]`

**Durante implementação:**
- Você pode me pedir para focar em tarefas específicas
- Posso fazer perguntas se algo estiver ambíguo
- Mantenho você informado sobre progresso

---

### Estágio 3: Arquivar Mudanças

**Quando arquivar:**
- ✅ Implementação completa e testada
- ✅ Código deployado em produção
- ✅ Especificações atualizadas

**O que acontece:**
- Proposta move de `changes/[nome]/` → `changes/archive/YYYY-MM-DD-[nome]/`
- Especificações em `specs/` são atualizadas com mudanças
- Proposta fica como referência histórica

---

## 🎯 Como Trabalhar Comigo

### Para Criar Propostas

**1. Descreva o que você quer:**
```
"Quero adicionar um sistema de notificações push para pacientes"
```

**2. Eu vou:**
- Verificar se já existe algo similar
- Criar proposta estruturada
- Perguntar se algo estiver ambíguo

**3. Você revisa e aprova:**
- Leia `proposal.md` para entender o escopo
- Verifique `design.md` para decisões técnicas
- Aprove ou peça ajustes

### Para Implementar

**1. Aprove a proposta:**
```
"Está aprovado, pode implementar"
"Vamos implementar a proposta add-realtime-video-routing"
```

**2. Eu implemento:**
- Sigo `tasks.md` sequencialmente
- Implemento código seguindo especificações
- Atualizo checklist

**3. Você testa e valida:**
- Testa funcionalidade
- Revisa código se necessário
- Aprova para deploy

### Para Correções Rápidas

**Bugs, typos, formatação:**
```
"Corrige o bug na função X"
"Adiciona comentário explicando Y"
```
→ Eu faço diretamente, sem criar proposta

---

## 📁 Estrutura de Arquivos

```
openspec/
├── project.md              # Convenções do projeto (stack, padrões)
│
├── specs/                  # VERDADE ATUAL - O que está construído
│   └── [capability]/
│       └── spec.md         # Requisitos e cenários
│
└── changes/                # PROPOSTAS - O que deve mudar
    ├── [change-id]/
    │   ├── proposal.md     # Por quê, o que muda, impacto
    │   ├── tasks.md         # Checklist de implementação
    │   ├── design.md       # Decisões técnicas (opcional)
    │   └── specs/
    │       └── [capability]/
    │           └── spec.md  # ADDED/MODIFIED/REMOVED
    │
    └── archive/            # COMPLETADAS - Mudanças finalizadas
```

---

## 🔍 Comandos Úteis (se tiver CLI OpenSpec)

```bash
# Ver mudanças ativas
openspec list

# Ver especificações existentes
openspec list --specs

# Ver detalhes de uma proposta
openspec show add-realtime-video-routing

# Validar proposta
openspec validate add-realtime-video-routing --strict

# Arquivar após deploy
openspec archive add-realtime-video-routing --yes
```

---

## 💡 Dicas para Trabalhar Eficientemente

### 1. Seja Específico
❌ "Melhora o sistema de login"
✅ "Adiciona autenticação de dois fatores com OTP por email"

### 2. Aprove Propostas Antes de Implementar
- Propostas são baratas (só texto)
- Implementação é cara (código, testes, deploy)
- Revisar proposta evita retrabalho

### 3. Use Propostas para Planejamento
- Propostas servem como documentação
- Podem ser revisadas por equipe
- Facilitam estimativas de esforço

### 4. Peça Esclarecimentos
Se algo estiver ambíguo, eu pergunto. Mas você também pode:
- "Preciso de mais detalhes sobre X"
- "Como isso se integra com Y?"
- "Qual a melhor abordagem para Z?"

---

## 🚨 Regras Importantes

### ⚠️ Gate de Aprovação
**NUNCA** começo implementação sem aprovação explícita da proposta.

### ⚠️ Especificações são Verdade
- `specs/` = O que ESTÁ construído
- `changes/` = O que DEVE ser construído
- Mantemos sincronizados

### ⚠️ Formato de Cenários
Cenários DEVEM usar formato exato:
```markdown
#### Scenario: Nome do cenário
- **WHEN** condição
- **THEN** resultado
```

### ⚠️ Cada Requisito Precisa de Cenário
Todo `### Requirement:` DEVE ter pelo menos um `#### Scenario:`

---

## 📝 Exemplo Completo de Fluxo

### 1. Você solicita:
```
"Quero criar uma proposta para adicionar roteamento inteligente 
de videochamadas que direciona pacientes para enfermeiros 
disponíveis"
```

### 2. Eu crio proposta:
- ✅ Verifico contexto do projeto
- ✅ Crio `proposal.md` explicando por quê e o que muda
- ✅ Crio `design.md` com decisões técnicas
- ✅ Crio `tasks.md` com checklist
- ✅ Crio `specs/` com requisitos detalhados

### 3. Você revisa:
- Lê os arquivos
- Faz perguntas se necessário
- Aprova ou pede ajustes

### 4. Você aprova:
```
"Proposta aprovada, pode implementar"
```

### 5. Eu implemento:
- Sigo `tasks.md` sequencialmente
- Implemento código
- Atualizo checklist

### 6. Você testa e valida:
- Testa funcionalidade
- Aprova para deploy

### 7. Após deploy:
- Arquivamos a proposta
- Atualizamos especificações

---

## ❓ Perguntas Frequentes

**Q: Posso pular a proposta e pedir implementação direta?**
A: Para mudanças pequenas (bugs, typos), sim. Para funcionalidades novas, é melhor criar proposta primeiro.

**Q: E se eu quiser mudar algo durante implementação?**
A: Me avise! Posso ajustar a proposta ou fazer mudanças incrementais.

**Q: Como sei quais propostas estão pendentes?**
A: Veja em `openspec/changes/` ou me pergunte "Quais propostas estão pendentes?"

**Q: Posso ter múltiplas propostas ativas?**
A: Sim! Mas é melhor focar em uma por vez para evitar conflitos.

**Q: E se a proposta estiver errada?**
A: Sem problemas! Podemos ajustar antes de implementar, ou você pode pedir para recriar.

---

## 🎯 Resumo Rápido

| Você Quer | Me Peça Assim | O Que Acontece |
|-----------|---------------|----------------|
| Nova funcionalidade | "Criar proposta para [X]" | Crio proposta, aguardo aprovação |
| Implementar proposta | "Implementar [change-id]" | Implemento seguindo tasks.md |
| Correção rápida | "Corrige bug em [X]" | Faço diretamente |
| Ver propostas | "Listar propostas" | Mostro mudanças ativas |
| Ajustar proposta | "Ajustar [change-id]" | Modifico arquivos da proposta |

---

**Lembre-se:** Especificações são verdade. Mudanças são propostas. Mantemos sincronizados! 🚀
