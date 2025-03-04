"""Add transcription_details column

Revision ID: 98a1b2abd320
Revises: aa5cbb4f2653
Create Date: 2025-01-30 00:44:55.320087

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '98a1b2abd320'
down_revision: Union[str, None] = 'aa5cbb4f2653'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('videos', sa.Column('transcription_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('videos', 'transcription_details')
    # ### end Alembic commands ###
