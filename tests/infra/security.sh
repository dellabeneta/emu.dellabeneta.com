#!/usr/bin/env bash

# Testes de borda (Cloudflare) do RetroVault.
#
# O site é restrito ao Brasil por regra de WAF. Runners do GitHub são
# estrangeiros, então as requisições precisam do header de exceção
# (SMOKE_KEY) para chegar ao conteúdo. As que NÃO levam o header servem
# como teste negativo do próprio bloqueio.

BASE_URL="https://emu.dellabeneta.com"
ROM_URL="$BASE_URL/roms/snes/aladdin.sfc"

PASS=0
FAIL=0
SKIP=0

green() { echo -e "\033[32m✔ $1\033[0m"; }
red()   { echo -e "\033[31m✘ $1\033[0m"; }
grey()  { echo -e "\033[90m— $1\033[0m"; }

pass() { green "$1"; PASS=$((PASS + 1)); }
fail() { red   "$1"; FAIL=$((FAIL + 1)); }
skip() { grey  "$1"; SKIP=$((SKIP + 1)); }

check() {
  local description="$1"
  local condition="$2"
  if eval "$condition"; then
    pass "$description"
  else
    fail "$description"
  fi
}

# curl autenticado: passa pela regra de geo via header de exceção.
auth_curl() {
  if [ -n "${SMOKE_KEY:-}" ]; then
    curl -s -H "x-smoke-key: ${SMOKE_KEY}" "$@"
  else
    curl -s "$@"
  fi
}

echo ""
echo "═══════════════════════════════════════════"
echo "  RetroVault — Testes de Infraestrutura"
echo "═══════════════════════════════════════════"
echo ""

