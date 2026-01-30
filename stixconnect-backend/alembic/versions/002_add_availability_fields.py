"""
Migration: Adicionar campos de disponibilidade e capacidade ao User
Criada: 28/01/2026
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "002_add_availability_fields"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Adicionar campos de disponibilidade na tabela users."""
    availability_enum = sa.Enum(
        "online",
        "busy",
        "offline",
        name="availabilitystatus",
    )
    availability_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "users",
        sa.Column(
            "disponibilidade",
            availability_enum,
            nullable=False,
            server_default="online",
        ),
    )
    op.add_column(
        "users",
        sa.Column("pacientes_atuais", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("limite_pacientes", sa.Integer(), nullable=False, server_default="3"),
    )


def downgrade() -> None:
    """Remover campos de disponibilidade."""
    op.drop_column("users", "limite_pacientes")
    op.drop_column("users", "pacientes_atuais")
    op.drop_column("users", "disponibilidade")

    availability_enum = sa.Enum(
        "online",
        "busy",
        "offline",
        name="availabilitystatus",
    )
    availability_enum.drop(op.get_bind(), checkfirst=True)

