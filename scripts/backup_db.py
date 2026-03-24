from __future__ import annotations

import argparse
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.config import settings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a timestamped backup of the MINERVA SQLite database.")
    parser.add_argument("--source", type=Path, default=settings.database_path, help="Path to the source SQLite database.")
    parser.add_argument("--output-dir", type=Path, default=settings.exports_dir / "backups", help="Directory for backup files.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = args.source
    if not source.exists():
        raise SystemExit(f"Database not found: {source}")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = args.output_dir / f"{source.stem}_{stamp}{source.suffix}"
    shutil.copy2(source, destination)
    print(destination)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
