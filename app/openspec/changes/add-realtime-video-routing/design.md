## Context
O sistema StixConnect atualmente permite que pacientes solicitem consultas, mas o processo de conexão com profissionais não é automatizado. Quando um paciente solicita uma videochamada urgente, ele fica aguardando até que um enfermeiro manualmente inicie o atendimento. Após a triagem, o enfermeiro precisa manualmente atribuir a um médico, sem uma interface clara para escolher entre diferentes tipos de profissionais de saúde.

## Goals / Non-Goals

### Goals
- Automatizar o direcionamento de pacientes para enfermeiros disponíveis
- Fornecer interface clara para enfermeiros escolherem o profissional adequado
- Suportar todos os 9 tipos de profissionais: Médico, Fisioterapeuta, Cuidador, Nutricionista, Cabeleireiro, Psicólogo, Fonoaudiólogo, Acupuntura, Psicopedagogia Clínica
- Notificar em tempo real sobre status de conexão
- Manter compatibilidade com fluxo existente de consultas

### Non-Goals
- Substituir completamente o sistema de agendamento (apenas melhorar urgências)
- Implementar sistema de priorização complexo (começar com round-robin simples)
- Adicionar sistema de avaliação de profissionais nesta fase
- Implementar sistema de reserva de horários

## Decisions

### Decision: Sistema de Fila com Round-Robin
**O que**: Distribuir pacientes para enfermeiros usando algoritmo round-robin simples (próximo disponível na lista).

**Por quê**: 
- Simples de implementar e manter
- Garante distribuição equilibrada de carga
- Pode ser melhorado futuramente com algoritmos mais sofisticados

**Alternativas consideradas**:
- **Fila única com primeiro disponível**: Mais simples, mas pode sobrecarregar um enfermeiro
- **Algoritmo baseado em carga**: Mais complexo, requer métricas de carga que ainda não temos
- **Escolha manual pelo paciente**: Não atende ao requisito de direcionamento automático

### Decision: WebSocket para Notificações em Tempo Real
**O que**: Usar WebSocket existente para notificar enfermeiros sobre novas solicitações e pacientes sobre status.

**Por quê**:
- Já temos infraestrutura WebSocket implementada
- Baixa latência para notificações
- Suporta comunicação bidirecional

**Alternativas consideradas**:
- **Polling HTTP**: Mais simples, mas maior latência e carga no servidor
- **Server-Sent Events (SSE)**: Bom para notificações unidirecionais, mas WebSocket já está implementado

### Decision: Status de Disponibilidade Simples
**O que**: Implementar status simples: `online` (disponível), `busy` (em atendimento), `offline` (indisponível).

**Por quê**:
- Suficiente para o caso de uso inicial
- Fácil de implementar e entender
- Pode ser estendido futuramente com mais granularidade

**Alternativas consideradas**:
- **Status mais granular**: (disponível, em triagem, em consulta, pausa, etc.) - Mais complexo, não necessário agora
- **Sistema de presença avançado**: Requer mais infraestrutura, pode ser adicionado depois

### Decision: Interface de Seleção de Profissional na Tela de Triagem
**O que**: Adicionar componente de seleção de profissional diretamente na interface de triagem do enfermeiro.

**Por quê**:
- Fluxo natural: enfermeiro faz triagem e imediatamente escolhe o profissional
- Reduz número de cliques e telas
- Contexto da triagem ajuda na escolha

**Alternativas consideradas**:
- **Tela separada de transferência**: Mais cliques, menos eficiente
- **Sugestão automática baseada em triagem**: Mais complexo, pode ser adicionado depois

## Risks / Trade-offs

### Risco: Enfermeiros sobrecarregados
**Mitigação**: 
- Implementar limite de pacientes simultâneos por enfermeiro
- Adicionar indicador visual de carga
- Permitir que enfermeiro marque como "ocupado"

### Risco: Latência na conexão WebSocket
**Mitigação**:
- Implementar fallback para polling se WebSocket falhar
- Adicionar timeout e retry logic
- Monitorar métricas de conexão

### Risco: Profissionais não disponíveis
**Mitigação**:
- Mostrar claramente quando não há profissionais disponíveis
- Permitir que paciente aguarde ou cancele
- Notificar quando profissional ficar disponível

### Trade-off: Simplicidade vs. Funcionalidade
Escolhemos começar simples (round-robin, status básico) para entregar valor rápido. Funcionalidades avançadas (algoritmos inteligentes, presença avançada) podem ser adicionadas em iterações futuras.

## Migration Plan

### Fase 1: Backend (Sem Breaking Changes)
1. Adicionar campos de disponibilidade ao modelo User (nullable, default online)
2. Criar endpoints de roteamento (não modificar endpoints existentes)
3. Adicionar eventos WebSocket (compatíveis com clientes existentes)
4. Implementar serviço de roteamento

### Fase 2: Frontend (Adição Gradual)
1. Adicionar interface de fila para enfermeiros (nova rota, não modifica existente)
2. Adicionar componente de seleção de profissional (opcional inicialmente)
3. Adicionar notificações WebSocket (graceful degradation se não conectado)
4. Migrar gradualmente fluxo existente para usar novo roteamento

### Fase 3: Rollout
1. Testar com grupo pequeno de enfermeiros
2. Coletar feedback e ajustar
3. Ativar para todos os usuários
4. Desativar fluxo antigo após validação

### Rollback
- Todos os endpoints antigos continuam funcionando
- Se necessário, desativar novos endpoints via feature flag
- Frontend pode voltar a usar fluxo antigo removendo componentes novos

## Open Questions
- Deve haver limite de pacientes simultâneos por enfermeiro? (Decisão: Sim, começar com 3)
- Como lidar com pacientes que cancelam enquanto aguardam? (Decisão: Notificar enfermeiro e remover da fila)
- Deve haver priorização de pacientes urgentes? (Decisão: Não na primeira versão, adicionar depois)
- Como garantir que enfermeiro não perca notificação se estiver offline? (Decisão: Notificação push + email se offline por >5min)
