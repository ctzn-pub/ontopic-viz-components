#!/usr/bin/env python3
"""
Upload "Picturing American Health" book figure extracts to the Tigris
sample-data bucket so the registry's .catalog.json sidecars resolve a live
preview URL (the gallery CI pings each url; a 404 fails the build).

Source extracts:
  ~/Library/CloudStorage/Box-Box/visualization_book_us_health/extracts/<ch>/<file>.json
Destination:
  s3://ontopic-public-data/sample-data/<slug>.json
  -> served at https://ontopic-public-data.t3.storage.dev/sample-data/<slug>.json

Two geo components (bivariate choropleth, county hexbin) need a county
topology + values. The existing bucket geo/us-counties-10m.json has only
states/nation, so we (a) upload the book's county topology once, and (b)
bundle topology+values into a single preview payload so the gallery's
`passthrough` transform renders without a custom transform in ctzn-pub.

Credentials are read from ctzn-pub/.env (+ .env.local override). Idempotent:
skips keys that already exist unless --force. Dry-run by default; pass --upload
to actually write.
"""
import argparse
import json
import os
import sys
from pathlib import Path

BOX = Path.home() / "Library/CloudStorage/Box-Box/visualization_book_us_health/extracts"
CTZN_PUB = Path.home() / "github/ctzn-pub"
BUCKET = "ontopic-public-data"
PREFIX = "sample-data"
PUBLIC_BASE = f"https://{BUCKET}.t3.storage.dev/{PREFIX}"

# (source extract relative to BOX, destination slug under sample-data/)
# Self-contained payloads -> passthrough.
DIRECT = {
    "ch08/gradient-diabetes-by-adi.json": "picturing-health-disparity-gradient.json",
    "ch10/parallel-coords.json":          "picturing-health-parallel-coords.json",
    "ch11/marginal-income.json":          "picturing-health-marginal-effect.json",
    "ch02/obesity-ridge-by-region.json":  "picturing-health-ridge.json",
    "ch04/access-paired.json":            "picturing-health-paired-bars.json",
    "ch10/pca-biplot.json":               "picturing-health-pca-biplot.json",
    "ch11/forest.json":                   "picturing-health-forest.json",
    "ch01/opening-scatter.json":          "picturing-health-scatter-loess.json",
    "ch05/state-slope.json":              "picturing-health-slopegraph.json",
    "ch05/state-year-heatmap.json":       "picturing-health-state-year-heatmap.json",
}

# Geo bundles: (values extract, topo extract, destination slug). The bundled
# payload is { "topology": <topojson>, ...<original values keys> } so the
# component reads topology from one fetched object.
BUNDLES = {
    "picturing-health-bivariate-choropleth.json": (
        "ch08/bivariate-adi-diabetes.json", "ch08/counties-topo.json",
    ),
    "picturing-health-county-hexbin.json": (
        "ch07/obesity-county.json", "ch07/counties-topo.json",
    ),
}


def load_env():
    env = {}
    for name in (".env", ".env.local"):
        p = CTZN_PUB / name
        if not p.exists():
            continue
        for line in p.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def make_client(env):
    import boto3
    from botocore.config import Config
    return boto3.client(
        "s3",
        endpoint_url=env["TIGRIS_ENDPOINT"],
        aws_access_key_id=env["TIGRIS_CLIENT_ID"],
        aws_secret_access_key=env["TIGRIS_CLIENT_SECRET"],
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def key_exists(s3, key):
    try:
        s3.head_object(Bucket=BUCKET, Key=key)
        return True
    except Exception:
        return False


def put_json(s3, key, obj, dry, force):
    if not force and key_exists(s3, key):
        print(f"  SKIP (exists)   {key}")
        return f"{PUBLIC_BASE.rsplit('/',1)[0]}/{key}"
    body = json.dumps(obj).encode("utf-8")
    size_kb = len(body) / 1024
    if dry:
        print(f"  WOULD UPLOAD    {key}  ({size_kb:,.0f} KB)")
    else:
        s3.put_object(Bucket=BUCKET, Key=key, Body=body,
                      ContentType="application/json")
        print(f"  UPLOADED        {key}  ({size_kb:,.0f} KB)")
    return f"https://{BUCKET}.t3.storage.dev/{key}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--upload", action="store_true", help="actually write (default: dry-run)")
    ap.add_argument("--force", action="store_true", help="overwrite existing keys")
    args = ap.parse_args()
    dry = not args.upload

    if not BOX.exists():
        sys.exit(f"Box extracts dir not found: {BOX}")
    env = load_env()
    for need in ("TIGRIS_ENDPOINT", "TIGRIS_CLIENT_ID", "TIGRIS_CLIENT_SECRET"):
        if not env.get(need):
            sys.exit(f"Missing {need} in {CTZN_PUB}/.env(.local)")

    s3 = make_client(env)
    print(f"{'DRY RUN' if dry else 'UPLOAD'} -> s3://{BUCKET}/{PREFIX}/\n")

    urls = {}

    print("Direct payloads (passthrough):")
    for src, slug in DIRECT.items():
        p = BOX / src
        if not p.exists():
            print(f"  MISSING SOURCE  {src}")
            continue
        obj = json.loads(p.read_text())
        urls[slug] = put_json(s3, f"{PREFIX}/{slug}", obj, dry, args.force)

    print("\nGeo bundles (topology + values, passthrough):")
    for slug, (vsrc, tsrc) in BUNDLES.items():
        vp, tp = BOX / vsrc, BOX / tsrc
        if not vp.exists() or not tp.exists():
            print(f"  MISSING SOURCE  {vsrc} / {tsrc}")
            continue
        values = json.loads(vp.read_text())
        topo = json.loads(tp.read_text())
        bundle = {"topology": topo, **values}
        urls[slug] = put_json(s3, f"{PREFIX}/{slug}", bundle, dry, args.force)

    print("\nResolved sidecar URLs:")
    for slug, url in urls.items():
        print(f"  {slug:48s} {url}")

    out = CTZN_PUB.parent / "ontopic-viz-components/scripts/sample-data-urls.json"
    if not dry:
        out.write_text(json.dumps(urls, indent=2))
        print(f"\nWrote URL manifest -> {out}")


if __name__ == "__main__":
    main()
