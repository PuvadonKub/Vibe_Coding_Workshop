"""Add images column to products

Revision ID: b37860466cab
Revises: 3ac05fdbbbe6
Create Date: 2025-11-20 16:40:07.454175

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b37860466cab'
down_revision: Union[str, Sequence[str], None] = '3ac05fdbbbe6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add images column to products table
    op.add_column('products', sa.Column('images', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove images column from products table
    op.drop_column('products', 'images')
