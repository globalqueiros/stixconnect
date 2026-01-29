-- StixConnect - Script de Inicialização do Banco de Dados
-- Este script é executado automaticamente na primeira inicialização do container MySQL

-- Criar usuário de aplicação com permissões limitadas
CREATE USER IF NOT EXISTS 'stixconnect_app'@'%' IDENTIFIED BY 'stixconnect_app_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON stixconnect.* TO 'stixconnect_app'@'%';

-- Configurações de charset para suporte completo a Unicode
ALTER DATABASE stixconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Log de inicialização
SELECT 'StixConnect database initialized successfully!' AS message;
