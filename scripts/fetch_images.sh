#!/bin/bash
# Sequential image search to avoid rate limits
# Usage: bash fetch_images.sh

IMG_DIR="/home/z/my-project/scripts/img"
cd "$IMG_DIR" || exit 1

search() {
  local name="$1"
  local query="$2"
  local count="$3"
  local retries=0
  local max_retries=3

  # Skip if file already has a valid success JSON with results
  if [ -f "${name}.json.raw" ] && python3 -c "
import json,sys
try:
    raw=open('${name}.json.raw').read()
    start=raw.find('{')
    d=json.loads(raw[start:])
    sys.exit(0 if d.get('success') and d.get('results') else 1)
except Exception:
    sys.exit(1)
" 2>/dev/null; then
    echo "[SKIP] $name already done"
    return 0
  fi

  while [ $retries -lt $max_retries ]; do
    echo "[SEARCH] $name (attempt $((retries+1)))..."
    z-ai image-search -q "$query" -c "$count" --no-rank > "${name}.json.raw" 2>/dev/null
    if python3 -c "
import json,sys
try:
    raw=open('${name}.json.raw').read()
    start=raw.find('{')
    d=json.loads(raw[start:])
    sys.exit(0 if d.get('success') and d.get('results') else 1)
except Exception:
    sys.exit(1)
" 2>/dev/null; then
      echo "[OK] $name"
      return 0
    fi
    retries=$((retries+1))
    echo "[RETRY] $name failed, waiting 5s..."
    sleep 5
  done
  echo "[FAIL] $name after $max_retries attempts"
  return 1
}

search "serum" "skincare serum glass bottle dropper product photography clean background" 8
search "lipstick" "matte lipstick makeup product photography pink background" 6
search "moisturizer" "moisturizer cream jar skincare product photography" 6
search "shampoo" "shampoo bottle hair care product photography" 5
search "perfume" "perfume bottle elegant product photography" 5
search "cleanser" "facial foam cleanser face wash product tube" 5
search "palette" "eyeshadow palette makeup product photography" 5
search "mask" "sheet face mask skincare product packaging" 5
search "bodylotion" "body lotion bottle product photography" 5
search "tools" "makeup brushes set beauty tools" 4
search "banner1" "beauty cosmetics products flat lay pastel pink" 6
search "banner2" "skincare products aesthetic pink advertisement banner" 6

echo "=== ALL DONE ==="
