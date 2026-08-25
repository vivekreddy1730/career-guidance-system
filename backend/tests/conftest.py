"""conftest.py — Ensure backend root is on sys.path for all tests."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))          # backend/tests/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))  # backend/
