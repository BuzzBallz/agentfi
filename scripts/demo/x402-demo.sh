#!/bin/bash
# x402 Demo Script for KiteAI judges
# Run: bash scripts/demo/x402-demo.sh

API="${API_BASE:-http://localhost:8000}"

echo "============================================"
echo "  AgentFi x402 Protocol Demo"
echo "============================================"
echo ""

echo "=== Step 1: Request WITHOUT payment ==="
echo "curl -X POST $API/agents/portfolio_analyzer/execute"
echo ""
curl -s -X POST "$API/agents/portfolio_analyzer/execute" \
  -H "Content-Type: application/json" \
  -d '{"query":"Analyze ETH portfolio"}' | python3 -m json.tool 2>/dev/null || echo "(raw response above)"

echo ""
echo "--------------------------------------------"
echo ""

echo "=== Step 2: Check x402 pricing (discovery endpoint) ==="
echo "curl $API/agents/portfolio_analyzer/x402"
echo ""
curl -s "$API/agents/portfolio_analyzer/x402" | python3 -m json.tool 2>/dev/null || echo "(raw response above)"

echo ""
echo "--------------------------------------------"
echo ""

echo "=== Step 3: Request with x402 USDT payment header ==="
echo "Note: Replace PAYMENT_HEADER with a real base64 Pieverse payment"
echo ""

# To generate a real payment header:
# 1. Use Pieverse SDK to create a payment for the amount shown in Step 2
# 2. Base64-encode the payment JSON
# 3. Set it here:
PAYMENT_HEADER="${X402_PAYMENT_HEADER:-}"

if [ -z "$PAYMENT_HEADER" ]; then
  echo "[SKIP] No X402_PAYMENT_HEADER env var set."
  echo "Set it with: export X402_PAYMENT_HEADER='<base64-payment>'"
  echo "Then re-run this script."
else
  curl -s -X POST "$API/agents/portfolio_analyzer/execute" \
    -H "Content-Type: application/json" \
    -H "X-PAYMENT: $PAYMENT_HEADER" \
    -d '{"query":"Analyze ETH portfolio"}' | python3 -m json.tool 2>/dev/null || echo "(raw response above)"
fi

echo ""
echo "============================================"
echo "  Demo complete"
echo "============================================"
