"""resume management: display_name and is_default

Revision ID: 0002_resume_management
Revises: 0001_initial
Create Date: 2026-07-18 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_resume_management"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("resumes", sa.Column("display_name", sa.String(length=255), nullable=True))
    op.add_column(
        "resumes",
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("resumes", "is_default")
    op.drop_column("resumes", "display_name")