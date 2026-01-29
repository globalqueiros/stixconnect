## ADDED Requirements

### Requirement: CORS Configuration
O backend FastAPI MUST configurar CORS para permitir requisições do frontend Next.js.

#### Scenario: Frontend faz requisição ao backend
- **WHEN** o frontend em `localhost:3000` faz uma requisição HTTP ao backend
- **THEN** o backend MUST responder com headers CORS apropriados
- **AND** a requisição MUST ser processada normalmente

#### Scenario: Origem não autorizada
- **WHEN** uma origem não configurada faz requisição ao backend
- **THEN** o backend MUST rejeitar a requisição com erro CORS

### Requirement: Environment Variables
O sistema MUST utilizar variáveis de ambiente para configuração de ambos frontend e backend.

#### Scenario: Backend lê configurações
- **WHEN** o backend inicia
- **THEN** ele MUST carregar configurações de `.env` ou variáveis de ambiente do sistema
- **AND** MUST incluir: DATABASE_URL, SECRET_KEY, ZOOM_*, AWS_*

#### Scenario: Frontend lê configurações
- **WHEN** o frontend inicia
- **THEN** ele MUST carregar variáveis públicas prefixadas com `NEXT_PUBLIC_`
- **AND** MUST incluir: NEXT_PUBLIC_API_URL

### Requirement: API Client
O frontend MUST utilizar um cliente HTTP centralizado para comunicação com o backend.

#### Scenario: Requisição autenticada
- **WHEN** o usuário está logado e faz uma requisição à API
- **THEN** o cliente MUST incluir o header `Authorization: Bearer {token}`

#### Scenario: Token expirado
- **WHEN** o backend retorna status 401 (Unauthorized)
- **THEN** o cliente MUST tentar refresh do token automaticamente
- **AND** SE refresh falhar, MUST redirecionar para página de login

#### Scenario: Erro de rede
- **WHEN** ocorre erro de conexão com o backend
- **THEN** o cliente MUST exibir mensagem de erro apropriada ao usuário
