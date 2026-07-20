"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-13 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role_title", sa.String(length=120), nullable=True),
        sa.Column("location", sa.String(length=120), nullable=True),
        sa.Column("plan", sa.String(length=30), nullable=False, server_default="Free"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "resumes",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("file_size_kb", sa.Integer(), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="Uploaded"),
        sa.Column("uploaded_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_resumes_id", "resumes", ["id"])

    op.create_table(
        "ats_reports",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("overall_score", sa.Float(), nullable=False),
        sa.Column("formatting_score", sa.Float(), nullable=False),
        sa.Column("keyword_score", sa.Float(), nullable=False),
        sa.Column("structure_score", sa.Float(), nullable=False),
        sa.Column("metadata_score", sa.Float(), nullable=False),
        sa.Column("impact_score", sa.Float(), nullable=False),
        sa.Column("scanned_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_ats_reports_id", "ats_reports", ["id"])

    op.create_table(
        "ats_issues",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("report_id", sa.Integer(), sa.ForeignKey("ats_reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("severity", sa.String(length=10), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False),
    )
    op.create_index("ix_ats_issues_id", "ats_issues", ["id"])

    op.create_table(
        "jd_matches",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("role_title", sa.String(length=150), nullable=False),
        sa.Column("company", sa.String(length=150), nullable=False),
        sa.Column("location", sa.String(length=150), nullable=True),
        sa.Column("jd_text", sa.Text(), nullable=False),
        sa.Column("match_score", sa.Float(), nullable=False),
        sa.Column("matched_keywords", sa.Text(), nullable=False),
        sa.Column("missing_keywords", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_jd_matches_id", "jd_matches", ["id"])

    op.create_table(
        "skill_gap_analyses",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_role", sa.String(length=150), nullable=False),
        sa.Column("overall_readiness", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_skill_gap_analyses_id", "skill_gap_analyses", ["id"])

    op.create_table(
        "skill_entries",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("analysis_id", sa.Integer(), sa.ForeignKey("skill_gap_analyses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("level", sa.Float(), nullable=False),
        sa.Column("required", sa.Float(), nullable=False),
    )
    op.create_index("ix_skill_entries_id", "skill_entries", ["id"])

    op.create_table(
        "eligibility_checks",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role_title", sa.String(length=150), nullable=False),
        sa.Column("company", sa.String(length=150), nullable=False),
        sa.Column("experience_level", sa.String(length=30), nullable=False),
        sa.Column("result", sa.String(length=20), nullable=False),
        sa.Column("met_requirements", sa.Integer(), nullable=False),
        sa.Column("total_requirements", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_eligibility_checks_id", "eligibility_checks", ["id"])

    op.create_table(
        "eligibility_requirements",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("check_id", sa.Integer(), sa.ForeignKey("eligibility_checks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("met", sa.Boolean(), nullable=False),
    )
    op.create_index("ix_eligibility_requirements_id", "eligibility_requirements", ["id"])


def downgrade() -> None:
    op.drop_table("eligibility_requirements")
    op.drop_table("eligibility_checks")
    op.drop_table("skill_entries")
    op.drop_table("skill_gap_analyses")
    op.drop_table("jd_matches")
    op.drop_table("ats_issues")
    op.drop_table("ats_reports")
    op.drop_table("resumes")
    op.drop_table("users")
