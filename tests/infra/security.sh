#!/usr/bin/env bash

BASE_URL="https://emu.dellabeneta.com"
PASS=0
FAIL=0

green() { echo -e "\033[32m✔ $1\033[0m"; }
red()   { echo -e "\033[31m✘ $1\033[0m"; }

pass() { green "$1"; ((PASS++)); }
fail() { red "$1";   ((FAIL++)); }

check() {
  local description="$1"
  local condition="$2"
  if eval "$condition"; then
    pass "$description"
  else
    fail "$description"
  fi
}

echo ""
echo "═══════════════════════════════════════════"
echo "  RetroVault — Testes de Infraestrutura"
echo "═══════════════════════════════════════════"
echo ""

# ── Site acessível ──────────────────────────────
echo "[ Site ]"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
check "Site responde 200" '[ "$STATUS" = "200" ]'
echo ""

# ── Hotlink protection ──────────────────────────
echo "[ Hotlink Protection ]"
ROM_URL="$BASE_URL/roms/snes/aladdin.sfc"

STATUS_HOTLINK=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Referer: https://outrosite.com" "$ROM_URL")
check "Bloqueia ROM com Referer externo (403)" \
  '[ "$STATUS_HOTLINK" = "403" ]'

STATUS_OWN=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Referer: https://emu.dellabeneta.com" "$ROM_URL")
check "Permite ROM com Referer próprio (200)" \
  '[ "$STATUS_OWN" = "200" ]'
echo ""

# ── Resumo ──────────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  Resultado: $PASS passou(aram) | $FAIL falhou(aram)"
echo "═══════════════════════════════════════════"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
