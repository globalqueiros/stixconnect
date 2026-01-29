## ADDED Requirements

### Requirement: S3 File Upload
O backend MUST fornecer endpoint para upload de arquivos ao AWS S3.

#### Scenario: Upload bem-sucedido
- **WHEN** usuário autenticado faz POST `/files/upload` com arquivo
- **THEN** o backend MUST fazer upload do arquivo para S3
- **AND** MUST retornar URL pública do arquivo
- **AND** MUST retornar status 201

#### Scenario: Arquivo muito grande
- **WHEN** usuário tenta fazer upload de arquivo maior que 10MB
- **THEN** o backend MUST rejeitar com status 413 (Payload Too Large)
- **AND** MUST retornar mensagem de erro clara

#### Scenario: Tipo de arquivo não permitido
- **WHEN** usuário tenta fazer upload de tipo não permitido
- **THEN** o backend MUST rejeitar com status 400
- **AND** MUST listar tipos permitidos na mensagem de erro

#### Scenario: Credenciais AWS inválidas
- **WHEN** credenciais AWS estão incorretas ou ausentes
- **THEN** o backend MUST retornar status 500
- **AND** MUST logar erro sem expor credenciais

### Requirement: File Types
O sistema MUST suportar tipos de arquivo específicos para uso médico.

#### Scenario: Tipos permitidos
- **WHEN** arquivo é enviado para upload
- **THEN** sistema MUST aceitar: PDF, JPG, PNG, JPEG, DICOM
- **AND** MUST rejeitar executáveis e scripts

#### Scenario: Validação de conteúdo
- **WHEN** arquivo é recebido
- **THEN** sistema MUST validar MIME type real do arquivo
- **AND** MUST NOT confiar apenas na extensão do arquivo

### Requirement: File Organization
Arquivos MUST ser organizados no S3 por paciente e data.

#### Scenario: Estrutura de pastas
- **WHEN** arquivo é enviado para paciente
- **THEN** MUST ser salvo em `/{patient_id}/{year}/{month}/{filename}`

#### Scenario: Nome único
- **WHEN** arquivo é salvo
- **THEN** MUST ter UUID prefixado para evitar colisões
- **AND** MUST preservar nome original para exibição

### Requirement: File Access Control
Acesso a arquivos MUST ser controlado por permissões.

#### Scenario: Médico acessa arquivo de paciente
- **WHEN** médico atribuído à consulta solicita arquivo do paciente
- **THEN** sistema MUST permitir download

#### Scenario: Usuário não autorizado
- **WHEN** usuário sem permissão solicita arquivo
- **THEN** sistema MUST retornar status 403
- **AND** MUST logar tentativa de acesso
