"""skill gap: persist structured recommendations

Revision ID: 0003_skill_gap_recommendations
Revises: 0002_resume_management
Create Date: 2026-07-19 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_skill_gap_recommendations"
down_revision: Union[str, None] = "0002_resume_management"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "skill_gap_analyses",
        sa.Column("recommendations", sa.JSON(), nullable=False, server_default="[]"),
    )


def downgrade() -> None:
    op.drop_column("skill_gap_analyses", "recommendations")