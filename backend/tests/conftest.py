"""
Pytest configuration and test fixture setup.
Ensures repository root and backend directory are in sys.path.
"""

import sys
from pathlib import Path

# Add workspace root and backend to sys.path
repo_root = Path(__file__).resolve().parent.parent.parent
backend_dir = Path(__file__).resolve().parent.parent

if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
