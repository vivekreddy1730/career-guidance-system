#!/usr/bin/env bash
# build.sh — Render.com build script for the Flask backend.
# This runs during the Build phase on Render.

set -o errexit  # Exit on error

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Training ML models..."
python ml/train.py || echo "ML training skipped (non-critical)"

echo "==> Running database setup..."
python -c "
import os, sys
sys.path.insert(0, '.')
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('USE_SQLITE', 'true')
from app import create_app
from extensions import db
app = create_app()
with app.app_context():
    db.create_all()
    from migrations.seed_helper import auto_seed
    auto_seed()
    print('Database tables created and seeded.')
"

echo "==> Build complete!"
