"""Create video table

Revision ID: aa5cbb4f2653
Revises: 
Create Date: 2025-01-28 23:59:21.331144

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'aa5cbb4f2653'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('videos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('filename', sa.String(), nullable=True),
    sa.Column('s3_url', sa.String(), nullable=True),
    sa.Column('status', sa.Enum('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', 'QUEUED', name='processingstatus'), nullable=False),
    sa.Column('processing_attempts', sa.Integer(), nullable=True),
    sa.Column('upload_time', sa.DateTime(), nullable=False),
    sa.Column('processed_time', sa.DateTime(), nullable=True),
    sa.Column('last_modified', sa.DateTime(), nullable=False),
    sa.Column('video_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('transcription', sa.Text(), nullable=True),
    sa.Column('summary', sa.Text(), nullable=True),
    sa.Column('analysis_results', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_videos_created_by'), 'videos', ['created_by'], unique=False)
    op.create_index(op.f('ix_videos_filename'), 'videos', ['filename'], unique=False)
    op.create_index(op.f('ix_videos_id'), 'videos', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_videos_id'), table_name='videos')
    op.drop_index(op.f('ix_videos_filename'), table_name='videos')
    op.drop_index(op.f('ix_videos_created_by'), table_name='videos')
    op.drop_table('videos')
    # ### end Alembic commands ###
