import os
import sys

# Add the project root directory to Python's search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Vercel serverless function entrypoint