# ── Origem da execução ──────────────────────────
# /cdn-cgi/trace da própria Cloudflare informa o país de saída.
# Define quais asserções fazem sentido aqui.
ORIGIN_LOC=$(curl -s --max-time 10 https://cloudflare.com/cdn-cgi/trace | grep '^loc=' | cut -d= -f2 | tr -d '\r')
[ -z "$ORIGIN_LOC" ] && ORIGIN_LOC="??"
echo "[ Contexto ]"
grey "País de saída desta execução: $ORIGIN_LOC"
if [ -z "${SMOKE_KEY:-}" ]; then
  grey "SMOKE_KEY ausente — requisições irão sem o header de exceção"
fi
echo ""

# ── Site acessível ──────────────────────────────
echo "[ Site ]"
if [ "$ORIGIN_LOC" != "BR" ] && [ -z "${SMOKE_KEY:-}" ]; then
  fail "Site responde 200 — execução fora do BR e sem SMOKE_KEY definido"
  grey "  Defina SMOKE_KEY (secret) e crie a exceção por header na regra de WAF."
else
  STATUS=$(auth_curl -o /dev/null -w "%{http_code}" "$BASE_URL")
  check "Site responde 200" '[ "$STATUS" = "200" ]'
fi
echo ""

# ── Bloqueio geográfico (teste negativo) ────────
# Só é conclusivo quando a execução parte de fora do Brasil — o que é
# justamente o caso no CI. Rodando local (BR), é pulado.
echo "[ Bloqueio Geográfico ]"
if [ "$ORIGIN_LOC" = "BR" ]; then
  skip "Bloqueio de país — execução partindo do BR, teste não é conclusivo"
elif [ "$ORIGIN_LOC" = "??" ]; then
  skip "Bloqueio de país — não foi possível determinar o país de saída"
else
  STATUS_GEO=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
  check "Bloqueia acesso de fora do BR (403) — origem: $ORIGIN_LOC" \
    '[ "$STATUS_GEO" = "403" ]'
fi
echo ""

# ── Security headers ────────────────────────────
echo "[ Security Headers ]"
HEADERS=$(auth_curl -I "$BASE_URL")

check "X-Frame-Options: SAMEORIGIN" \
  'echo "$HEADERS" | grep -qi "x-frame-options: SAMEORIGIN"'

check "X-Content-Type-Options: nosniff" \
  'echo "$HEADERS" | grep -qi "x-content-type-options: nosniff"'

check "Referrer-Policy: strict-origin-when-cross-origin" \
  'echo "$HEADERS" | grep -qi "referrer-policy: strict-origin-when-cross-origin"'

check "Strict-Transport-Security presente" \
  'echo "$HEADERS" | grep -qi "strict-transport-security"'

# HSTS abaixo de 1 ano não qualifica para preload — avisa sem reprovar.
HSTS_AGE=$(echo "$HEADERS" | grep -i "strict-transport-security" | grep -o 'max-age=[0-9]*' | cut -d= -f2)
if [ -n "$HSTS_AGE" ] && [ "$HSTS_AGE" -lt 31536000 ]; then
  grey "  HSTS max-age=$HSTS_AGE (< 1 ano; insuficiente para preload)"
fi
echo ""

# ── HTTPS obrigatório ───────────────────────────
echo "[ HTTPS ]"
STATUS_HTTP=$(auth_curl -o /dev/null -w "%{http_code}" "http://emu.dellabeneta.com")
check "http:// redireciona (301/308)" \
  '[ "$STATUS_HTTP" = "301" ] || [ "$STATUS_HTTP" = "308" ]'
echo ""

# ── Cache das ROMs (guarda de regressão) ────────
# Protege a Cache Rule de /roms/*: extensões como .nes/.sfc não são
# cacheáveis por padrão no plano Free e voltariam a bater no S3.
echo "[ Cache — ROMs ]"
ROM_HEADERS=$(auth_curl -I "$ROM_URL")
CF_STATUS=$(echo "$ROM_HEADERS" | grep -i '^cf-cache-status:' | cut -d: -f2 | tr -d ' \r')
ROM_MAXAGE=$(echo "$ROM_HEADERS" | grep -i '^cache-control:' | grep -o 'max-age=[0-9]*' | cut -d= -f2)

check "ROM é cacheável (cf-cache-status ≠ DYNAMIC) — atual: ${CF_STATUS:-ausente}" \
  '[ -n "$CF_STATUS" ] && [ "$CF_STATUS" != "DYNAMIC" ]'

check "ROM tem Cache-Control longo (≥ 1 dia) — atual: ${ROM_MAXAGE:-ausente}" \
  '[ -n "$ROM_MAXAGE" ] && [ "$ROM_MAXAGE" -ge 86400 ]'
echo ""

# ── Peso do favicon ─────────────────────────────
# Já foi 1,4 MB; serve em toda visita. Guarda contra reintrodução.
echo "[ Assets ]"
FAVICON_SIZE=$(auth_curl -o /dev/null -w "%{size_download}" "$BASE_URL/favicon.ico")
check "favicon.ico < 50 KB — atual: $((FAVICON_SIZE / 1024)) KB" \
  '[ "$FAVICON_SIZE" -gt 0 ] && [ "$FAVICON_SIZE" -lt 51200 ]'
echo ""

# ── Origem trancada ─────────────────────────────
# A policy do bucket libera apenas IPs da Cloudflare. Se afrouxar, o geo
# e o cache viram decoração. Defina S3_ORIGIN_URL para ativar.
echo "[ Origem ]"
if [ -z "${S3_ORIGIN_URL:-}" ]; then
  skip "Acesso direto ao S3 — defina S3_ORIGIN_URL para habilitar"
else
  STATUS_ORIGIN=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$S3_ORIGIN_URL")
  check "S3 recusa acesso direto (403) — atual: $STATUS_ORIGIN" \
    '[ "$STATUS_ORIGIN" = "403" ]'
fi
echo ""

# ── Hotlink protection ──────────────────────────
# NÃO está ativo hoje: verificado em 29/07/2026, Referer externo recebe
# 200. O Hotlink Protection nativo da Cloudflare cobre apenas extensões
# de imagem, não ROMs. Exige regra de WAF própria sobre http.referer.
# Ative com EXPECT_HOTLINK=1 depois de criar a regra.
echo "[ Hotlink Protection ]"
if [ "${EXPECT_HOTLINK:-0}" != "1" ]; then
  skip "Hotlink — não implementado; defina EXPECT_HOTLINK=1 após criar a regra de WAF"
else
  STATUS_HOTLINK=$(auth_curl -o /dev/null -w "%{http_code}" \
    -H "Referer: https://outrosite.com" "$ROM_URL")
  check "Bloqueia ROM com Referer externo (403)" \
    '[ "$STATUS_HOTLINK" = "403" ]'

  STATUS_OWN=$(auth_curl -o /dev/null -w "%{http_code}" \
    -H "Referer: https://emu.dellabeneta.com" "$ROM_URL")
  check "Permite ROM com Referer próprio (200)" \
    '[ "$STATUS_OWN" = "200" ]'
fi
echo ""

# ── Resumo ──────────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  Resultado: $PASS passou(aram) | $FAIL falhou(aram) | $SKIP pulado(s)"
echo "═══════════════════════════════════════════"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
