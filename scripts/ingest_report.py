from __future__ import annotations

import argparse
import glob
import json
import sys
from pathlib import Path
from urllib import error, request


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest MINERVA reports into the local API.")
    parser.add_argument("paths", nargs="*", help="One or more report paths or glob patterns.")
    parser.add_argument("--stdin", action="store_true", help="Read one report from stdin.")
    parser.add_argument("--dry-run", action="store_true", help="Validate only; do not persist.")
    parser.add_argument("--api-base", default="http://127.0.0.1:8000", help="Base URL for the MINERVA API.")
    parser.add_argument("--mode", default="DELTA", choices=["DELTA", "FULL_SCAN"])
    parser.add_argument("--source-model", default="manual-frontier")
    parser.add_argument("--custom-focus", default=None)
    parser.add_argument("--run-id", default=None, help="Existing run id to ingest into.")
    return parser.parse_args()


def post_json(url: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def resolve_inputs(args: argparse.Namespace) -> list[tuple[str, str]]:
    if args.stdin:
        return [("stdin", sys.stdin.read())]
    items: list[tuple[str, str]] = []
    for pattern in args.paths:
        matches = sorted(glob.glob(pattern))
        for matched in matches or [pattern]:
            path = Path(matched)
            if path.is_file():
                items.append((str(path), path.read_text(encoding="utf-8")))
    if not items:
        raise FileNotFoundError("No report inputs matched.")
    return items


def endpoint_for(args: argparse.Namespace) -> str:
    base = args.api_base.rstrip("/")
    if args.run_id:
        return f"{base}/api/analysis/runs/{args.run_id}/ingest?source_model={args.source_model}"
    if args.dry_run:
        return f"{base}/api/ingest/validate"
    return f"{base}/api/ingest"


def payload_for(args: argparse.Namespace, raw_text: str) -> dict:
    if args.run_id:
        return {"raw_text": raw_text}
    return {
        "raw_text": raw_text,
        "mode": args.mode,
        "source_model": args.source_model,
        "custom_focus": args.custom_focus,
    }


def main() -> int:
    args = parse_args()
    try:
        inputs = resolve_inputs(args)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    url = endpoint_for(args)
    exit_code = 0
    for label, raw_text in inputs:
        try:
            response = post_json(url, payload_for(args, raw_text))
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            print(f"[{label}] {body}", file=sys.stderr)
            exit_code = exc.code
            continue
        print(json.dumps({"input": label, "result": response}, indent=2))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
