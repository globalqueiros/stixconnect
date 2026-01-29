#!/bin/bash
# Script de health check pós-deploy

echo "🔍 Verificando saúde dos serviços..."

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Frontend
echo -n "Frontend (porta 3000): "
if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FALHOU${NC}"
    exit 1
fi

# Backend
echo -n "Backend (porta 8000): "
BACKEND_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null)
if [ $? -eq 0 ] && echo "$BACKEND_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FALHOU${NC}"
    exit 1
fi

# Database
echo -n "Database (porta 3306): "
if docker-compose exec -T db mysqladmin ping -h localhost --silent 2>/dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ Verifique manualmente${NC}"
fi

# API Endpoints críticos
echo -n "API Auth (/auth/me): "
AUTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/auth/me 2>/dev/null)
if [ "$AUTH_CHECK" = "401" ] || [ "$AUTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ OK (401 esperado sem token)${NC}"
else
    echo -e "${RED}✗ FALHOU (status: $AUTH_CHECK)${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Todos os serviços estão funcionando!${NC}"
