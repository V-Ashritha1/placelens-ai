"""skill gap: add ai_summary column

Revision ID: 0004_skill_gap_ai_summary
Revises: 0003_skill_gap_recommendations
Create Date: 2026-07-20 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_skill_gap_ai_summary"
down_revision: Union[str, None] = "0003_skill_gap_recommendations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "skill_gap_analyses",
        sa.Column("ai_summary", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("skill_gap_analyses", "ai_summary")