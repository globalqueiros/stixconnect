"""
Migration: Adicionar campos refresh_token e novos campos ao User
Criada: 19/01/2026
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Adicionar novos campos à tabela users"""
    
    # Adicionar refresh_token
    op.add_column('users', sa.Column('refresh_token', sa.String(512), nullable=True))
    op.add_column('users', sa.Column('refresh_token_expires', sa.DateTime(), nullable=True))
    
    # Adicionar campos de perfil
    op.add_column('users', sa.Column('num_prontuario', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('endereco', sa.String(512), nullable=True))
    op.add_column('users', sa.Column('especialidade', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('crm', sa.String(50), nullable=True))
    
    # Criar índices
    op.create_index('ix_users_refresh_token', 'users', ['refresh_token'])
    op.create_index('ix_users_num_prontuario', 'users', ['num_prontuario'], unique=True)


def downgrade():
    """Remover campos adicionados"""
    
    # Remover índices
    op.drop_index('ix_users_num_prontuario', table_name='users')
    op.drop_index('ix_users_refresh_token', table_name='users')
    
    # Remover colunas
    op.drop_column('users', 'crm')
    op.drop_column('users', 'especialidade')
    op.drop_column('users', 'endereco')
    op.drop_column('users', 'num_prontuario')
    op.drop_column('users', 'refresh_token_expires')
    op.drop_column('users', 'refresh_token')
