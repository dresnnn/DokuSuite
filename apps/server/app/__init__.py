import sys
from pathlib import Path

# Make shared packages importable (e.g., workers)
sys.path.append(str(Path(__file__).resolve().parents[3] / "packages"))
