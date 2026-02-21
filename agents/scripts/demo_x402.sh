#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# AgentFi x402 Demo Script
# Shows the full x402 payment flow against a running AgentFi API.
#
# Usage:
#   bash agents/scripts/demo_x402.sh [BASE_URL]
#
# Requires: curl, jq, base64
# ──────────────────────────────────────────────────────────────────

set -euo pipefail

BASE="${1:-http://localhost:8000}"
AGENT="portfolio_analyzer"
BLUE='\033[1;34m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AgentFi — x402 Payment Protocol Demo${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# ── Step 1: Show agent x402 discovery info ──────────────────────
echo -e "${YELLOW}[1/5] Discover x402 pricing for ${AGENT}...${NC}"
echo "  GET ${BASE}/agents/${AGENT}/x402"
echo ""
curl -s "${BASE}/agents/${AGENT}/x402" | jq .
echo ""

# ── Step 2: Call agent WITHOUT payment → expect 402 ─────────────
echo -e "${YELLOW}[2/5] Call agent WITHOUT payment → expect HTTP 402...${NC}"
echo "  POST ${BASE}/agents/${AGENT}/execute"
echo ""

HTTP_CODE=$(curl -s -o /tmp/x402_response.json -w "%{http_code}" \
  -X POST "${BASE}/agents/${AGENT}/execute" \
  -H "Content-Type: application/json" \
  -d '{"query": "Analyze ETH/USDC pool on Uniswap v3"}')

echo -e "  HTTP Status: ${RED}${HTTP_CODE}${NC}"
cat /tmp/x402_response.json | jq .
echo ""

if [ "$HTTP_CODE" != "402" ]; then
  echo -e "${RED}Expected 402 but got ${HTTP_CODE}. x402 might be disabled for this agent.${NC}"
  echo -e "${YELLOW}Continuing demo anyway...${NC}"
  echo ""
fi

# ── Step 3: Show the accepts[] payment requirements ─────────────
echo -e "${YELLOW}[3/5] Parse payment requirements from 402 response...${NC}"
echo ""

ACCEPTS=$(cat /tmp/x402_response.json | jq -r '.accepts // empty')
if [ -n "$ACCEPTS" ]; then
  echo "  Accepted payment methods:"
  echo "$ACCEPTS" | jq -r '.[] | "    - scheme: \(.scheme)  network: \(.network)  amount: \(.maxAmountRequired)  asset: \(.asset)"'
else
  echo "  (No accepts array — agent may not require x402 payment)"
fi
echo ""

# ── Step 4: Build a mock x402 payment header ────────────────────
echo -e "${YELLOW}[4/5] Build X-PAYMENT header (mock EIP-3009 authorization)...${NC}"
echo ""

# This is a DEMO payment payload. In production, the client wallet would
# sign an EIP-3009 transferWithAuthorization and the Pieverse facilitator
# would verify the signature on-chain before settling.
PAYMENT_JSON=$(cat <<'PAYLOAD'
{
  "x402Version": 2,
  "scheme": "exact",
  "network": "eip155:2368",
  "payload": {
    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "authorization": {
      "from": "0x000000000000000000000000000000000000dEaD",
      "to": "0x96455C9b00D530BD0629b71B674298440328b1Dd",
      "value": "10000",
      "validAfter": "0",
      "validBefore": "9999999999",
      "nonce": "0x0000000000000000000000000000000000000000000000000000000000000001"
    }
  }
}
PAYLOAD
)

PAYMENT_B64=$(echo -n "$PAYMENT_JSON" | base64 -w 0 2>/dev/null || echo -n "$PAYMENT_JSON" | base64)

echo "  Payment JSON (truncated):"
echo "$PAYMENT_JSON" | jq -c '{scheme, network, payload: {signature: .payload.signature[:20], authorization: {from: .payload.authorization.from, value: .payload.authorization.value}}}'
echo ""
echo "  X-PAYMENT header (base64, truncated):"
echo "  ${PAYMENT_B64:0:80}..."
echo ""

# ── Step 5: Call agent WITH x402 payment header ─────────────────
echo -e "${YELLOW}[5/5] Call agent WITH X-PAYMENT header...${NC}"
echo "  POST ${BASE}/agents/${AGENT}/execute"
echo "  Headers: X-PAYMENT: <base64 payload>"
echo ""

HTTP_CODE2=$(curl -s -o /tmp/x402_paid_response.json -w "%{http_code}" \
  -D /tmp/x402_headers.txt \
  -X POST "${BASE}/agents/${AGENT}/execute" \
  -H "Content-Type: application/json" \
  -H "X-PAYMENT: ${PAYMENT_B64}" \
  -d '{"query": "Analyze ETH/USDC pool on Uniswap v3"}')

echo -e "  HTTP Status: ${GREEN}${HTTP_CODE2}${NC}"
echo ""

# Check for X-PAYMENT-RESPONSE header (settlement proof)
SETTLEMENT=$(grep -i "x-payment-response" /tmp/x402_headers.txt 2>/dev/null || true)
if [ -n "$SETTLEMENT" ]; then
  echo -e "  ${GREEN}Settlement header found!${NC}"
  SETTLEMENT_B64=$(echo "$SETTLEMENT" | sed 's/.*: //' | tr -d '\r\n')
  echo "  X-PAYMENT-RESPONSE: ${SETTLEMENT_B64:0:60}..."
  echo ""
  echo "  Decoded settlement:"
  echo "$SETTLEMENT_B64" | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "  (could not decode)"
  echo ""
fi

echo "  Response body:"
cat /tmp/x402_paid_response.json | jq .
echo ""

# ── Summary ─────────────────────────────────────────────────────
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Demo Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Flow summary:"
echo "    1. Client discovers pricing via GET /agents/{id}/x402"
echo "    2. Client calls POST /execute without payment → 402"
echo "    3. Client reads accepts[] for payment requirements"
echo "    4. Client signs EIP-3009 authorization, base64-encodes as X-PAYMENT"
echo "    5. Client retries with X-PAYMENT → server verifies via Pieverse"
echo "    6. Server executes agent, settles payment via Pieverse"
echo "    7. Server returns result + X-PAYMENT-RESPONSE header"
echo ""
echo "  Chains involved:"
echo "    - KiteAI (2368): USDT payment settlement"
echo "    - 0G (16602): Agent NFT + on-chain registry"
echo "    - Hedera: HCS attestation + AFC rewards"
echo ""
echo -e "${GREEN}Done.${NC}"
