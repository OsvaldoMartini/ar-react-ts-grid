#!/usr/bin/env bash
# =============================================================
# MultiTest Runner — FLOW Execution (Part 1/2)
# Generated: 2026-03-18T13:53:00.554Z
# Cases:     1–200 of 300
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-18-13-52-47_part1_report.html"
DATA_FILE="capi_flow_execution_2026-03-18-13-52-47_data.csv"

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; YELLOW='\033[0;33m'; RESET='\033[0m'
PASS=0; FAIL=0; TOTAL=0
REPORT_ROWS=""

run_request() {
  local label="$1" method="$2" url="$3" body="$4"
  local start_ms=$(date +%s%3N)
  echo -e "${CYAN}▶ ${label}${RESET}"
  if [ -n "$body" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT -X "$method" "$url" -H 'Content-Type: application/json' -H 'Accept: application/json' -d "$body")
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT -X "$method" "$url" -H 'Accept: application/json')
  fi
  local end_ms=$(date +%s%3N)
  local latency=$((end_ms - start_ms))
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  TOTAL=$((TOTAL+1))
  if [[ "$HTTP_CODE" =~ ^2 ]]; then
    echo -e "  ${GREEN}✓ $HTTP_CODE  ${latency}ms${RESET}"
    PASS=$((PASS+1))
    local status_class="pass"; local status_icon="✓"
  else
    echo -e "  ${RED}✗ $HTTP_CODE  ${latency}ms${RESET}"
    FAIL=$((FAIL+1))
    local status_class="fail"; local status_icon="✗"
  fi
  local esc_body=$(echo "$BODY" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')
  local esc_url=$(echo "$url" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')
  local esc_body_in=$(echo "$body" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')
  REPORT_ROWS+="<tr class=\"$status_class\"><td class=\"icon\">$status_icon</td><td class=\"code\">$HTTP_CODE</td><td class=\"ms\">$(echo ${latency})ms</td><td class=\"lbl\">$label</td><td class=\"url\"><code>$method $esc_url</code></td><td class=\"body\"><pre>$esc_body</pre></td></tr>\n"
}

# ── ID CHAIN MAP ──────────────────────────────────────────
ID_DOC_FXSWS=""
ID_DOC_FXTRS=""

# ── INIT HTML REPORT ─────────────────────────────────────────
echo "Starting 200 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [1] POST /doc-fxsws — FX Swap API
run_request "[1] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-910\",\"bdeRecVersion\":9392,\"buyBookText1\":\"buyBookText1-516\",\"buyBookText2\":\"buyBookText2-254\",\"buyQty1\":4894,\"buyQty2\":9468,\"cfi\":\"cfi-655\",\"dealFwdRate1\":3.883,\"dealFwdRate2\":4.89,\"dealSpotRate1\":7.741,\"dealSpotRate2\":4.512,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US8014218838\",\"lastTrans\":\"lastTrans-851\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-444\",\"period1\":\"period1-898\",\"period2\":\"period2-122\",\"sellBookText1\":\"sellBookText1-708\",\"sellBookText2\":\"sellBookText2-459\",\"sellQty1\":2185,\"sellQty2\":6289,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.887,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [2] GET /doc-fxsws/{id} — FX Swap API
run_request "[2] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [3] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[3] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-767\",\"bdeRecVersion\":8697,\"buyBookText1\":\"buyBookText1-325\",\"buyBookText2\":\"buyBookText2-312\",\"buyQty1\":2901,\"buyQty2\":9029,\"cfi\":\"cfi-340\",\"dealFwdRate1\":0.383,\"dealFwdRate2\":1.58,\"dealSpotRate1\":1.892,\"dealSpotRate2\":1.464,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE8208914864\",\"lastTrans\":\"lastTrans-285\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-165\",\"period1\":\"period1-399\",\"period2\":\"period2-641\",\"sellBookText1\":\"sellBookText1-419\",\"sellBookText2\":\"sellBookText2-299\",\"sellQty1\":5742,\"sellQty2\":8905,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.129,\"trxDate\":\"2026-03-18\"}"

# [4] POST /doc-fxtrs — FXTR API
run_request "[4] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":1404,\"advText\":\"advText-385\",\"bdeRecVersion\":1040,\"buyQty\":8826,\"dealFwdRate\":8.248,\"dealSpotRate\":6.467,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-842\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-476\",\"fwdSpread\":3923,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-397\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-600\",\"limit\":6071,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":6405,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":1343,\"orderedBy\":\"orderedBy-964\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-806\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5141,\"settlePlanA\":true,\"spotSpread1\":1425,\"spotSpread2\":6148,\"trdrRate\":5.439,\"trigPrice\":3921,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49469072904\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [5] GET /doc-fxtrs/{id} — FXTR API
run_request "[5] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [6] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[6] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":3306,\"advText\":\"advText-572\",\"bdeRecVersion\":5588,\"buyQty\":1228,\"dealFwdRate\":1.253,\"dealSpotRate\":4.156,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-806\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-853\",\"fwdSpread\":1437,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-719\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-462\",\"limit\":3205,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":9526,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2981,\"orderedBy\":\"orderedBy-184\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-916\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8996,\"settlePlanA\":true,\"spotSpread1\":4258,\"spotSpread2\":8964,\"trdrRate\":6.403,\"trigPrice\":3782,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39907861086\"}"

# [7] POST /doc-fxsws — FX Swap API
run_request "[7] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-299\",\"bdeRecVersion\":7607,\"buyBookText1\":\"buyBookText1-939\",\"buyBookText2\":\"buyBookText2-855\",\"buyQty1\":4856,\"buyQty2\":7128,\"cfi\":\"cfi-234\",\"dealFwdRate1\":7.339,\"dealFwdRate2\":8.278,\"dealSpotRate1\":3.994,\"dealSpotRate2\":2.799,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB3049538269\",\"lastTrans\":\"lastTrans-168\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-376\",\"period1\":\"period1-538\",\"period2\":\"period2-251\",\"sellBookText1\":\"sellBookText1-219\",\"sellBookText2\":\"sellBookText2-946\",\"sellQty1\":7127,\"sellQty2\":7829,\"spotDate\":\"2026-03-18\",\"trdrRate1\":2.263,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [8] GET /doc-fxsws/{id} — FX Swap API
run_request "[8] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [9] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[9] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-863\",\"bdeRecVersion\":6900,\"buyBookText1\":\"buyBookText1-490\",\"buyBookText2\":\"buyBookText2-389\",\"buyQty1\":401,\"buyQty2\":4067,\"cfi\":\"cfi-910\",\"dealFwdRate1\":2.778,\"dealFwdRate2\":2.835,\"dealSpotRate1\":1.482,\"dealSpotRate2\":2.557,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US8054030591\",\"lastTrans\":\"lastTrans-333\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-492\",\"period1\":\"period1-877\",\"period2\":\"period2-109\",\"sellBookText1\":\"sellBookText1-377\",\"sellBookText2\":\"sellBookText2-457\",\"sellQty1\":890,\"sellQty2\":8456,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.007,\"trxDate\":\"2026-03-18\"}"

# [10] POST /doc-fxtrs — FXTR API
run_request "[10] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4308,\"advText\":\"advText-224\",\"bdeRecVersion\":9663,\"buyQty\":7736,\"dealFwdRate\":6.928,\"dealSpotRate\":8.413,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-810\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-937\",\"fwdSpread\":4815,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-518\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-798\",\"limit\":3162,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":6536,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":3874,\"orderedBy\":\"orderedBy-351\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-650\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9458,\"settlePlanA\":true,\"spotSpread1\":5234,\"spotSpread2\":9171,\"trdrRate\":8.347,\"trigPrice\":6891,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44514068139\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [11] GET /doc-fxtrs/{id} — FXTR API
run_request "[11] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [12] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[12] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":832,\"advText\":\"advText-130\",\"bdeRecVersion\":3858,\"buyQty\":1415,\"dealFwdRate\":3.166,\"dealSpotRate\":3.873,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-686\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-319\",\"fwdSpread\":2710,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-416\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-705\",\"limit\":590,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7364,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8363,\"orderedBy\":\"orderedBy-970\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-385\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4673,\"settlePlanA\":true,\"spotSpread1\":1019,\"spotSpread2\":9433,\"trdrRate\":4.635,\"trigPrice\":6440,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49173126630\"}"

# [13] POST /doc-fxsws — FX Swap API
run_request "[13] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-118\",\"bdeRecVersion\":1261,\"buyBookText1\":\"buyBookText1-153\",\"buyBookText2\":\"buyBookText2-567\",\"buyQty1\":8075,\"buyQty2\":8785,\"cfi\":\"cfi-179\",\"dealFwdRate1\":5.684,\"dealFwdRate2\":8.481,\"dealSpotRate1\":7.148,\"dealSpotRate2\":2.158,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH9605379452\",\"lastTrans\":\"lastTrans-912\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-633\",\"period1\":\"period1-988\",\"period2\":\"period2-784\",\"sellBookText1\":\"sellBookText1-518\",\"sellBookText2\":\"sellBookText2-349\",\"sellQty1\":2106,\"sellQty2\":8674,\"spotDate\":\"2026-03-18\",\"trdrRate1\":8.386,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [14] GET /doc-fxsws/{id} — FX Swap API
run_request "[14] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [15] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[15] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-972\",\"bdeRecVersion\":5963,\"buyBookText1\":\"buyBookText1-930\",\"buyBookText2\":\"buyBookText2-869\",\"buyQty1\":628,\"buyQty2\":5891,\"cfi\":\"cfi-200\",\"dealFwdRate1\":0.111,\"dealFwdRate2\":4.835,\"dealSpotRate1\":0.414,\"dealSpotRate2\":6.492,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR9254846230\",\"lastTrans\":\"lastTrans-690\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-681\",\"period1\":\"period1-549\",\"period2\":\"period2-589\",\"sellBookText1\":\"sellBookText1-307\",\"sellBookText2\":\"sellBookText2-161\",\"sellQty1\":7046,\"sellQty2\":6837,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.366,\"trxDate\":\"2026-03-18\"}"

# [16] POST /doc-fxtrs — FXTR API
run_request "[16] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5729,\"advText\":\"advText-324\",\"bdeRecVersion\":5205,\"buyQty\":9546,\"dealFwdRate\":7.105,\"dealSpotRate\":7.481,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-128\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-236\",\"fwdSpread\":8212,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-223\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-247\",\"limit\":4842,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":5533,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2755,\"orderedBy\":\"orderedBy-393\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-338\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8235,\"settlePlanA\":true,\"spotSpread1\":408,\"spotSpread2\":7594,\"trdrRate\":5.973,\"trigPrice\":5100,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41129644139\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [17] GET /doc-fxtrs/{id} — FXTR API
run_request "[17] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [18] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[18] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":3463,\"advText\":\"advText-569\",\"bdeRecVersion\":74,\"buyQty\":5541,\"dealFwdRate\":7.802,\"dealSpotRate\":2.271,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-279\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-679\",\"fwdSpread\":865,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-965\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-865\",\"limit\":1372,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2360,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":7073,\"orderedBy\":\"orderedBy-540\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-207\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1126,\"settlePlanA\":true,\"spotSpread1\":3451,\"spotSpread2\":3643,\"trdrRate\":3.873,\"trigPrice\":907,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39237576625\"}"

# [19] POST /doc-fxsws — FX Swap API
run_request "[19] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-488\",\"bdeRecVersion\":50,\"buyBookText1\":\"buyBookText1-132\",\"buyBookText2\":\"buyBookText2-593\",\"buyQty1\":2033,\"buyQty2\":8166,\"cfi\":\"cfi-756\",\"dealFwdRate1\":6.01,\"dealFwdRate2\":4.461,\"dealSpotRate1\":0.459,\"dealSpotRate2\":6.141,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US9823769659\",\"lastTrans\":\"lastTrans-743\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-735\",\"period1\":\"period1-805\",\"period2\":\"period2-506\",\"sellBookText1\":\"sellBookText1-317\",\"sellBookText2\":\"sellBookText2-767\",\"sellQty1\":8863,\"sellQty2\":6653,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.256,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [20] GET /doc-fxsws/{id} — FX Swap API
run_request "[20] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [21] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[21] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-308\",\"bdeRecVersion\":1208,\"buyBookText1\":\"buyBookText1-840\",\"buyBookText2\":\"buyBookText2-536\",\"buyQty1\":2239,\"buyQty2\":7926,\"cfi\":\"cfi-482\",\"dealFwdRate1\":3.324,\"dealFwdRate2\":4.349,\"dealSpotRate1\":5.091,\"dealSpotRate2\":3.453,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB4364534305\",\"lastTrans\":\"lastTrans-406\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-506\",\"period1\":\"period1-363\",\"period2\":\"period2-718\",\"sellBookText1\":\"sellBookText1-884\",\"sellBookText2\":\"sellBookText2-502\",\"sellQty1\":2670,\"sellQty2\":2735,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.447,\"trxDate\":\"2026-03-18\"}"

# [22] POST /doc-fxtrs — FXTR API
run_request "[22] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5801,\"advText\":\"advText-226\",\"bdeRecVersion\":5449,\"buyQty\":4458,\"dealFwdRate\":6.188,\"dealSpotRate\":1.903,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-547\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-328\",\"fwdSpread\":5418,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-258\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-693\",\"limit\":1334,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":5857,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8728,\"orderedBy\":\"orderedBy-242\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-861\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6235,\"settlePlanA\":true,\"spotSpread1\":9771,\"spotSpread2\":7269,\"trdrRate\":7.933,\"trigPrice\":5098,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44847096447\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [23] GET /doc-fxtrs/{id} — FXTR API
run_request "[23] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [24] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[24] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":4228,\"advText\":\"advText-541\",\"bdeRecVersion\":5274,\"buyQty\":9929,\"dealFwdRate\":1.963,\"dealSpotRate\":2.528,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-516\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-263\",\"fwdSpread\":3862,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-832\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-955\",\"limit\":5954,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7197,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":355,\"orderedBy\":\"orderedBy-286\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-911\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9238,\"settlePlanA\":true,\"spotSpread1\":4875,\"spotSpread2\":7879,\"trdrRate\":6.421,\"trigPrice\":546,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41955395634\"}"

# [25] POST /doc-fxsws — FX Swap API
run_request "[25] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-435\",\"bdeRecVersion\":6498,\"buyBookText1\":\"buyBookText1-551\",\"buyBookText2\":\"buyBookText2-823\",\"buyQty1\":6784,\"buyQty2\":1903,\"cfi\":\"cfi-709\",\"dealFwdRate1\":0.338,\"dealFwdRate2\":2.101,\"dealSpotRate1\":6.315,\"dealSpotRate2\":4.832,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB8539785693\",\"lastTrans\":\"lastTrans-519\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-779\",\"period1\":\"period1-978\",\"period2\":\"period2-210\",\"sellBookText1\":\"sellBookText1-831\",\"sellBookText2\":\"sellBookText2-644\",\"sellQty1\":4820,\"sellQty2\":1862,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.185,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [26] GET /doc-fxsws/{id} — FX Swap API
run_request "[26] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [27] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[27] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-678\",\"bdeRecVersion\":3996,\"buyBookText1\":\"buyBookText1-408\",\"buyBookText2\":\"buyBookText2-969\",\"buyQty1\":9385,\"buyQty2\":9233,\"cfi\":\"cfi-413\",\"dealFwdRate1\":0.606,\"dealFwdRate2\":1.734,\"dealSpotRate1\":5.212,\"dealSpotRate2\":5.218,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR4632564797\",\"lastTrans\":\"lastTrans-500\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-841\",\"period1\":\"period1-640\",\"period2\":\"period2-166\",\"sellBookText1\":\"sellBookText1-112\",\"sellBookText2\":\"sellBookText2-960\",\"sellQty1\":34,\"sellQty2\":3194,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.901,\"trxDate\":\"2026-03-18\"}"

# [28] POST /doc-fxtrs — FXTR API
run_request "[28] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":6729,\"advText\":\"advText-142\",\"bdeRecVersion\":2393,\"buyQty\":1316,\"dealFwdRate\":5.13,\"dealSpotRate\":1.415,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-156\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-556\",\"fwdSpread\":3593,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-216\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-760\",\"limit\":8421,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8602,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4577,\"orderedBy\":\"orderedBy-918\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-115\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7981,\"settlePlanA\":true,\"spotSpread1\":3882,\"spotSpread2\":4527,\"trdrRate\":0.393,\"trigPrice\":6527,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49506924323\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [29] GET /doc-fxtrs/{id} — FXTR API
run_request "[29] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [30] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[30] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":9778,\"advText\":\"advText-104\",\"bdeRecVersion\":3049,\"buyQty\":6638,\"dealFwdRate\":2.34,\"dealSpotRate\":0.723,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-222\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-717\",\"fwdSpread\":4265,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-371\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-210\",\"limit\":2191,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":6912,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":9258,\"orderedBy\":\"orderedBy-173\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-847\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":733,\"settlePlanA\":true,\"spotSpread1\":9099,\"spotSpread2\":2561,\"trdrRate\":6.607,\"trigPrice\":9845,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44810611801\"}"

# [31] POST /doc-fxsws — FX Swap API
run_request "[31] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-849\",\"bdeRecVersion\":6615,\"buyBookText1\":\"buyBookText1-328\",\"buyBookText2\":\"buyBookText2-627\",\"buyQty1\":7169,\"buyQty2\":1854,\"cfi\":\"cfi-376\",\"dealFwdRate1\":3.3,\"dealFwdRate2\":2.257,\"dealSpotRate1\":3.052,\"dealSpotRate2\":0.119,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR1718779078\",\"lastTrans\":\"lastTrans-837\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-383\",\"period1\":\"period1-802\",\"period2\":\"period2-357\",\"sellBookText1\":\"sellBookText1-821\",\"sellBookText2\":\"sellBookText2-399\",\"sellQty1\":4728,\"sellQty2\":9782,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.268,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [32] GET /doc-fxsws/{id} — FX Swap API
run_request "[32] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [33] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[33] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-684\",\"bdeRecVersion\":8805,\"buyBookText1\":\"buyBookText1-625\",\"buyBookText2\":\"buyBookText2-486\",\"buyQty1\":3276,\"buyQty2\":2709,\"cfi\":\"cfi-767\",\"dealFwdRate1\":5.434,\"dealFwdRate2\":6.647,\"dealSpotRate1\":0.745,\"dealSpotRate2\":3.145,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB8089300954\",\"lastTrans\":\"lastTrans-146\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-504\",\"period1\":\"period1-555\",\"period2\":\"period2-845\",\"sellBookText1\":\"sellBookText1-497\",\"sellBookText2\":\"sellBookText2-160\",\"sellQty1\":3095,\"sellQty2\":4660,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.657,\"trxDate\":\"2026-03-18\"}"

# [34] POST /doc-fxtrs — FXTR API
run_request "[34] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3794,\"advText\":\"advText-856\",\"bdeRecVersion\":1814,\"buyQty\":5698,\"dealFwdRate\":6.854,\"dealSpotRate\":6.427,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-709\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-904\",\"fwdSpread\":3174,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-476\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-470\",\"limit\":2931,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1116,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":9780,\"orderedBy\":\"orderedBy-512\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-301\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6640,\"settlePlanA\":true,\"spotSpread1\":3469,\"spotSpread2\":533,\"trdrRate\":2.766,\"trigPrice\":981,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33367251211\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [35] GET /doc-fxtrs/{id} — FXTR API
run_request "[35] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [36] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[36] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":9538,\"advText\":\"advText-365\",\"bdeRecVersion\":222,\"buyQty\":5070,\"dealFwdRate\":3.127,\"dealSpotRate\":3.168,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-242\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-527\",\"fwdSpread\":6674,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-800\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-560\",\"limit\":4039,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7899,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":3075,\"orderedBy\":\"orderedBy-773\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-560\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5191,\"settlePlanA\":true,\"spotSpread1\":4454,\"spotSpread2\":26,\"trdrRate\":2.407,\"trigPrice\":7134,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41116633574\"}"

# [37] POST /doc-fxsws — FX Swap API
run_request "[37] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-595\",\"bdeRecVersion\":8171,\"buyBookText1\":\"buyBookText1-853\",\"buyBookText2\":\"buyBookText2-622\",\"buyQty1\":1959,\"buyQty2\":9673,\"cfi\":\"cfi-417\",\"dealFwdRate1\":2.741,\"dealFwdRate2\":8.282,\"dealSpotRate1\":0.505,\"dealSpotRate2\":1.497,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE2816576676\",\"lastTrans\":\"lastTrans-125\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-534\",\"period1\":\"period1-161\",\"period2\":\"period2-209\",\"sellBookText1\":\"sellBookText1-462\",\"sellBookText2\":\"sellBookText2-285\",\"sellQty1\":2113,\"sellQty2\":7160,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.598,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [38] GET /doc-fxsws/{id} — FX Swap API
run_request "[38] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [39] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[39] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-210\",\"bdeRecVersion\":8278,\"buyBookText1\":\"buyBookText1-588\",\"buyBookText2\":\"buyBookText2-683\",\"buyQty1\":711,\"buyQty2\":1263,\"cfi\":\"cfi-315\",\"dealFwdRate1\":1.735,\"dealFwdRate2\":6.839,\"dealSpotRate1\":4.089,\"dealSpotRate2\":1.816,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE1780966881\",\"lastTrans\":\"lastTrans-210\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-277\",\"period1\":\"period1-941\",\"period2\":\"period2-570\",\"sellBookText1\":\"sellBookText1-608\",\"sellBookText2\":\"sellBookText2-650\",\"sellQty1\":6139,\"sellQty2\":3902,\"spotDate\":\"2026-03-18\",\"trdrRate1\":8.116,\"trxDate\":\"2026-03-18\"}"

# [40] POST /doc-fxtrs — FXTR API
run_request "[40] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4170,\"advText\":\"advText-590\",\"bdeRecVersion\":2409,\"buyQty\":3635,\"dealFwdRate\":0.158,\"dealSpotRate\":4.741,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-516\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-892\",\"fwdSpread\":973,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-479\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-931\",\"limit\":1334,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8224,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8180,\"orderedBy\":\"orderedBy-254\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-252\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":2851,\"settlePlanA\":true,\"spotSpread1\":5126,\"spotSpread2\":7091,\"trdrRate\":8.173,\"trigPrice\":292,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39587661240\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [41] GET /doc-fxtrs/{id} — FXTR API
run_request "[41] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [42] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[42] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":4530,\"advText\":\"advText-218\",\"bdeRecVersion\":7847,\"buyQty\":9244,\"dealFwdRate\":4.13,\"dealSpotRate\":8.019,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-273\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-431\",\"fwdSpread\":3972,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-170\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-675\",\"limit\":3184,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2052,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2059,\"orderedBy\":\"orderedBy-237\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-656\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1700,\"settlePlanA\":true,\"spotSpread1\":9873,\"spotSpread2\":5821,\"trdrRate\":8.221,\"trigPrice\":2333,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39343864753\"}"

# [43] POST /doc-fxsws — FX Swap API
run_request "[43] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-893\",\"bdeRecVersion\":3504,\"buyBookText1\":\"buyBookText1-468\",\"buyBookText2\":\"buyBookText2-957\",\"buyQty1\":7234,\"buyQty2\":4689,\"cfi\":\"cfi-643\",\"dealFwdRate1\":7.809,\"dealFwdRate2\":7.434,\"dealSpotRate1\":2.33,\"dealSpotRate2\":7.709,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US7485470095\",\"lastTrans\":\"lastTrans-229\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-517\",\"period1\":\"period1-486\",\"period2\":\"period2-560\",\"sellBookText1\":\"sellBookText1-598\",\"sellBookText2\":\"sellBookText2-200\",\"sellQty1\":6372,\"sellQty2\":8071,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.579,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [44] GET /doc-fxsws/{id} — FX Swap API
run_request "[44] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [45] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[45] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-258\",\"bdeRecVersion\":6818,\"buyBookText1\":\"buyBookText1-338\",\"buyBookText2\":\"buyBookText2-373\",\"buyQty1\":579,\"buyQty2\":7912,\"cfi\":\"cfi-964\",\"dealFwdRate1\":4.194,\"dealFwdRate2\":4.29,\"dealSpotRate1\":0.794,\"dealSpotRate2\":4.227,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB1897577134\",\"lastTrans\":\"lastTrans-206\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-391\",\"period1\":\"period1-443\",\"period2\":\"period2-742\",\"sellBookText1\":\"sellBookText1-114\",\"sellBookText2\":\"sellBookText2-814\",\"sellQty1\":6408,\"sellQty2\":9264,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.357,\"trxDate\":\"2026-03-18\"}"

# [46] POST /doc-fxtrs — FXTR API
run_request "[46] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":917,\"advText\":\"advText-401\",\"bdeRecVersion\":9668,\"buyQty\":4173,\"dealFwdRate\":3.91,\"dealSpotRate\":8.193,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-882\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-194\",\"fwdSpread\":4041,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-913\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-834\",\"limit\":5886,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":6451,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":558,\"orderedBy\":\"orderedBy-452\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-293\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3990,\"settlePlanA\":true,\"spotSpread1\":3919,\"spotSpread2\":9911,\"trdrRate\":5.625,\"trigPrice\":6158,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39795425914\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [47] GET /doc-fxtrs/{id} — FXTR API
run_request "[47] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [48] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[48] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":8323,\"advText\":\"advText-492\",\"bdeRecVersion\":5122,\"buyQty\":36,\"dealFwdRate\":5.816,\"dealSpotRate\":3.679,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-186\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-770\",\"fwdSpread\":4127,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-407\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-547\",\"limit\":3286,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1337,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8160,\"orderedBy\":\"orderedBy-951\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-487\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":659,\"settlePlanA\":true,\"spotSpread1\":8757,\"spotSpread2\":2276,\"trdrRate\":2.802,\"trigPrice\":1368,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39561260945\"}"

# [49] POST /doc-fxsws — FX Swap API
run_request "[49] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-375\",\"bdeRecVersion\":8316,\"buyBookText1\":\"buyBookText1-171\",\"buyBookText2\":\"buyBookText2-690\",\"buyQty1\":1551,\"buyQty2\":8660,\"cfi\":\"cfi-390\",\"dealFwdRate1\":3.648,\"dealFwdRate2\":1.894,\"dealSpotRate1\":0.106,\"dealSpotRate2\":0.244,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US8233695663\",\"lastTrans\":\"lastTrans-946\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-828\",\"period1\":\"period1-828\",\"period2\":\"period2-752\",\"sellBookText1\":\"sellBookText1-421\",\"sellBookText2\":\"sellBookText2-618\",\"sellQty1\":6279,\"sellQty2\":6250,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.649,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [50] GET /doc-fxsws/{id} — FX Swap API
run_request "[50] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [51] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[51] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-944\",\"bdeRecVersion\":5121,\"buyBookText1\":\"buyBookText1-434\",\"buyBookText2\":\"buyBookText2-464\",\"buyQty1\":3521,\"buyQty2\":8612,\"cfi\":\"cfi-364\",\"dealFwdRate1\":7.82,\"dealFwdRate2\":3.151,\"dealSpotRate1\":6.568,\"dealSpotRate2\":1.073,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US8564332391\",\"lastTrans\":\"lastTrans-450\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-529\",\"period1\":\"period1-994\",\"period2\":\"period2-427\",\"sellBookText1\":\"sellBookText1-225\",\"sellBookText2\":\"sellBookText2-570\",\"sellQty1\":6679,\"sellQty2\":1356,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.793,\"trxDate\":\"2026-03-18\"}"

# [52] POST /doc-fxtrs — FXTR API
run_request "[52] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3491,\"advText\":\"advText-159\",\"bdeRecVersion\":4462,\"buyQty\":2937,\"dealFwdRate\":3.809,\"dealSpotRate\":2.724,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-860\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-994\",\"fwdSpread\":198,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-321\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-938\",\"limit\":9510,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8674,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6924,\"orderedBy\":\"orderedBy-660\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-245\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":398,\"settlePlanA\":true,\"spotSpread1\":320,\"spotSpread2\":3946,\"trdrRate\":3.189,\"trigPrice\":9747,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39300513972\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [53] GET /doc-fxtrs/{id} — FXTR API
run_request "[53] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [54] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[54] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":9010,\"advText\":\"advText-734\",\"bdeRecVersion\":2100,\"buyQty\":1754,\"dealFwdRate\":1.365,\"dealSpotRate\":3.509,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-648\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-986\",\"fwdSpread\":6291,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-527\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-538\",\"limit\":9468,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1336,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8398,\"orderedBy\":\"orderedBy-743\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-170\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3707,\"settlePlanA\":true,\"spotSpread1\":7056,\"spotSpread2\":6898,\"trdrRate\":3.167,\"trigPrice\":7698,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49940516316\"}"

# [55] POST /doc-fxsws — FX Swap API
run_request "[55] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-431\",\"bdeRecVersion\":6174,\"buyBookText1\":\"buyBookText1-468\",\"buyBookText2\":\"buyBookText2-966\",\"buyQty1\":614,\"buyQty2\":8088,\"cfi\":\"cfi-499\",\"dealFwdRate1\":1.265,\"dealFwdRate2\":8.332,\"dealSpotRate1\":3.887,\"dealSpotRate2\":6.187,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR7430838127\",\"lastTrans\":\"lastTrans-627\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-697\",\"period1\":\"period1-121\",\"period2\":\"period2-798\",\"sellBookText1\":\"sellBookText1-435\",\"sellBookText2\":\"sellBookText2-340\",\"sellQty1\":4982,\"sellQty2\":6834,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.123,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [56] GET /doc-fxsws/{id} — FX Swap API
run_request "[56] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [57] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[57] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-932\",\"bdeRecVersion\":4430,\"buyBookText1\":\"buyBookText1-386\",\"buyBookText2\":\"buyBookText2-352\",\"buyQty1\":5606,\"buyQty2\":7776,\"cfi\":\"cfi-693\",\"dealFwdRate1\":4.862,\"dealFwdRate2\":7.994,\"dealSpotRate1\":6.03,\"dealSpotRate2\":4.8,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH4713579578\",\"lastTrans\":\"lastTrans-384\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-806\",\"period1\":\"period1-953\",\"period2\":\"period2-216\",\"sellBookText1\":\"sellBookText1-384\",\"sellBookText2\":\"sellBookText2-263\",\"sellQty1\":8949,\"sellQty2\":3878,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.99,\"trxDate\":\"2026-03-18\"}"

# [58] POST /doc-fxtrs — FXTR API
run_request "[58] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":1771,\"advText\":\"advText-458\",\"bdeRecVersion\":1800,\"buyQty\":5654,\"dealFwdRate\":6.991,\"dealSpotRate\":3.961,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-240\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-354\",\"fwdSpread\":9505,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-253\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-901\",\"limit\":4597,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4219,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8857,\"orderedBy\":\"orderedBy-140\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-755\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7624,\"settlePlanA\":true,\"spotSpread1\":5835,\"spotSpread2\":1951,\"trdrRate\":4.872,\"trigPrice\":8589,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41727700870\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [59] GET /doc-fxtrs/{id} — FXTR API
run_request "[59] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [60] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[60] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1796,\"advText\":\"advText-122\",\"bdeRecVersion\":2210,\"buyQty\":4482,\"dealFwdRate\":7.705,\"dealSpotRate\":8.448,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-796\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-411\",\"fwdSpread\":3297,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-864\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-162\",\"limit\":2073,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4855,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4340,\"orderedBy\":\"orderedBy-553\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-560\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5921,\"settlePlanA\":true,\"spotSpread1\":4858,\"spotSpread2\":8525,\"trdrRate\":2.097,\"trigPrice\":683,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33950255513\"}"

# [61] POST /doc-fxsws — FX Swap API
run_request "[61] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-479\",\"bdeRecVersion\":1608,\"buyBookText1\":\"buyBookText1-830\",\"buyBookText2\":\"buyBookText2-964\",\"buyQty1\":9765,\"buyQty2\":7878,\"cfi\":\"cfi-340\",\"dealFwdRate1\":2.105,\"dealFwdRate2\":6.872,\"dealSpotRate1\":4.645,\"dealSpotRate2\":7.926,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR9833319255\",\"lastTrans\":\"lastTrans-165\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-497\",\"period1\":\"period1-169\",\"period2\":\"period2-333\",\"sellBookText1\":\"sellBookText1-119\",\"sellBookText2\":\"sellBookText2-555\",\"sellQty1\":2918,\"sellQty2\":1916,\"spotDate\":\"2026-03-18\",\"trdrRate1\":1.698,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [62] GET /doc-fxsws/{id} — FX Swap API
run_request "[62] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [63] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[63] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-820\",\"bdeRecVersion\":4474,\"buyBookText1\":\"buyBookText1-124\",\"buyBookText2\":\"buyBookText2-104\",\"buyQty1\":7397,\"buyQty2\":893,\"cfi\":\"cfi-940\",\"dealFwdRate1\":1.62,\"dealFwdRate2\":6.128,\"dealSpotRate1\":3.544,\"dealSpotRate2\":7.419,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE7888885859\",\"lastTrans\":\"lastTrans-658\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-426\",\"period1\":\"period1-163\",\"period2\":\"period2-477\",\"sellBookText1\":\"sellBookText1-926\",\"sellBookText2\":\"sellBookText2-903\",\"sellQty1\":6760,\"sellQty2\":9794,\"spotDate\":\"2026-03-18\",\"trdrRate1\":1.109,\"trxDate\":\"2026-03-18\"}"

# [64] POST /doc-fxtrs — FXTR API
run_request "[64] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":2156,\"advText\":\"advText-642\",\"bdeRecVersion\":5729,\"buyQty\":8347,\"dealFwdRate\":6.775,\"dealSpotRate\":6.182,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-369\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-205\",\"fwdSpread\":213,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-441\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-953\",\"limit\":5025,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2348,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":9688,\"orderedBy\":\"orderedBy-396\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-111\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6816,\"settlePlanA\":true,\"spotSpread1\":1640,\"spotSpread2\":1050,\"trdrRate\":2.263,\"trigPrice\":6369,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41598708902\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [65] GET /doc-fxtrs/{id} — FXTR API
run_request "[65] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [66] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[66] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":6252,\"advText\":\"advText-278\",\"bdeRecVersion\":7586,\"buyQty\":8211,\"dealFwdRate\":4.732,\"dealSpotRate\":6.083,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-700\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-207\",\"fwdSpread\":8513,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-918\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-330\",\"limit\":3724,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":495,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":5248,\"orderedBy\":\"orderedBy-876\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-738\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8447,\"settlePlanA\":true,\"spotSpread1\":4462,\"spotSpread2\":2876,\"trdrRate\":4.364,\"trigPrice\":1310,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44273035705\"}"

# [67] POST /doc-fxsws — FX Swap API
run_request "[67] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-370\",\"bdeRecVersion\":6777,\"buyBookText1\":\"buyBookText1-271\",\"buyBookText2\":\"buyBookText2-909\",\"buyQty1\":4956,\"buyQty2\":7684,\"cfi\":\"cfi-803\",\"dealFwdRate1\":1.743,\"dealFwdRate2\":1.266,\"dealSpotRate1\":1.777,\"dealSpotRate2\":1.916,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH7649611989\",\"lastTrans\":\"lastTrans-493\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-266\",\"period1\":\"period1-477\",\"period2\":\"period2-134\",\"sellBookText1\":\"sellBookText1-731\",\"sellBookText2\":\"sellBookText2-282\",\"sellQty1\":6162,\"sellQty2\":1688,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.996,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [68] GET /doc-fxsws/{id} — FX Swap API
run_request "[68] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [69] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[69] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-981\",\"bdeRecVersion\":3668,\"buyBookText1\":\"buyBookText1-688\",\"buyBookText2\":\"buyBookText2-276\",\"buyQty1\":1013,\"buyQty2\":7466,\"cfi\":\"cfi-291\",\"dealFwdRate1\":0.964,\"dealFwdRate2\":7.348,\"dealSpotRate1\":3.302,\"dealSpotRate2\":7.402,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB4103645998\",\"lastTrans\":\"lastTrans-847\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-744\",\"period1\":\"period1-975\",\"period2\":\"period2-157\",\"sellBookText1\":\"sellBookText1-293\",\"sellBookText2\":\"sellBookText2-173\",\"sellQty1\":5499,\"sellQty2\":8524,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.675,\"trxDate\":\"2026-03-18\"}"

# [70] POST /doc-fxtrs — FXTR API
run_request "[70] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5433,\"advText\":\"advText-862\",\"bdeRecVersion\":3806,\"buyQty\":8324,\"dealFwdRate\":7.616,\"dealSpotRate\":2.185,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-499\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-808\",\"fwdSpread\":6925,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-145\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-688\",\"limit\":3157,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2403,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":3347,\"orderedBy\":\"orderedBy-348\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-984\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4557,\"settlePlanA\":true,\"spotSpread1\":1472,\"spotSpread2\":7268,\"trdrRate\":1.16,\"trigPrice\":3291,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49311219837\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [71] GET /doc-fxtrs/{id} — FXTR API
run_request "[71] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [72] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[72] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":9415,\"advText\":\"advText-707\",\"bdeRecVersion\":3850,\"buyQty\":3654,\"dealFwdRate\":1.068,\"dealSpotRate\":6.072,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-336\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-491\",\"fwdSpread\":5795,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-451\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-913\",\"limit\":2097,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7365,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":3448,\"orderedBy\":\"orderedBy-407\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-328\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4777,\"settlePlanA\":true,\"spotSpread1\":7181,\"spotSpread2\":7291,\"trdrRate\":2.612,\"trigPrice\":2406,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49790433589\"}"

# [73] POST /doc-fxsws — FX Swap API
run_request "[73] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-289\",\"bdeRecVersion\":9544,\"buyBookText1\":\"buyBookText1-326\",\"buyBookText2\":\"buyBookText2-103\",\"buyQty1\":2186,\"buyQty2\":7341,\"cfi\":\"cfi-643\",\"dealFwdRate1\":3.006,\"dealFwdRate2\":4.213,\"dealSpotRate1\":7.246,\"dealSpotRate2\":2.97,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH9544779633\",\"lastTrans\":\"lastTrans-913\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-894\",\"period1\":\"period1-533\",\"period2\":\"period2-989\",\"sellBookText1\":\"sellBookText1-593\",\"sellBookText2\":\"sellBookText2-570\",\"sellQty1\":5354,\"sellQty2\":6453,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.559,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [74] GET /doc-fxsws/{id} — FX Swap API
run_request "[74] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [75] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[75] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-740\",\"bdeRecVersion\":5083,\"buyBookText1\":\"buyBookText1-747\",\"buyBookText2\":\"buyBookText2-297\",\"buyQty1\":8451,\"buyQty2\":9973,\"cfi\":\"cfi-335\",\"dealFwdRate1\":0.707,\"dealFwdRate2\":4.167,\"dealSpotRate1\":2.941,\"dealSpotRate2\":6.43,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US6629124784\",\"lastTrans\":\"lastTrans-781\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-973\",\"period1\":\"period1-311\",\"period2\":\"period2-847\",\"sellBookText1\":\"sellBookText1-582\",\"sellBookText2\":\"sellBookText2-267\",\"sellQty1\":3528,\"sellQty2\":9358,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.877,\"trxDate\":\"2026-03-18\"}"

# [76] POST /doc-fxtrs — FXTR API
run_request "[76] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3259,\"advText\":\"advText-850\",\"bdeRecVersion\":9806,\"buyQty\":944,\"dealFwdRate\":6.746,\"dealSpotRate\":8.039,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-482\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-314\",\"fwdSpread\":526,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-211\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-959\",\"limit\":2317,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":3222,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":5085,\"orderedBy\":\"orderedBy-777\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-448\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":902,\"settlePlanA\":true,\"spotSpread1\":5124,\"spotSpread2\":7843,\"trdrRate\":7.276,\"trigPrice\":8808,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49713081523\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [77] GET /doc-fxtrs/{id} — FXTR API
run_request "[77] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [78] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[78] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1973,\"advText\":\"advText-881\",\"bdeRecVersion\":2608,\"buyQty\":3870,\"dealFwdRate\":4.802,\"dealSpotRate\":4.395,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-427\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-373\",\"fwdSpread\":4287,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-183\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-121\",\"limit\":5095,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8974,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":7866,\"orderedBy\":\"orderedBy-947\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-674\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7302,\"settlePlanA\":true,\"spotSpread1\":2542,\"spotSpread2\":8629,\"trdrRate\":3.256,\"trigPrice\":3774,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39133917108\"}"

# [79] POST /doc-fxsws — FX Swap API
run_request "[79] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-849\",\"bdeRecVersion\":2388,\"buyBookText1\":\"buyBookText1-351\",\"buyBookText2\":\"buyBookText2-912\",\"buyQty1\":6414,\"buyQty2\":1144,\"cfi\":\"cfi-594\",\"dealFwdRate1\":0.522,\"dealFwdRate2\":0.616,\"dealSpotRate1\":1.691,\"dealSpotRate2\":5.784,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE9105571042\",\"lastTrans\":\"lastTrans-197\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-811\",\"period1\":\"period1-133\",\"period2\":\"period2-845\",\"sellBookText1\":\"sellBookText1-598\",\"sellBookText2\":\"sellBookText2-489\",\"sellQty1\":4531,\"sellQty2\":9063,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.664,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [80] GET /doc-fxsws/{id} — FX Swap API
run_request "[80] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [81] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[81] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-715\",\"bdeRecVersion\":365,\"buyBookText1\":\"buyBookText1-207\",\"buyBookText2\":\"buyBookText2-295\",\"buyQty1\":7485,\"buyQty2\":1227,\"cfi\":\"cfi-648\",\"dealFwdRate1\":4.551,\"dealFwdRate2\":7.584,\"dealSpotRate1\":8.198,\"dealSpotRate2\":6.59,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE6642135941\",\"lastTrans\":\"lastTrans-943\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-588\",\"period1\":\"period1-564\",\"period2\":\"period2-516\",\"sellBookText1\":\"sellBookText1-297\",\"sellBookText2\":\"sellBookText2-989\",\"sellQty1\":7445,\"sellQty2\":5930,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.946,\"trxDate\":\"2026-03-18\"}"

# [82] POST /doc-fxtrs — FXTR API
run_request "[82] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5753,\"advText\":\"advText-448\",\"bdeRecVersion\":4067,\"buyQty\":8450,\"dealFwdRate\":5.217,\"dealSpotRate\":3.474,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-876\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-860\",\"fwdSpread\":2041,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-366\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-760\",\"limit\":750,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":93,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":1005,\"orderedBy\":\"orderedBy-681\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-633\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8465,\"settlePlanA\":true,\"spotSpread1\":6158,\"spotSpread2\":313,\"trdrRate\":3.963,\"trigPrice\":4557,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44378891618\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [83] GET /doc-fxtrs/{id} — FXTR API
run_request "[83] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [84] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[84] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":6289,\"advText\":\"advText-389\",\"bdeRecVersion\":7368,\"buyQty\":4693,\"dealFwdRate\":0.677,\"dealSpotRate\":4.673,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-636\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-138\",\"fwdSpread\":8980,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-948\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-587\",\"limit\":8779,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1976,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":624,\"orderedBy\":\"orderedBy-754\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-557\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7316,\"settlePlanA\":true,\"spotSpread1\":1535,\"spotSpread2\":7430,\"trdrRate\":3.63,\"trigPrice\":2498,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49123484702\"}"

# [85] POST /doc-fxsws — FX Swap API
run_request "[85] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-209\",\"bdeRecVersion\":2159,\"buyBookText1\":\"buyBookText1-290\",\"buyBookText2\":\"buyBookText2-565\",\"buyQty1\":3213,\"buyQty2\":6840,\"cfi\":\"cfi-862\",\"dealFwdRate1\":6.642,\"dealFwdRate2\":5.108,\"dealSpotRate1\":7.287,\"dealSpotRate2\":3.679,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH9522693701\",\"lastTrans\":\"lastTrans-126\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-703\",\"period1\":\"period1-679\",\"period2\":\"period2-754\",\"sellBookText1\":\"sellBookText1-151\",\"sellBookText2\":\"sellBookText2-985\",\"sellQty1\":6756,\"sellQty2\":8051,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.919,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [86] GET /doc-fxsws/{id} — FX Swap API
run_request "[86] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [87] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[87] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-124\",\"bdeRecVersion\":3771,\"buyBookText1\":\"buyBookText1-525\",\"buyBookText2\":\"buyBookText2-114\",\"buyQty1\":6986,\"buyQty2\":5941,\"cfi\":\"cfi-151\",\"dealFwdRate1\":4.741,\"dealFwdRate2\":2.694,\"dealSpotRate1\":7.98,\"dealSpotRate2\":3.205,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB5976658901\",\"lastTrans\":\"lastTrans-636\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-230\",\"period1\":\"period1-925\",\"period2\":\"period2-696\",\"sellBookText1\":\"sellBookText1-987\",\"sellBookText2\":\"sellBookText2-707\",\"sellQty1\":3917,\"sellQty2\":4977,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.761,\"trxDate\":\"2026-03-18\"}"

# [88] POST /doc-fxtrs — FXTR API
run_request "[88] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3231,\"advText\":\"advText-857\",\"bdeRecVersion\":1859,\"buyQty\":3200,\"dealFwdRate\":3.227,\"dealSpotRate\":0.238,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-461\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-480\",\"fwdSpread\":3764,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-158\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-987\",\"limit\":3824,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":3677,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8848,\"orderedBy\":\"orderedBy-748\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-609\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5377,\"settlePlanA\":true,\"spotSpread1\":1947,\"spotSpread2\":1387,\"trdrRate\":0.864,\"trigPrice\":666,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49156563036\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [89] GET /doc-fxtrs/{id} — FXTR API
run_request "[89] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [90] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[90] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":3031,\"advText\":\"advText-807\",\"bdeRecVersion\":2157,\"buyQty\":6836,\"dealFwdRate\":1.918,\"dealSpotRate\":2.943,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-294\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-821\",\"fwdSpread\":1721,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-102\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-236\",\"limit\":5470,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8470,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":779,\"orderedBy\":\"orderedBy-156\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-264\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7104,\"settlePlanA\":true,\"spotSpread1\":7571,\"spotSpread2\":4629,\"trdrRate\":4.015,\"trigPrice\":783,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44588463380\"}"

# [91] POST /doc-fxsws — FX Swap API
run_request "[91] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-976\",\"bdeRecVersion\":4814,\"buyBookText1\":\"buyBookText1-914\",\"buyBookText2\":\"buyBookText2-920\",\"buyQty1\":7985,\"buyQty2\":3703,\"cfi\":\"cfi-592\",\"dealFwdRate1\":2.117,\"dealFwdRate2\":2.262,\"dealSpotRate1\":3.468,\"dealSpotRate2\":3.707,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE7784279186\",\"lastTrans\":\"lastTrans-986\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-705\",\"period1\":\"period1-497\",\"period2\":\"period2-860\",\"sellBookText1\":\"sellBookText1-212\",\"sellBookText2\":\"sellBookText2-601\",\"sellQty1\":5252,\"sellQty2\":6219,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.728,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [92] GET /doc-fxsws/{id} — FX Swap API
run_request "[92] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [93] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[93] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-948\",\"bdeRecVersion\":9616,\"buyBookText1\":\"buyBookText1-628\",\"buyBookText2\":\"buyBookText2-819\",\"buyQty1\":5578,\"buyQty2\":2913,\"cfi\":\"cfi-640\",\"dealFwdRate1\":5.774,\"dealFwdRate2\":7.511,\"dealSpotRate1\":1.729,\"dealSpotRate2\":6.018,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB9929115771\",\"lastTrans\":\"lastTrans-318\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-947\",\"period1\":\"period1-345\",\"period2\":\"period2-110\",\"sellBookText1\":\"sellBookText1-527\",\"sellBookText2\":\"sellBookText2-753\",\"sellQty1\":851,\"sellQty2\":9422,\"spotDate\":\"2026-03-18\",\"trdrRate1\":2.312,\"trxDate\":\"2026-03-18\"}"

# [94] POST /doc-fxtrs — FXTR API
run_request "[94] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4122,\"advText\":\"advText-143\",\"bdeRecVersion\":1954,\"buyQty\":4748,\"dealFwdRate\":0.63,\"dealSpotRate\":4.53,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-143\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-135\",\"fwdSpread\":8705,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-540\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-185\",\"limit\":5297,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":3206,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4404,\"orderedBy\":\"orderedBy-624\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-527\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5133,\"settlePlanA\":true,\"spotSpread1\":5604,\"spotSpread2\":6931,\"trdrRate\":7.964,\"trigPrice\":2677,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39989649892\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [95] GET /doc-fxtrs/{id} — FXTR API
run_request "[95] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [96] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[96] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":3596,\"advText\":\"advText-288\",\"bdeRecVersion\":2944,\"buyQty\":6827,\"dealFwdRate\":4.543,\"dealSpotRate\":4.703,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-422\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-210\",\"fwdSpread\":106,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-144\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-628\",\"limit\":1784,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":6373,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":5056,\"orderedBy\":\"orderedBy-644\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-387\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3352,\"settlePlanA\":true,\"spotSpread1\":4001,\"spotSpread2\":942,\"trdrRate\":4.353,\"trigPrice\":7922,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49479846965\"}"

# [97] POST /doc-fxsws — FX Swap API
run_request "[97] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-470\",\"bdeRecVersion\":8600,\"buyBookText1\":\"buyBookText1-180\",\"buyBookText2\":\"buyBookText2-779\",\"buyQty1\":2787,\"buyQty2\":3380,\"cfi\":\"cfi-199\",\"dealFwdRate1\":4.422,\"dealFwdRate2\":7.003,\"dealSpotRate1\":3.97,\"dealSpotRate2\":7.887,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE6684491155\",\"lastTrans\":\"lastTrans-928\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-332\",\"period1\":\"period1-303\",\"period2\":\"period2-592\",\"sellBookText1\":\"sellBookText1-496\",\"sellBookText2\":\"sellBookText2-906\",\"sellQty1\":1645,\"sellQty2\":3441,\"spotDate\":\"2026-03-18\",\"trdrRate1\":2.271,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [98] GET /doc-fxsws/{id} — FX Swap API
run_request "[98] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [99] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[99] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-232\",\"bdeRecVersion\":6880,\"buyBookText1\":\"buyBookText1-369\",\"buyBookText2\":\"buyBookText2-526\",\"buyQty1\":2483,\"buyQty2\":2680,\"cfi\":\"cfi-715\",\"dealFwdRate1\":2.613,\"dealFwdRate2\":1.998,\"dealSpotRate1\":8.245,\"dealSpotRate2\":5.037,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US7425526469\",\"lastTrans\":\"lastTrans-589\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-305\",\"period1\":\"period1-525\",\"period2\":\"period2-875\",\"sellBookText1\":\"sellBookText1-903\",\"sellBookText2\":\"sellBookText2-501\",\"sellQty1\":1629,\"sellQty2\":5909,\"spotDate\":\"2026-03-18\",\"trdrRate1\":2.81,\"trxDate\":\"2026-03-18\"}"

# [100] POST /doc-fxtrs — FXTR API
run_request "[100] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":232,\"advText\":\"advText-645\",\"bdeRecVersion\":8540,\"buyQty\":602,\"dealFwdRate\":8.156,\"dealSpotRate\":7.494,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-278\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-179\",\"fwdSpread\":797,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-900\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-922\",\"limit\":2203,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4250,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":7177,\"orderedBy\":\"orderedBy-946\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-535\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3253,\"settlePlanA\":true,\"spotSpread1\":9167,\"spotSpread2\":9408,\"trdrRate\":2.418,\"trigPrice\":6148,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44970393642\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [101] GET /doc-fxtrs/{id} — FXTR API
run_request "[101] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [102] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[102] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":4426,\"advText\":\"advText-780\",\"bdeRecVersion\":1607,\"buyQty\":382,\"dealFwdRate\":0.568,\"dealSpotRate\":3.457,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-462\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-418\",\"fwdSpread\":7918,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-742\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-527\",\"limit\":8669,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8221,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":9236,\"orderedBy\":\"orderedBy-677\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-224\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7820,\"settlePlanA\":true,\"spotSpread1\":8338,\"spotSpread2\":663,\"trdrRate\":0.887,\"trigPrice\":7425,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49987960504\"}"

# [103] POST /doc-fxsws — FX Swap API
run_request "[103] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-908\",\"bdeRecVersion\":3459,\"buyBookText1\":\"buyBookText1-834\",\"buyBookText2\":\"buyBookText2-867\",\"buyQty1\":5132,\"buyQty2\":1181,\"cfi\":\"cfi-806\",\"dealFwdRate1\":5.487,\"dealFwdRate2\":1.889,\"dealSpotRate1\":4.664,\"dealSpotRate2\":4.624,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US9847664963\",\"lastTrans\":\"lastTrans-610\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-726\",\"period1\":\"period1-561\",\"period2\":\"period2-825\",\"sellBookText1\":\"sellBookText1-953\",\"sellBookText2\":\"sellBookText2-165\",\"sellQty1\":559,\"sellQty2\":6064,\"spotDate\":\"2026-03-18\",\"trdrRate1\":2.212,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [104] GET /doc-fxsws/{id} — FX Swap API
run_request "[104] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [105] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[105] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-939\",\"bdeRecVersion\":8740,\"buyBookText1\":\"buyBookText1-512\",\"buyBookText2\":\"buyBookText2-919\",\"buyQty1\":4569,\"buyQty2\":7830,\"cfi\":\"cfi-227\",\"dealFwdRate1\":7.398,\"dealFwdRate2\":7.254,\"dealSpotRate1\":0.684,\"dealSpotRate2\":5.683,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE3468076620\",\"lastTrans\":\"lastTrans-723\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-551\",\"period1\":\"period1-835\",\"period2\":\"period2-262\",\"sellBookText1\":\"sellBookText1-649\",\"sellBookText2\":\"sellBookText2-792\",\"sellQty1\":4837,\"sellQty2\":816,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.548,\"trxDate\":\"2026-03-18\"}"

# [106] POST /doc-fxtrs — FXTR API
run_request "[106] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3372,\"advText\":\"advText-235\",\"bdeRecVersion\":2350,\"buyQty\":956,\"dealFwdRate\":2.898,\"dealSpotRate\":0.169,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-344\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-904\",\"fwdSpread\":7676,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-561\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-509\",\"limit\":9702,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8503,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":3073,\"orderedBy\":\"orderedBy-491\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-236\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8873,\"settlePlanA\":true,\"spotSpread1\":8353,\"spotSpread2\":1369,\"trdrRate\":5.286,\"trigPrice\":3159,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49835928279\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [107] GET /doc-fxtrs/{id} — FXTR API
run_request "[107] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [108] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[108] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":8804,\"advText\":\"advText-843\",\"bdeRecVersion\":8122,\"buyQty\":9037,\"dealFwdRate\":4.352,\"dealSpotRate\":4.853,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-354\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-610\",\"fwdSpread\":1087,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-502\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-289\",\"limit\":8640,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":723,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6979,\"orderedBy\":\"orderedBy-685\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-550\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7492,\"settlePlanA\":true,\"spotSpread1\":8992,\"spotSpread2\":8293,\"trdrRate\":3.187,\"trigPrice\":5779,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33149070597\"}"

# [109] POST /doc-fxsws — FX Swap API
run_request "[109] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-910\",\"bdeRecVersion\":2123,\"buyBookText1\":\"buyBookText1-850\",\"buyBookText2\":\"buyBookText2-918\",\"buyQty1\":7869,\"buyQty2\":2545,\"cfi\":\"cfi-908\",\"dealFwdRate1\":2.092,\"dealFwdRate2\":4.378,\"dealSpotRate1\":1.313,\"dealSpotRate2\":7.226,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH5275761732\",\"lastTrans\":\"lastTrans-835\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-814\",\"period1\":\"period1-274\",\"period2\":\"period2-248\",\"sellBookText1\":\"sellBookText1-799\",\"sellBookText2\":\"sellBookText2-619\",\"sellQty1\":1788,\"sellQty2\":3877,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.746,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [110] GET /doc-fxsws/{id} — FX Swap API
run_request "[110] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [111] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[111] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-944\",\"bdeRecVersion\":5133,\"buyBookText1\":\"buyBookText1-571\",\"buyBookText2\":\"buyBookText2-222\",\"buyQty1\":8814,\"buyQty2\":5226,\"cfi\":\"cfi-784\",\"dealFwdRate1\":0.462,\"dealFwdRate2\":4.347,\"dealSpotRate1\":2.133,\"dealSpotRate2\":3.997,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB2549038548\",\"lastTrans\":\"lastTrans-460\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-407\",\"period1\":\"period1-153\",\"period2\":\"period2-734\",\"sellBookText1\":\"sellBookText1-488\",\"sellBookText2\":\"sellBookText2-668\",\"sellQty1\":4950,\"sellQty2\":4431,\"spotDate\":\"2026-03-18\",\"trdrRate1\":1.629,\"trxDate\":\"2026-03-18\"}"

# [112] POST /doc-fxtrs — FXTR API
run_request "[112] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":1027,\"advText\":\"advText-229\",\"bdeRecVersion\":4490,\"buyQty\":5854,\"dealFwdRate\":6.431,\"dealSpotRate\":2.994,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-983\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-127\",\"fwdSpread\":1175,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-843\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-905\",\"limit\":9772,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8993,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2924,\"orderedBy\":\"orderedBy-825\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-749\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":943,\"settlePlanA\":true,\"spotSpread1\":3885,\"spotSpread2\":7112,\"trdrRate\":3.365,\"trigPrice\":3070,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44421152821\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [113] GET /doc-fxtrs/{id} — FXTR API
run_request "[113] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [114] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[114] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":7523,\"advText\":\"advText-710\",\"bdeRecVersion\":6725,\"buyQty\":1224,\"dealFwdRate\":5.12,\"dealSpotRate\":4.028,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-535\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-594\",\"fwdSpread\":5494,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-740\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-461\",\"limit\":8855,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":9346,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":775,\"orderedBy\":\"orderedBy-505\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-338\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6893,\"settlePlanA\":true,\"spotSpread1\":2766,\"spotSpread2\":1694,\"trdrRate\":6.122,\"trigPrice\":357,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33160535472\"}"

# [115] POST /doc-fxsws — FX Swap API
run_request "[115] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-428\",\"bdeRecVersion\":6652,\"buyBookText1\":\"buyBookText1-958\",\"buyBookText2\":\"buyBookText2-828\",\"buyQty1\":9548,\"buyQty2\":6086,\"cfi\":\"cfi-138\",\"dealFwdRate1\":4.538,\"dealFwdRate2\":1.143,\"dealSpotRate1\":0.294,\"dealSpotRate2\":7.645,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE1460374720\",\"lastTrans\":\"lastTrans-918\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-873\",\"period1\":\"period1-421\",\"period2\":\"period2-498\",\"sellBookText1\":\"sellBookText1-836\",\"sellBookText2\":\"sellBookText2-706\",\"sellQty1\":4750,\"sellQty2\":1470,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.312,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [116] GET /doc-fxsws/{id} — FX Swap API
run_request "[116] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [117] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[117] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-673\",\"bdeRecVersion\":6824,\"buyBookText1\":\"buyBookText1-808\",\"buyBookText2\":\"buyBookText2-318\",\"buyQty1\":2166,\"buyQty2\":215,\"cfi\":\"cfi-889\",\"dealFwdRate1\":5.665,\"dealFwdRate2\":8.079,\"dealSpotRate1\":5.066,\"dealSpotRate2\":1.296,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US3108801674\",\"lastTrans\":\"lastTrans-398\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-700\",\"period1\":\"period1-306\",\"period2\":\"period2-402\",\"sellBookText1\":\"sellBookText1-115\",\"sellBookText2\":\"sellBookText2-160\",\"sellQty1\":4287,\"sellQty2\":7558,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.627,\"trxDate\":\"2026-03-18\"}"

# [118] POST /doc-fxtrs — FXTR API
run_request "[118] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4589,\"advText\":\"advText-839\",\"bdeRecVersion\":7521,\"buyQty\":7913,\"dealFwdRate\":6.107,\"dealSpotRate\":0.94,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-205\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-722\",\"fwdSpread\":7787,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-678\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-889\",\"limit\":9965,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2139,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2369,\"orderedBy\":\"orderedBy-132\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-382\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4086,\"settlePlanA\":true,\"spotSpread1\":7539,\"spotSpread2\":7853,\"trdrRate\":6.098,\"trigPrice\":4112,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39802135859\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [119] GET /doc-fxtrs/{id} — FXTR API
run_request "[119] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [120] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[120] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":8756,\"advText\":\"advText-511\",\"bdeRecVersion\":3088,\"buyQty\":3815,\"dealFwdRate\":5.208,\"dealSpotRate\":4.69,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-990\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-704\",\"fwdSpread\":8612,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-994\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-858\",\"limit\":7929,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1298,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":261,\"orderedBy\":\"orderedBy-947\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-962\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":178,\"settlePlanA\":true,\"spotSpread1\":3171,\"spotSpread2\":4486,\"trdrRate\":2.801,\"trigPrice\":7235,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41955149424\"}"

# [121] POST /doc-fxsws — FX Swap API
run_request "[121] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-790\",\"bdeRecVersion\":7044,\"buyBookText1\":\"buyBookText1-936\",\"buyBookText2\":\"buyBookText2-976\",\"buyQty1\":3301,\"buyQty2\":9808,\"cfi\":\"cfi-103\",\"dealFwdRate1\":6.148,\"dealFwdRate2\":3.913,\"dealSpotRate1\":1.675,\"dealSpotRate2\":2.128,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR8058066232\",\"lastTrans\":\"lastTrans-997\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-843\",\"period1\":\"period1-540\",\"period2\":\"period2-647\",\"sellBookText1\":\"sellBookText1-348\",\"sellBookText2\":\"sellBookText2-750\",\"sellQty1\":4311,\"sellQty2\":5189,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.975,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [122] GET /doc-fxsws/{id} — FX Swap API
run_request "[122] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [123] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[123] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-641\",\"bdeRecVersion\":8666,\"buyBookText1\":\"buyBookText1-721\",\"buyBookText2\":\"buyBookText2-825\",\"buyQty1\":8026,\"buyQty2\":5677,\"cfi\":\"cfi-491\",\"dealFwdRate1\":5.858,\"dealFwdRate2\":0.58,\"dealSpotRate1\":2.721,\"dealSpotRate2\":1.606,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR9399619056\",\"lastTrans\":\"lastTrans-467\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-678\",\"period1\":\"period1-722\",\"period2\":\"period2-354\",\"sellBookText1\":\"sellBookText1-812\",\"sellBookText2\":\"sellBookText2-832\",\"sellQty1\":3137,\"sellQty2\":7263,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.052,\"trxDate\":\"2026-03-18\"}"

# [124] POST /doc-fxtrs — FXTR API
run_request "[124] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3137,\"advText\":\"advText-473\",\"bdeRecVersion\":2942,\"buyQty\":7721,\"dealFwdRate\":2.077,\"dealSpotRate\":1.739,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-993\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-816\",\"fwdSpread\":3902,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-938\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-565\",\"limit\":2491,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":3754,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":675,\"orderedBy\":\"orderedBy-718\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-676\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8393,\"settlePlanA\":true,\"spotSpread1\":3261,\"spotSpread2\":8972,\"trdrRate\":3.896,\"trigPrice\":8480,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39498875700\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [125] GET /doc-fxtrs/{id} — FXTR API
run_request "[125] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [126] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[126] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":2779,\"advText\":\"advText-829\",\"bdeRecVersion\":8451,\"buyQty\":4531,\"dealFwdRate\":2.476,\"dealSpotRate\":7.266,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-250\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-166\",\"fwdSpread\":1049,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-328\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-884\",\"limit\":7633,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2953,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":1448,\"orderedBy\":\"orderedBy-961\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-115\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5029,\"settlePlanA\":true,\"spotSpread1\":5928,\"spotSpread2\":9019,\"trdrRate\":5.74,\"trigPrice\":4444,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49455023994\"}"

# [127] POST /doc-fxsws — FX Swap API
run_request "[127] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-229\",\"bdeRecVersion\":9962,\"buyBookText1\":\"buyBookText1-629\",\"buyBookText2\":\"buyBookText2-927\",\"buyQty1\":386,\"buyQty2\":7846,\"cfi\":\"cfi-889\",\"dealFwdRate1\":1.277,\"dealFwdRate2\":7.168,\"dealSpotRate1\":7.263,\"dealSpotRate2\":7.683,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US7353768407\",\"lastTrans\":\"lastTrans-856\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-347\",\"period1\":\"period1-615\",\"period2\":\"period2-762\",\"sellBookText1\":\"sellBookText1-426\",\"sellBookText2\":\"sellBookText2-748\",\"sellQty1\":6422,\"sellQty2\":2439,\"spotDate\":\"2026-03-18\",\"trdrRate1\":8.332,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [128] GET /doc-fxsws/{id} — FX Swap API
run_request "[128] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [129] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[129] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-524\",\"bdeRecVersion\":8010,\"buyBookText1\":\"buyBookText1-526\",\"buyBookText2\":\"buyBookText2-361\",\"buyQty1\":1511,\"buyQty2\":6786,\"cfi\":\"cfi-639\",\"dealFwdRate1\":5.824,\"dealFwdRate2\":7.822,\"dealSpotRate1\":6.079,\"dealSpotRate2\":2.869,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH9426729359\",\"lastTrans\":\"lastTrans-407\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-112\",\"period1\":\"period1-876\",\"period2\":\"period2-488\",\"sellBookText1\":\"sellBookText1-521\",\"sellBookText2\":\"sellBookText2-772\",\"sellQty1\":5958,\"sellQty2\":980,\"spotDate\":\"2026-03-18\",\"trdrRate1\":1.817,\"trxDate\":\"2026-03-18\"}"

# [130] POST /doc-fxtrs — FXTR API
run_request "[130] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3155,\"advText\":\"advText-223\",\"bdeRecVersion\":3495,\"buyQty\":6660,\"dealFwdRate\":3.28,\"dealSpotRate\":7.145,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-819\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-303\",\"fwdSpread\":335,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-186\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-885\",\"limit\":5339,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":6373,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6994,\"orderedBy\":\"orderedBy-648\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-338\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8849,\"settlePlanA\":true,\"spotSpread1\":7891,\"spotSpread2\":8839,\"trdrRate\":2.585,\"trigPrice\":8019,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41226379802\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [131] GET /doc-fxtrs/{id} — FXTR API
run_request "[131] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [132] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[132] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1548,\"advText\":\"advText-103\",\"bdeRecVersion\":7344,\"buyQty\":5356,\"dealFwdRate\":6.245,\"dealSpotRate\":4.398,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-592\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-807\",\"fwdSpread\":8485,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-238\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-321\",\"limit\":2228,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7519,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6733,\"orderedBy\":\"orderedBy-194\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-461\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1442,\"settlePlanA\":true,\"spotSpread1\":682,\"spotSpread2\":6237,\"trdrRate\":5.432,\"trigPrice\":3881,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33191248202\"}"

# [133] POST /doc-fxsws — FX Swap API
run_request "[133] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-415\",\"bdeRecVersion\":8827,\"buyBookText1\":\"buyBookText1-316\",\"buyBookText2\":\"buyBookText2-293\",\"buyQty1\":1608,\"buyQty2\":8377,\"cfi\":\"cfi-613\",\"dealFwdRate1\":4.653,\"dealFwdRate2\":2.815,\"dealSpotRate1\":1.047,\"dealSpotRate2\":6.023,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR6140848566\",\"lastTrans\":\"lastTrans-132\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-692\",\"period1\":\"period1-724\",\"period2\":\"period2-957\",\"sellBookText1\":\"sellBookText1-504\",\"sellBookText2\":\"sellBookText2-471\",\"sellQty1\":784,\"sellQty2\":3202,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.622,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [134] GET /doc-fxsws/{id} — FX Swap API
run_request "[134] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [135] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[135] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-194\",\"bdeRecVersion\":912,\"buyBookText1\":\"buyBookText1-559\",\"buyBookText2\":\"buyBookText2-373\",\"buyQty1\":9120,\"buyQty2\":5768,\"cfi\":\"cfi-486\",\"dealFwdRate1\":5.903,\"dealFwdRate2\":4.615,\"dealSpotRate1\":3.279,\"dealSpotRate2\":2.897,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB5274022151\",\"lastTrans\":\"lastTrans-451\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-110\",\"period1\":\"period1-112\",\"period2\":\"period2-449\",\"sellBookText1\":\"sellBookText1-830\",\"sellBookText2\":\"sellBookText2-718\",\"sellQty1\":6776,\"sellQty2\":6657,\"spotDate\":\"2026-03-18\",\"trdrRate1\":1.922,\"trxDate\":\"2026-03-18\"}"

# [136] POST /doc-fxtrs — FXTR API
run_request "[136] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":8983,\"advText\":\"advText-136\",\"bdeRecVersion\":1757,\"buyQty\":6104,\"dealFwdRate\":5.297,\"dealSpotRate\":1.099,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-917\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-309\",\"fwdSpread\":3634,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-686\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-328\",\"limit\":8537,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":5022,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8814,\"orderedBy\":\"orderedBy-407\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-167\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9221,\"settlePlanA\":true,\"spotSpread1\":3677,\"spotSpread2\":8585,\"trdrRate\":3.379,\"trigPrice\":8849,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33682571654\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [137] GET /doc-fxtrs/{id} — FXTR API
run_request "[137] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [138] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[138] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":3209,\"advText\":\"advText-678\",\"bdeRecVersion\":2642,\"buyQty\":7185,\"dealFwdRate\":0.393,\"dealSpotRate\":4.272,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-454\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-449\",\"fwdSpread\":5905,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-248\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-268\",\"limit\":7086,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1272,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2592,\"orderedBy\":\"orderedBy-111\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-607\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7901,\"settlePlanA\":true,\"spotSpread1\":2543,\"spotSpread2\":466,\"trdrRate\":6.134,\"trigPrice\":2234,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33119971247\"}"

# [139] POST /doc-fxsws — FX Swap API
run_request "[139] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-928\",\"bdeRecVersion\":6978,\"buyBookText1\":\"buyBookText1-567\",\"buyBookText2\":\"buyBookText2-112\",\"buyQty1\":1934,\"buyQty2\":3596,\"cfi\":\"cfi-664\",\"dealFwdRate1\":2.426,\"dealFwdRate2\":6.133,\"dealSpotRate1\":1.622,\"dealSpotRate2\":5.879,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE2156465677\",\"lastTrans\":\"lastTrans-887\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-483\",\"period1\":\"period1-223\",\"period2\":\"period2-264\",\"sellBookText1\":\"sellBookText1-519\",\"sellBookText2\":\"sellBookText2-676\",\"sellQty1\":7981,\"sellQty2\":4893,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.247,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [140] GET /doc-fxsws/{id} — FX Swap API
run_request "[140] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [141] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[141] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-594\",\"bdeRecVersion\":1432,\"buyBookText1\":\"buyBookText1-618\",\"buyBookText2\":\"buyBookText2-335\",\"buyQty1\":7559,\"buyQty2\":6696,\"cfi\":\"cfi-804\",\"dealFwdRate1\":1.407,\"dealFwdRate2\":3.366,\"dealSpotRate1\":5.444,\"dealSpotRate2\":6.811,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US1735082942\",\"lastTrans\":\"lastTrans-503\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-756\",\"period1\":\"period1-735\",\"period2\":\"period2-197\",\"sellBookText1\":\"sellBookText1-250\",\"sellBookText2\":\"sellBookText2-475\",\"sellQty1\":5791,\"sellQty2\":5339,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.041,\"trxDate\":\"2026-03-18\"}"

# [142] POST /doc-fxtrs — FXTR API
run_request "[142] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":2451,\"advText\":\"advText-726\",\"bdeRecVersion\":704,\"buyQty\":8413,\"dealFwdRate\":5.132,\"dealSpotRate\":6.424,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-275\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-259\",\"fwdSpread\":8360,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-856\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-901\",\"limit\":3066,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":459,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":7074,\"orderedBy\":\"orderedBy-314\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-849\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":684,\"settlePlanA\":true,\"spotSpread1\":3453,\"spotSpread2\":1497,\"trdrRate\":2.171,\"trigPrice\":8901,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44454429067\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [143] GET /doc-fxtrs/{id} — FXTR API
run_request "[143] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [144] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[144] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":5618,\"advText\":\"advText-777\",\"bdeRecVersion\":716,\"buyQty\":9205,\"dealFwdRate\":3.052,\"dealSpotRate\":7.777,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-362\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-406\",\"fwdSpread\":4517,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-176\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-282\",\"limit\":6971,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":6375,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":1796,\"orderedBy\":\"orderedBy-641\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-513\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3338,\"settlePlanA\":true,\"spotSpread1\":6147,\"spotSpread2\":2477,\"trdrRate\":1.714,\"trigPrice\":9402,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33390014025\"}"

# [145] POST /doc-fxsws — FX Swap API
run_request "[145] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-384\",\"bdeRecVersion\":4569,\"buyBookText1\":\"buyBookText1-387\",\"buyBookText2\":\"buyBookText2-903\",\"buyQty1\":2914,\"buyQty2\":3338,\"cfi\":\"cfi-367\",\"dealFwdRate1\":3.218,\"dealFwdRate2\":5.555,\"dealSpotRate1\":7.427,\"dealSpotRate2\":1.237,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE5406268921\",\"lastTrans\":\"lastTrans-823\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-126\",\"period1\":\"period1-801\",\"period2\":\"period2-180\",\"sellBookText1\":\"sellBookText1-266\",\"sellBookText2\":\"sellBookText2-284\",\"sellQty1\":6624,\"sellQty2\":499,\"spotDate\":\"2026-03-18\",\"trdrRate1\":8.5,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [146] GET /doc-fxsws/{id} — FX Swap API
run_request "[146] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [147] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[147] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-857\",\"bdeRecVersion\":6486,\"buyBookText1\":\"buyBookText1-135\",\"buyBookText2\":\"buyBookText2-245\",\"buyQty1\":7914,\"buyQty2\":3803,\"cfi\":\"cfi-675\",\"dealFwdRate1\":7.397,\"dealFwdRate2\":5.519,\"dealSpotRate1\":5.168,\"dealSpotRate2\":3.86,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE7165980895\",\"lastTrans\":\"lastTrans-741\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-150\",\"period1\":\"period1-512\",\"period2\":\"period2-980\",\"sellBookText1\":\"sellBookText1-428\",\"sellBookText2\":\"sellBookText2-664\",\"sellQty1\":2251,\"sellQty2\":3303,\"spotDate\":\"2026-03-18\",\"trdrRate1\":8.01,\"trxDate\":\"2026-03-18\"}"

# [148] POST /doc-fxtrs — FXTR API
run_request "[148] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4741,\"advText\":\"advText-591\",\"bdeRecVersion\":6738,\"buyQty\":2513,\"dealFwdRate\":0.669,\"dealSpotRate\":3.986,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-633\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-704\",\"fwdSpread\":7408,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-981\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-644\",\"limit\":739,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1906,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":9896,\"orderedBy\":\"orderedBy-184\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-348\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1530,\"settlePlanA\":true,\"spotSpread1\":9710,\"spotSpread2\":2172,\"trdrRate\":0.788,\"trigPrice\":2484,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44372218747\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [149] GET /doc-fxtrs/{id} — FXTR API
run_request "[149] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [150] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[150] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":4157,\"advText\":\"advText-895\",\"bdeRecVersion\":1984,\"buyQty\":9887,\"dealFwdRate\":5.292,\"dealSpotRate\":6.689,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-509\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-674\",\"fwdSpread\":2821,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-773\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-438\",\"limit\":6130,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4209,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4273,\"orderedBy\":\"orderedBy-797\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-298\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8002,\"settlePlanA\":true,\"spotSpread1\":1356,\"spotSpread2\":3283,\"trdrRate\":0.42,\"trigPrice\":208,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49729954958\"}"

# [151] POST /doc-fxsws — FX Swap API
run_request "[151] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-948\",\"bdeRecVersion\":6710,\"buyBookText1\":\"buyBookText1-583\",\"buyBookText2\":\"buyBookText2-485\",\"buyQty1\":3758,\"buyQty2\":5348,\"cfi\":\"cfi-716\",\"dealFwdRate1\":3.262,\"dealFwdRate2\":7.129,\"dealSpotRate1\":4.913,\"dealSpotRate2\":0.873,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH9807888417\",\"lastTrans\":\"lastTrans-925\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-386\",\"period1\":\"period1-121\",\"period2\":\"period2-465\",\"sellBookText1\":\"sellBookText1-758\",\"sellBookText2\":\"sellBookText2-140\",\"sellQty1\":3338,\"sellQty2\":8524,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.504,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [152] GET /doc-fxsws/{id} — FX Swap API
run_request "[152] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [153] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[153] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-407\",\"bdeRecVersion\":756,\"buyBookText1\":\"buyBookText1-224\",\"buyBookText2\":\"buyBookText2-763\",\"buyQty1\":8263,\"buyQty2\":454,\"cfi\":\"cfi-486\",\"dealFwdRate1\":1.153,\"dealFwdRate2\":0.644,\"dealSpotRate1\":2.978,\"dealSpotRate2\":7.365,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE8252518693\",\"lastTrans\":\"lastTrans-104\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-127\",\"period1\":\"period1-682\",\"period2\":\"period2-400\",\"sellBookText1\":\"sellBookText1-450\",\"sellBookText2\":\"sellBookText2-609\",\"sellQty1\":7104,\"sellQty2\":6854,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.252,\"trxDate\":\"2026-03-18\"}"

# [154] POST /doc-fxtrs — FXTR API
run_request "[154] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4197,\"advText\":\"advText-610\",\"bdeRecVersion\":3667,\"buyQty\":7618,\"dealFwdRate\":7.97,\"dealSpotRate\":5.469,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-643\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-401\",\"fwdSpread\":1578,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-724\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-217\",\"limit\":8503,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2401,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4785,\"orderedBy\":\"orderedBy-115\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-174\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":818,\"settlePlanA\":true,\"spotSpread1\":478,\"spotSpread2\":2848,\"trdrRate\":0.223,\"trigPrice\":8438,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41141326600\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [155] GET /doc-fxtrs/{id} — FXTR API
run_request "[155] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [156] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[156] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":2186,\"advText\":\"advText-921\",\"bdeRecVersion\":2324,\"buyQty\":5620,\"dealFwdRate\":8.478,\"dealSpotRate\":1.401,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-860\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-202\",\"fwdSpread\":3661,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-378\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-862\",\"limit\":1341,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1238,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":1172,\"orderedBy\":\"orderedBy-544\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-446\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8947,\"settlePlanA\":true,\"spotSpread1\":6486,\"spotSpread2\":5441,\"trdrRate\":2.087,\"trigPrice\":8360,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49169380126\"}"

# [157] POST /doc-fxsws — FX Swap API
run_request "[157] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-925\",\"bdeRecVersion\":4713,\"buyBookText1\":\"buyBookText1-384\",\"buyBookText2\":\"buyBookText2-152\",\"buyQty1\":1834,\"buyQty2\":2625,\"cfi\":\"cfi-218\",\"dealFwdRate1\":4.525,\"dealFwdRate2\":5.572,\"dealSpotRate1\":4.608,\"dealSpotRate2\":6.538,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR3461990829\",\"lastTrans\":\"lastTrans-477\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-866\",\"period1\":\"period1-706\",\"period2\":\"period2-322\",\"sellBookText1\":\"sellBookText1-303\",\"sellBookText2\":\"sellBookText2-754\",\"sellQty1\":1959,\"sellQty2\":4511,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.267,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [158] GET /doc-fxsws/{id} — FX Swap API
run_request "[158] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [159] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[159] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-806\",\"bdeRecVersion\":6010,\"buyBookText1\":\"buyBookText1-732\",\"buyBookText2\":\"buyBookText2-973\",\"buyQty1\":8060,\"buyQty2\":8333,\"cfi\":\"cfi-622\",\"dealFwdRate1\":2.798,\"dealFwdRate2\":7.553,\"dealSpotRate1\":2.568,\"dealSpotRate2\":4.616,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB1657652107\",\"lastTrans\":\"lastTrans-637\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-101\",\"period1\":\"period1-434\",\"period2\":\"period2-624\",\"sellBookText1\":\"sellBookText1-697\",\"sellBookText2\":\"sellBookText2-288\",\"sellQty1\":5390,\"sellQty2\":9788,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.209,\"trxDate\":\"2026-03-18\"}"

# [160] POST /doc-fxtrs — FXTR API
run_request "[160] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":8215,\"advText\":\"advText-774\",\"bdeRecVersion\":3200,\"buyQty\":8228,\"dealFwdRate\":0.193,\"dealSpotRate\":7.173,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-481\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-280\",\"fwdSpread\":6165,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-920\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-848\",\"limit\":2141,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7672,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":995,\"orderedBy\":\"orderedBy-845\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-338\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":649,\"settlePlanA\":true,\"spotSpread1\":8880,\"spotSpread2\":5277,\"trdrRate\":0.276,\"trigPrice\":1804,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44633795329\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [161] GET /doc-fxtrs/{id} — FXTR API
run_request "[161] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [162] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[162] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":9209,\"advText\":\"advText-772\",\"bdeRecVersion\":308,\"buyQty\":2668,\"dealFwdRate\":4.634,\"dealSpotRate\":3.352,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-594\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-457\",\"fwdSpread\":6753,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-454\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-608\",\"limit\":2986,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":401,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2190,\"orderedBy\":\"orderedBy-789\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-800\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5420,\"settlePlanA\":true,\"spotSpread1\":9409,\"spotSpread2\":775,\"trdrRate\":4.732,\"trigPrice\":4109,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39564934200\"}"

# [163] POST /doc-fxsws — FX Swap API
run_request "[163] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-505\",\"bdeRecVersion\":8430,\"buyBookText1\":\"buyBookText1-228\",\"buyBookText2\":\"buyBookText2-200\",\"buyQty1\":1232,\"buyQty2\":8499,\"cfi\":\"cfi-179\",\"dealFwdRate1\":1.79,\"dealFwdRate2\":0.969,\"dealSpotRate1\":7.676,\"dealSpotRate2\":1.567,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH7458706041\",\"lastTrans\":\"lastTrans-373\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-743\",\"period1\":\"period1-400\",\"period2\":\"period2-805\",\"sellBookText1\":\"sellBookText1-648\",\"sellBookText2\":\"sellBookText2-638\",\"sellQty1\":9923,\"sellQty2\":9265,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.906,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [164] GET /doc-fxsws/{id} — FX Swap API
run_request "[164] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [165] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[165] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-927\",\"bdeRecVersion\":1711,\"buyBookText1\":\"buyBookText1-770\",\"buyBookText2\":\"buyBookText2-178\",\"buyQty1\":274,\"buyQty2\":2029,\"cfi\":\"cfi-327\",\"dealFwdRate1\":4.604,\"dealFwdRate2\":0.508,\"dealSpotRate1\":6.751,\"dealSpotRate2\":5.477,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE7988583612\",\"lastTrans\":\"lastTrans-348\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-169\",\"period1\":\"period1-415\",\"period2\":\"period2-254\",\"sellBookText1\":\"sellBookText1-172\",\"sellBookText2\":\"sellBookText2-198\",\"sellQty1\":3402,\"sellQty2\":1851,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.991,\"trxDate\":\"2026-03-18\"}"

# [166] POST /doc-fxtrs — FXTR API
run_request "[166] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":6321,\"advText\":\"advText-411\",\"bdeRecVersion\":8803,\"buyQty\":778,\"dealFwdRate\":4.08,\"dealSpotRate\":2.456,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-309\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-791\",\"fwdSpread\":5728,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-495\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-914\",\"limit\":6523,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4655,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":9724,\"orderedBy\":\"orderedBy-187\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-590\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6660,\"settlePlanA\":true,\"spotSpread1\":2441,\"spotSpread2\":6312,\"trdrRate\":2.214,\"trigPrice\":3098,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41524977825\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [167] GET /doc-fxtrs/{id} — FXTR API
run_request "[167] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [168] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[168] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":238,\"advText\":\"advText-987\",\"bdeRecVersion\":7493,\"buyQty\":5377,\"dealFwdRate\":1.887,\"dealSpotRate\":1.524,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-516\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-970\",\"fwdSpread\":3456,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-135\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-537\",\"limit\":9758,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":5426,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2157,\"orderedBy\":\"orderedBy-837\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-591\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3738,\"settlePlanA\":true,\"spotSpread1\":969,\"spotSpread2\":5258,\"trdrRate\":3.722,\"trigPrice\":936,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33799445191\"}"

# [169] POST /doc-fxsws — FX Swap API
run_request "[169] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-924\",\"bdeRecVersion\":1858,\"buyBookText1\":\"buyBookText1-416\",\"buyBookText2\":\"buyBookText2-353\",\"buyQty1\":341,\"buyQty2\":935,\"cfi\":\"cfi-778\",\"dealFwdRate1\":4.544,\"dealFwdRate2\":4.019,\"dealSpotRate1\":2.301,\"dealSpotRate2\":7.967,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR9417422861\",\"lastTrans\":\"lastTrans-927\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-276\",\"period1\":\"period1-814\",\"period2\":\"period2-606\",\"sellBookText1\":\"sellBookText1-968\",\"sellBookText2\":\"sellBookText2-957\",\"sellQty1\":5703,\"sellQty2\":8185,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.341,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [170] GET /doc-fxsws/{id} — FX Swap API
run_request "[170] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [171] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[171] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-576\",\"bdeRecVersion\":2296,\"buyBookText1\":\"buyBookText1-221\",\"buyBookText2\":\"buyBookText2-437\",\"buyQty1\":5710,\"buyQty2\":6587,\"cfi\":\"cfi-267\",\"dealFwdRate1\":7.674,\"dealFwdRate2\":6.756,\"dealSpotRate1\":4.786,\"dealSpotRate2\":4.835,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE4567118748\",\"lastTrans\":\"lastTrans-226\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-702\",\"period1\":\"period1-265\",\"period2\":\"period2-953\",\"sellBookText1\":\"sellBookText1-687\",\"sellBookText2\":\"sellBookText2-398\",\"sellQty1\":2388,\"sellQty2\":4308,\"spotDate\":\"2026-03-18\",\"trdrRate1\":1.224,\"trxDate\":\"2026-03-18\"}"

# [172] POST /doc-fxtrs — FXTR API
run_request "[172] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":545,\"advText\":\"advText-126\",\"bdeRecVersion\":1766,\"buyQty\":9879,\"dealFwdRate\":3.498,\"dealSpotRate\":5.537,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-765\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-108\",\"fwdSpread\":5923,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-486\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-566\",\"limit\":3605,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8402,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":3049,\"orderedBy\":\"orderedBy-645\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-430\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4085,\"settlePlanA\":true,\"spotSpread1\":6831,\"spotSpread2\":9677,\"trdrRate\":7,\"trigPrice\":2342,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39839950262\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [173] GET /doc-fxtrs/{id} — FXTR API
run_request "[173] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [174] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[174] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":2679,\"advText\":\"advText-605\",\"bdeRecVersion\":2416,\"buyQty\":5301,\"dealFwdRate\":0.195,\"dealSpotRate\":6.973,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-310\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-296\",\"fwdSpread\":5122,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-338\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-731\",\"limit\":9184,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4993,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8598,\"orderedBy\":\"orderedBy-621\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-326\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3857,\"settlePlanA\":true,\"spotSpread1\":5153,\"spotSpread2\":5480,\"trdrRate\":5.928,\"trigPrice\":9586,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49269616160\"}"

# [175] POST /doc-fxsws — FX Swap API
run_request "[175] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-256\",\"bdeRecVersion\":1181,\"buyBookText1\":\"buyBookText1-501\",\"buyBookText2\":\"buyBookText2-157\",\"buyQty1\":7263,\"buyQty2\":5904,\"cfi\":\"cfi-670\",\"dealFwdRate1\":2.842,\"dealFwdRate2\":1.153,\"dealSpotRate1\":1.514,\"dealSpotRate2\":8.438,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR5019684735\",\"lastTrans\":\"lastTrans-627\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-999\",\"period1\":\"period1-447\",\"period2\":\"period2-372\",\"sellBookText1\":\"sellBookText1-845\",\"sellBookText2\":\"sellBookText2-459\",\"sellQty1\":9428,\"sellQty2\":5365,\"spotDate\":\"2026-03-18\",\"trdrRate1\":1.496,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [176] GET /doc-fxsws/{id} — FX Swap API
run_request "[176] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [177] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[177] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-615\",\"bdeRecVersion\":5047,\"buyBookText1\":\"buyBookText1-962\",\"buyBookText2\":\"buyBookText2-198\",\"buyQty1\":1820,\"buyQty2\":3441,\"cfi\":\"cfi-122\",\"dealFwdRate1\":8.142,\"dealFwdRate2\":7.522,\"dealSpotRate1\":6.927,\"dealSpotRate2\":3.643,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR3797473397\",\"lastTrans\":\"lastTrans-875\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-495\",\"period1\":\"period1-405\",\"period2\":\"period2-685\",\"sellBookText1\":\"sellBookText1-747\",\"sellBookText2\":\"sellBookText2-893\",\"sellQty1\":5251,\"sellQty2\":9804,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.927,\"trxDate\":\"2026-03-18\"}"

# [178] POST /doc-fxtrs — FXTR API
run_request "[178] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":9612,\"advText\":\"advText-413\",\"bdeRecVersion\":9128,\"buyQty\":9612,\"dealFwdRate\":3.874,\"dealSpotRate\":7.648,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-139\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-710\",\"fwdSpread\":8530,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-204\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-757\",\"limit\":1278,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7581,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8230,\"orderedBy\":\"orderedBy-947\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-991\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6812,\"settlePlanA\":true,\"spotSpread1\":5934,\"spotSpread2\":3378,\"trdrRate\":6.276,\"trigPrice\":560,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39389915253\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [179] GET /doc-fxtrs/{id} — FXTR API
run_request "[179] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [180] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[180] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":9680,\"advText\":\"advText-918\",\"bdeRecVersion\":4271,\"buyQty\":194,\"dealFwdRate\":1.393,\"dealSpotRate\":7.004,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-209\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-582\",\"fwdSpread\":9004,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-890\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-663\",\"limit\":5371,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":9684,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2215,\"orderedBy\":\"orderedBy-433\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-219\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":2079,\"settlePlanA\":true,\"spotSpread1\":9740,\"spotSpread2\":5278,\"trdrRate\":1.902,\"trigPrice\":5730,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39327262009\"}"

# [181] POST /doc-fxsws — FX Swap API
run_request "[181] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-181\",\"bdeRecVersion\":1064,\"buyBookText1\":\"buyBookText1-923\",\"buyBookText2\":\"buyBookText2-212\",\"buyQty1\":7545,\"buyQty2\":8319,\"cfi\":\"cfi-951\",\"dealFwdRate1\":2.919,\"dealFwdRate2\":2.2,\"dealSpotRate1\":2.83,\"dealSpotRate2\":5.12,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB3731421724\",\"lastTrans\":\"lastTrans-384\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-844\",\"period1\":\"period1-748\",\"period2\":\"period2-229\",\"sellBookText1\":\"sellBookText1-509\",\"sellBookText2\":\"sellBookText2-592\",\"sellQty1\":1922,\"sellQty2\":7948,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.345,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [182] GET /doc-fxsws/{id} — FX Swap API
run_request "[182] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [183] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[183] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-849\",\"bdeRecVersion\":1391,\"buyBookText1\":\"buyBookText1-945\",\"buyBookText2\":\"buyBookText2-873\",\"buyQty1\":5527,\"buyQty2\":9813,\"cfi\":\"cfi-944\",\"dealFwdRate1\":5.516,\"dealFwdRate2\":7.636,\"dealSpotRate1\":7.044,\"dealSpotRate2\":4.342,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE3466912304\",\"lastTrans\":\"lastTrans-689\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-958\",\"period1\":\"period1-660\",\"period2\":\"period2-421\",\"sellBookText1\":\"sellBookText1-779\",\"sellBookText2\":\"sellBookText2-363\",\"sellQty1\":9050,\"sellQty2\":9151,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.652,\"trxDate\":\"2026-03-18\"}"

# [184] POST /doc-fxtrs — FXTR API
run_request "[184] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":7330,\"advText\":\"advText-273\",\"bdeRecVersion\":3936,\"buyQty\":9806,\"dealFwdRate\":5,\"dealSpotRate\":0.771,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-882\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-629\",\"fwdSpread\":9109,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-567\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-212\",\"limit\":7080,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":9557,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":5638,\"orderedBy\":\"orderedBy-354\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-600\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9266,\"settlePlanA\":true,\"spotSpread1\":3693,\"spotSpread2\":1876,\"trdrRate\":2.285,\"trigPrice\":199,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39837125808\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [185] GET /doc-fxtrs/{id} — FXTR API
run_request "[185] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [186] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[186] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":466,\"advText\":\"advText-888\",\"bdeRecVersion\":7350,\"buyQty\":1525,\"dealFwdRate\":3.765,\"dealSpotRate\":5.132,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-221\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-526\",\"fwdSpread\":3102,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-492\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-593\",\"limit\":2556,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4035,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4051,\"orderedBy\":\"orderedBy-515\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-251\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3283,\"settlePlanA\":true,\"spotSpread1\":5864,\"spotSpread2\":2593,\"trdrRate\":3.963,\"trigPrice\":5132,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39103022119\"}"

# [187] POST /doc-fxsws — FX Swap API
run_request "[187] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-885\",\"bdeRecVersion\":5663,\"buyBookText1\":\"buyBookText1-115\",\"buyBookText2\":\"buyBookText2-238\",\"buyQty1\":7293,\"buyQty2\":970,\"cfi\":\"cfi-367\",\"dealFwdRate1\":2.47,\"dealFwdRate2\":5.951,\"dealSpotRate1\":5.896,\"dealSpotRate2\":7.053,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR6701092594\",\"lastTrans\":\"lastTrans-613\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-126\",\"period1\":\"period1-303\",\"period2\":\"period2-895\",\"sellBookText1\":\"sellBookText1-126\",\"sellBookText2\":\"sellBookText2-873\",\"sellQty1\":5360,\"sellQty2\":3953,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.49,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [188] GET /doc-fxsws/{id} — FX Swap API
run_request "[188] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [189] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[189] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-839\",\"bdeRecVersion\":4859,\"buyBookText1\":\"buyBookText1-356\",\"buyBookText2\":\"buyBookText2-868\",\"buyQty1\":2491,\"buyQty2\":1746,\"cfi\":\"cfi-916\",\"dealFwdRate1\":5.779,\"dealFwdRate2\":6.719,\"dealSpotRate1\":7.085,\"dealSpotRate2\":6.835,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR7916316677\",\"lastTrans\":\"lastTrans-142\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-324\",\"period1\":\"period1-402\",\"period2\":\"period2-280\",\"sellBookText1\":\"sellBookText1-457\",\"sellBookText2\":\"sellBookText2-377\",\"sellQty1\":6499,\"sellQty2\":5174,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.61,\"trxDate\":\"2026-03-18\"}"

# [190] POST /doc-fxtrs — FXTR API
run_request "[190] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":9408,\"advText\":\"advText-726\",\"bdeRecVersion\":1559,\"buyQty\":3267,\"dealFwdRate\":2.013,\"dealSpotRate\":1.089,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-143\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-316\",\"fwdSpread\":3745,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-199\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-424\",\"limit\":5372,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":5534,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2932,\"orderedBy\":\"orderedBy-140\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-664\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8857,\"settlePlanA\":true,\"spotSpread1\":8736,\"spotSpread2\":8850,\"trdrRate\":0.295,\"trigPrice\":239,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41415974976\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [191] GET /doc-fxtrs/{id} — FXTR API
run_request "[191] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [192] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[192] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1717,\"advText\":\"advText-980\",\"bdeRecVersion\":2706,\"buyQty\":3393,\"dealFwdRate\":1.148,\"dealSpotRate\":7.844,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-361\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-966\",\"fwdSpread\":4683,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-582\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-641\",\"limit\":8284,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1891,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":894,\"orderedBy\":\"orderedBy-910\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-973\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3611,\"settlePlanA\":true,\"spotSpread1\":2476,\"spotSpread2\":490,\"trdrRate\":4.88,\"trigPrice\":2972,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33190462208\"}"

# [193] POST /doc-fxsws — FX Swap API
run_request "[193] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-653\",\"bdeRecVersion\":7550,\"buyBookText1\":\"buyBookText1-163\",\"buyBookText2\":\"buyBookText2-723\",\"buyQty1\":8170,\"buyQty2\":9898,\"cfi\":\"cfi-816\",\"dealFwdRate1\":2.192,\"dealFwdRate2\":7.549,\"dealSpotRate1\":1.4,\"dealSpotRate2\":3.402,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE1172939244\",\"lastTrans\":\"lastTrans-933\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-745\",\"period1\":\"period1-792\",\"period2\":\"period2-505\",\"sellBookText1\":\"sellBookText1-547\",\"sellBookText2\":\"sellBookText2-832\",\"sellQty1\":6302,\"sellQty2\":1067,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.537,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [194] GET /doc-fxsws/{id} — FX Swap API
run_request "[194] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [195] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[195] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-555\",\"bdeRecVersion\":8756,\"buyBookText1\":\"buyBookText1-391\",\"buyBookText2\":\"buyBookText2-432\",\"buyQty1\":9693,\"buyQty2\":3918,\"cfi\":\"cfi-704\",\"dealFwdRate1\":3.093,\"dealFwdRate2\":0.951,\"dealSpotRate1\":5.596,\"dealSpotRate2\":5.848,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB4671564620\",\"lastTrans\":\"lastTrans-374\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-336\",\"period1\":\"period1-317\",\"period2\":\"period2-248\",\"sellBookText1\":\"sellBookText1-136\",\"sellBookText2\":\"sellBookText2-336\",\"sellQty1\":1321,\"sellQty2\":5426,\"spotDate\":\"2026-03-18\",\"trdrRate1\":2.107,\"trxDate\":\"2026-03-18\"}"

# [196] POST /doc-fxtrs — FXTR API
run_request "[196] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5304,\"advText\":\"advText-764\",\"bdeRecVersion\":6826,\"buyQty\":4041,\"dealFwdRate\":1.69,\"dealSpotRate\":1.852,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-949\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-789\",\"fwdSpread\":4605,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-601\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-152\",\"limit\":8551,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1224,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4366,\"orderedBy\":\"orderedBy-819\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-551\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9029,\"settlePlanA\":true,\"spotSpread1\":2795,\"spotSpread2\":7114,\"trdrRate\":2.326,\"trigPrice\":1488,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39551757982\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [197] GET /doc-fxtrs/{id} — FXTR API
run_request "[197] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [198] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[198] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":5485,\"advText\":\"advText-254\",\"bdeRecVersion\":5342,\"buyQty\":6791,\"dealFwdRate\":2.469,\"dealSpotRate\":7.681,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-864\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-152\",\"fwdSpread\":830,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-754\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-785\",\"limit\":8063,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2705,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":536,\"orderedBy\":\"orderedBy-522\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-750\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6606,\"settlePlanA\":true,\"spotSpread1\":9415,\"spotSpread2\":9756,\"trdrRate\":4.74,\"trigPrice\":3044,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41679648013\"}"

# [199] POST /doc-fxsws — FX Swap API
run_request "[199] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-132\",\"bdeRecVersion\":4608,\"buyBookText1\":\"buyBookText1-874\",\"buyBookText2\":\"buyBookText2-159\",\"buyQty1\":7622,\"buyQty2\":5849,\"cfi\":\"cfi-645\",\"dealFwdRate1\":3.406,\"dealFwdRate2\":2.829,\"dealSpotRate1\":8.223,\"dealSpotRate2\":2.894,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US1599526738\",\"lastTrans\":\"lastTrans-931\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-108\",\"period1\":\"period1-578\",\"period2\":\"period2-898\",\"sellBookText1\":\"sellBookText1-239\",\"sellBookText2\":\"sellBookText2-263\",\"sellQty1\":7091,\"sellQty2\":2651,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.671,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [200] GET /doc-fxsws/{id} — FX Swap API
run_request "[200] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>MultiTest Report · Part 1</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0d1117;color:#c9d1d9;min-height:100vh;padding:24px}
.shell{max-width:1100px;margin:0 auto}
h1{font-size:20px;font-weight:700;color:#e6edf3;margin-bottom:4px}
.meta{font-size:12px;color:#8b949e;margin-bottom:24px;font-family:monospace}
.stats{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.stat{padding:14px 22px;border-radius:10px;min-width:110px}
.stat .val{font-size:28px;font-weight:800;font-family:monospace}
.stat .lbl{font-size:11px;opacity:.7;margin-top:2px;text-transform:uppercase;letter-spacing:.6px}
.stat.pass{background:#1a3a2a;border:1px solid #2ea04326}.stat.pass .val{color:#3fb950}
.stat.fail{background:#3a1a1a;border:1px solid #f8514926}.stat.fail .val{color:#f85149}
.stat.total{background:#1c2128;border:1px solid #30363d}.stat.total .val{color:#8b949e}
.stat.pct{background:#1a2a3a;border:1px solid #388bfd26}.stat.pct .val{color:#58a6ff}
.bar-wrap{background:#21262d;border-radius:6px;height:8px;margin-bottom:24px;overflow:hidden}
.bar-fill{height:100%;border-radius:6px;background:linear-gradient(90deg,#3fb950,#58a6ff);transition:width .6s}
table{width:100%;border-collapse:collapse;font-size:13px}
thead th{background:#161b22;color:#8b949e;font-weight:600;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #30363d;position:sticky;top:0}
tr.pass{background:#0d1117}tr.pass:hover{background:#1a3a2a22}
tr.fail{background:#1a0a0a}tr.fail:hover{background:#3a1a1a33}
td{padding:9px 12px;border-bottom:1px solid #21262d;vertical-align:top}
td.icon{font-size:15px;width:32px;text-align:center}
tr.pass td.icon{color:#3fb950}tr.fail td.icon{color:#f85149}
td.code{font-family:monospace;font-weight:700;width:52px}
tr.pass td.code{color:#3fb950}tr.fail td.code{color:#f85149}
td.ms{font-family:monospace;font-size:11px;color:#8b949e;width:68px}
td.lbl{color:#8b949e;font-size:11px;width:200px}
td.url code{color:#79c0ff;font-family:monospace;font-size:12px;word-break:break-all}
td.body pre{font-family:monospace;font-size:11px;color:#adbac7;white-space:pre-wrap;word-break:break-all;max-height:120px;overflow-y:auto;background:#161b22;padding:6px 8px;border-radius:5px;border:1px solid #30363d}
</style></head><body><div class='shell'>
<h1>🧪 MultiTest Report <span style='color:#8b949e;font-size:14px'>Part 1 / 2</span></h1>
<div class='meta'>Mode: FLOW &nbsp;·&nbsp; Generated: $(date) &nbsp;·&nbsp; Base: http://localhost:8855</div>
<div class='stats'>
<div class='stat pass'><div class='val'>$PASS</div><div class='lbl'>Passed</div></div>
<div class='stat fail'><div class='val'>$FAIL</div><div class='lbl'>Failed</div></div>
<div class='stat total'><div class='val'>$TOTAL_CALC</div><div class='lbl'>Total</div></div>
<div class='stat pct'><div class='val'>${PCT}%</div><div class='lbl'>Success</div></div>
</div>
<div class='bar-wrap'><div class='bar-fill' style='width:${PCT}%'></div></div>
<table><thead><tr><th></th><th>HTTP</th><th>Time</th><th>Test</th><th>Endpoint</th><th>Response</th></tr></thead><tbody>
HTMLEOF
printf '%b' "$REPORT_ROWS" >> "$REPORT_FILE"
cat >> "$REPORT_FILE" << HTMLEOF2
</tbody></table></div></body></html>
HTMLEOF2
echo "📄 Report saved: $REPORT_FILE"
[ $FAIL -eq 0 ] && exit 0 || exit 1