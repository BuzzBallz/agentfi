#!/usr/bin/env bash
# scripts/sync-abis.sh
# Usage: ./scripts/sync-abis.sh
# Run this after every: forge build or forge script deploy

set -e

CONTRACTS=("AgentNFT" "AgentMarketplace" "AgentPayment")
OUT_DIR="contracts/out"
ABI_DIR="frontend/src/abi"

echo "Syncing ABIs from $OUT_DIR -> $ABI_DIR"
echo ""

# Validate all artifacts exist before touching anything
for CONTRACT in "${CONTRACTS[@]}"; do
  SRC="$OUT_DIR/$CONTRACT.sol/$CONTRACT.json"
  if [ ! -f "$SRC" ]; then
    echo "ERROR: Missing artifact: $SRC"
    echo "  Did you run: forge build?"
    exit 1
  fi
done

# Extract ABI and write to frontend
mkdir -p "$ABI_DIR"
for CONTRACT in "${CONTRACTS[@]}"; do
  SRC="$OUT_DIR/$CONTRACT.sol/$CONTRACT.json"
  DEST="$ABI_DIR/$CONTRACT.json"
  jq '.abi' "$SRC" > "$DEST"
  echo "OK: $CONTRACT.json"
done

echo ""
echo "All ABIs synced to $ABI_DIR"
echo ""
echo "Next steps:"
echo "  git add frontend/src/abi/ deployments.json"
echo "  git commit -m 'chore: sync ABIs after deploy'"
echo "  Notify Person B to pull and restart frontend"
