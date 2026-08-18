#!/usr/bin/env bash
# =============================================================
# MultiTest Runner — FLOW Execution (Part 2/2)
# Generated: 2026-03-18T13:53:00.771Z
# Cases:     201–300 of 300
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-18-13-52-47_part2_report.html"
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
echo "Starting 100 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [201] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[201] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-119\",\"bdeRecVersion\":1480,\"buyBookText1\":\"buyBookText1-425\",\"buyBookText2\":\"buyBookText2-838\",\"buyQty1\":7735,\"buyQty2\":4201,\"cfi\":\"cfi-531\",\"dealFwdRate1\":1.085,\"dealFwdRate2\":3.73,\"dealSpotRate1\":7.1,\"dealSpotRate2\":0.732,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE3126902304\",\"lastTrans\":\"lastTrans-547\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-769\",\"period1\":\"period1-231\",\"period2\":\"period2-847\",\"sellBookText1\":\"sellBookText1-441\",\"sellBookText2\":\"sellBookText2-214\",\"sellQty1\":1748,\"sellQty2\":9057,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.175,\"trxDate\":\"2026-03-18\"}"

# [202] POST /doc-fxtrs — FXTR API
run_request "[202] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":8882,\"advText\":\"advText-493\",\"bdeRecVersion\":5986,\"buyQty\":5298,\"dealFwdRate\":6.432,\"dealSpotRate\":0.618,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-389\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-264\",\"fwdSpread\":5224,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-644\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-938\",\"limit\":9601,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8335,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":19,\"orderedBy\":\"orderedBy-841\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-124\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3499,\"settlePlanA\":true,\"spotSpread1\":7938,\"spotSpread2\":9727,\"trdrRate\":2.896,\"trigPrice\":5495,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49869197479\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [203] GET /doc-fxtrs/{id} — FXTR API
run_request "[203] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [204] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[204] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1523,\"advText\":\"advText-733\",\"bdeRecVersion\":5784,\"buyQty\":949,\"dealFwdRate\":1.93,\"dealSpotRate\":5.415,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-437\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-339\",\"fwdSpread\":3972,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-153\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-864\",\"limit\":4473,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1983,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":1856,\"orderedBy\":\"orderedBy-664\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-670\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8204,\"settlePlanA\":true,\"spotSpread1\":6360,\"spotSpread2\":710,\"trdrRate\":2.565,\"trigPrice\":1264,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33269077482\"}"

# [205] POST /doc-fxsws — FX Swap API
run_request "[205] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-841\",\"bdeRecVersion\":8738,\"buyBookText1\":\"buyBookText1-192\",\"buyBookText2\":\"buyBookText2-160\",\"buyQty1\":8950,\"buyQty2\":4117,\"cfi\":\"cfi-354\",\"dealFwdRate1\":4.997,\"dealFwdRate2\":3.529,\"dealSpotRate1\":5.144,\"dealSpotRate2\":5.28,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US7943384554\",\"lastTrans\":\"lastTrans-618\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-438\",\"period1\":\"period1-449\",\"period2\":\"period2-805\",\"sellBookText1\":\"sellBookText1-920\",\"sellBookText2\":\"sellBookText2-247\",\"sellQty1\":7260,\"sellQty2\":5526,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.985,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [206] GET /doc-fxsws/{id} — FX Swap API
run_request "[206] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [207] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[207] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-884\",\"bdeRecVersion\":4799,\"buyBookText1\":\"buyBookText1-532\",\"buyBookText2\":\"buyBookText2-219\",\"buyQty1\":3824,\"buyQty2\":5109,\"cfi\":\"cfi-914\",\"dealFwdRate1\":3.196,\"dealFwdRate2\":0.577,\"dealSpotRate1\":5.277,\"dealSpotRate2\":4.753,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR4285954574\",\"lastTrans\":\"lastTrans-465\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-550\",\"period1\":\"period1-562\",\"period2\":\"period2-918\",\"sellBookText1\":\"sellBookText1-817\",\"sellBookText2\":\"sellBookText2-503\",\"sellQty1\":3970,\"sellQty2\":3521,\"spotDate\":\"2026-03-18\",\"trdrRate1\":8.373,\"trxDate\":\"2026-03-18\"}"

# [208] POST /doc-fxtrs — FXTR API
run_request "[208] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":1059,\"advText\":\"advText-202\",\"bdeRecVersion\":362,\"buyQty\":1962,\"dealFwdRate\":3.987,\"dealSpotRate\":1.864,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-629\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-804\",\"fwdSpread\":1114,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-676\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-332\",\"limit\":512,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7129,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6165,\"orderedBy\":\"orderedBy-796\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-754\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7208,\"settlePlanA\":true,\"spotSpread1\":4972,\"spotSpread2\":5980,\"trdrRate\":4.432,\"trigPrice\":6743,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39397346659\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [209] GET /doc-fxtrs/{id} — FXTR API
run_request "[209] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [210] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[210] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1793,\"advText\":\"advText-222\",\"bdeRecVersion\":5641,\"buyQty\":4524,\"dealFwdRate\":8.249,\"dealSpotRate\":3.147,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-677\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-242\",\"fwdSpread\":7344,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-214\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-668\",\"limit\":8023,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7145,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":7698,\"orderedBy\":\"orderedBy-507\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-963\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4449,\"settlePlanA\":true,\"spotSpread1\":8815,\"spotSpread2\":6240,\"trdrRate\":8.283,\"trigPrice\":317,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44287648584\"}"

# [211] POST /doc-fxsws — FX Swap API
run_request "[211] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-871\",\"bdeRecVersion\":3149,\"buyBookText1\":\"buyBookText1-112\",\"buyBookText2\":\"buyBookText2-129\",\"buyQty1\":522,\"buyQty2\":4068,\"cfi\":\"cfi-430\",\"dealFwdRate1\":7.557,\"dealFwdRate2\":0.366,\"dealSpotRate1\":6.966,\"dealSpotRate2\":4.029,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE2953393044\",\"lastTrans\":\"lastTrans-154\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-772\",\"period1\":\"period1-969\",\"period2\":\"period2-304\",\"sellBookText1\":\"sellBookText1-992\",\"sellBookText2\":\"sellBookText2-395\",\"sellQty1\":3066,\"sellQty2\":4125,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.701,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [212] GET /doc-fxsws/{id} — FX Swap API
run_request "[212] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [213] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[213] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-865\",\"bdeRecVersion\":6403,\"buyBookText1\":\"buyBookText1-454\",\"buyBookText2\":\"buyBookText2-628\",\"buyQty1\":857,\"buyQty2\":2560,\"cfi\":\"cfi-924\",\"dealFwdRate1\":4.663,\"dealFwdRate2\":2.928,\"dealSpotRate1\":1.133,\"dealSpotRate2\":0.891,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB7048484613\",\"lastTrans\":\"lastTrans-270\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-527\",\"period1\":\"period1-128\",\"period2\":\"period2-815\",\"sellBookText1\":\"sellBookText1-613\",\"sellBookText2\":\"sellBookText2-713\",\"sellQty1\":1479,\"sellQty2\":2668,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.117,\"trxDate\":\"2026-03-18\"}"

# [214] POST /doc-fxtrs — FXTR API
run_request "[214] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":8154,\"advText\":\"advText-925\",\"bdeRecVersion\":4437,\"buyQty\":4061,\"dealFwdRate\":4.023,\"dealSpotRate\":7.073,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-959\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-240\",\"fwdSpread\":4802,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-946\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-973\",\"limit\":4309,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":5616,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":3033,\"orderedBy\":\"orderedBy-995\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-330\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7897,\"settlePlanA\":true,\"spotSpread1\":8936,\"spotSpread2\":8592,\"trdrRate\":0.481,\"trigPrice\":845,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33792882745\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [215] GET /doc-fxtrs/{id} — FXTR API
run_request "[215] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [216] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[216] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1797,\"advText\":\"advText-445\",\"bdeRecVersion\":7776,\"buyQty\":4347,\"dealFwdRate\":6.896,\"dealSpotRate\":3.229,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-327\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-781\",\"fwdSpread\":9674,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-777\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-222\",\"limit\":5189,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2677,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4462,\"orderedBy\":\"orderedBy-410\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-212\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":932,\"settlePlanA\":true,\"spotSpread1\":5150,\"spotSpread2\":6624,\"trdrRate\":3.785,\"trigPrice\":3694,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49629443340\"}"

# [217] POST /doc-fxsws — FX Swap API
run_request "[217] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-748\",\"bdeRecVersion\":9186,\"buyBookText1\":\"buyBookText1-789\",\"buyBookText2\":\"buyBookText2-333\",\"buyQty1\":7990,\"buyQty2\":1247,\"cfi\":\"cfi-135\",\"dealFwdRate1\":7.426,\"dealFwdRate2\":5.373,\"dealSpotRate1\":2.438,\"dealSpotRate2\":0.541,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US3194571953\",\"lastTrans\":\"lastTrans-899\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-630\",\"period1\":\"period1-614\",\"period2\":\"period2-943\",\"sellBookText1\":\"sellBookText1-411\",\"sellBookText2\":\"sellBookText2-518\",\"sellQty1\":3127,\"sellQty2\":6156,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.46,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [218] GET /doc-fxsws/{id} — FX Swap API
run_request "[218] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [219] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[219] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-755\",\"bdeRecVersion\":2645,\"buyBookText1\":\"buyBookText1-519\",\"buyBookText2\":\"buyBookText2-537\",\"buyQty1\":2313,\"buyQty2\":1082,\"cfi\":\"cfi-105\",\"dealFwdRate1\":5.062,\"dealFwdRate2\":8.123,\"dealSpotRate1\":4.232,\"dealSpotRate2\":6.956,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR2173637434\",\"lastTrans\":\"lastTrans-914\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-881\",\"period1\":\"period1-899\",\"period2\":\"period2-785\",\"sellBookText1\":\"sellBookText1-992\",\"sellBookText2\":\"sellBookText2-156\",\"sellQty1\":4230,\"sellQty2\":2497,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.34,\"trxDate\":\"2026-03-18\"}"

# [220] POST /doc-fxtrs — FXTR API
run_request "[220] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":2266,\"advText\":\"advText-799\",\"bdeRecVersion\":4835,\"buyQty\":2776,\"dealFwdRate\":7.199,\"dealSpotRate\":3.729,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-346\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-317\",\"fwdSpread\":2840,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-279\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-591\",\"limit\":2720,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8579,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":1117,\"orderedBy\":\"orderedBy-708\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-338\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3329,\"settlePlanA\":true,\"spotSpread1\":9416,\"spotSpread2\":6826,\"trdrRate\":5.162,\"trigPrice\":7208,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44689264738\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [221] GET /doc-fxtrs/{id} — FXTR API
run_request "[221] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [222] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[222] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":2341,\"advText\":\"advText-270\",\"bdeRecVersion\":1115,\"buyQty\":1638,\"dealFwdRate\":8.201,\"dealSpotRate\":3.329,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-153\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-774\",\"fwdSpread\":6463,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-793\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-538\",\"limit\":1492,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7250,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":5297,\"orderedBy\":\"orderedBy-916\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-813\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1139,\"settlePlanA\":true,\"spotSpread1\":8241,\"spotSpread2\":2088,\"trdrRate\":3.442,\"trigPrice\":7137,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49760277033\"}"

# [223] POST /doc-fxsws — FX Swap API
run_request "[223] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-894\",\"bdeRecVersion\":7843,\"buyBookText1\":\"buyBookText1-289\",\"buyBookText2\":\"buyBookText2-344\",\"buyQty1\":8333,\"buyQty2\":4838,\"cfi\":\"cfi-717\",\"dealFwdRate1\":5.98,\"dealFwdRate2\":8.491,\"dealSpotRate1\":6.333,\"dealSpotRate2\":2.165,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR9320019854\",\"lastTrans\":\"lastTrans-572\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-798\",\"period1\":\"period1-282\",\"period2\":\"period2-706\",\"sellBookText1\":\"sellBookText1-135\",\"sellBookText2\":\"sellBookText2-321\",\"sellQty1\":7949,\"sellQty2\":8506,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.054,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [224] GET /doc-fxsws/{id} — FX Swap API
run_request "[224] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [225] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[225] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-872\",\"bdeRecVersion\":1200,\"buyBookText1\":\"buyBookText1-938\",\"buyBookText2\":\"buyBookText2-187\",\"buyQty1\":2928,\"buyQty2\":3324,\"cfi\":\"cfi-906\",\"dealFwdRate1\":8.444,\"dealFwdRate2\":2.08,\"dealSpotRate1\":6.766,\"dealSpotRate2\":8.449,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR5726827681\",\"lastTrans\":\"lastTrans-391\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-730\",\"period1\":\"period1-989\",\"period2\":\"period2-851\",\"sellBookText1\":\"sellBookText1-608\",\"sellBookText2\":\"sellBookText2-969\",\"sellQty1\":8922,\"sellQty2\":9590,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.165,\"trxDate\":\"2026-03-18\"}"

# [226] POST /doc-fxtrs — FXTR API
run_request "[226] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":2064,\"advText\":\"advText-818\",\"bdeRecVersion\":2132,\"buyQty\":1220,\"dealFwdRate\":2.955,\"dealSpotRate\":8.472,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-851\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-394\",\"fwdSpread\":8296,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-585\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-505\",\"limit\":254,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2733,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6237,\"orderedBy\":\"orderedBy-390\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-432\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7708,\"settlePlanA\":true,\"spotSpread1\":4702,\"spotSpread2\":5860,\"trdrRate\":4.264,\"trigPrice\":8326,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39765652096\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [227] GET /doc-fxtrs/{id} — FXTR API
run_request "[227] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [228] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[228] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":2803,\"advText\":\"advText-666\",\"bdeRecVersion\":2105,\"buyQty\":8238,\"dealFwdRate\":8.399,\"dealSpotRate\":5.022,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-567\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-596\",\"fwdSpread\":4136,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-962\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-810\",\"limit\":8538,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4583,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":9829,\"orderedBy\":\"orderedBy-308\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-107\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1668,\"settlePlanA\":true,\"spotSpread1\":1031,\"spotSpread2\":7174,\"trdrRate\":4.631,\"trigPrice\":1977,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49948691872\"}"

# [229] POST /doc-fxsws — FX Swap API
run_request "[229] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-338\",\"bdeRecVersion\":2358,\"buyBookText1\":\"buyBookText1-535\",\"buyBookText2\":\"buyBookText2-850\",\"buyQty1\":9753,\"buyQty2\":1825,\"cfi\":\"cfi-218\",\"dealFwdRate1\":4.574,\"dealFwdRate2\":3.9,\"dealSpotRate1\":2.612,\"dealSpotRate2\":6.625,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US2109118546\",\"lastTrans\":\"lastTrans-830\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-258\",\"period1\":\"period1-268\",\"period2\":\"period2-180\",\"sellBookText1\":\"sellBookText1-813\",\"sellBookText2\":\"sellBookText2-729\",\"sellQty1\":4660,\"sellQty2\":5117,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.699,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [230] GET /doc-fxsws/{id} — FX Swap API
run_request "[230] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [231] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[231] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-375\",\"bdeRecVersion\":8119,\"buyBookText1\":\"buyBookText1-839\",\"buyBookText2\":\"buyBookText2-740\",\"buyQty1\":2828,\"buyQty2\":925,\"cfi\":\"cfi-406\",\"dealFwdRate1\":2.597,\"dealFwdRate2\":2.638,\"dealSpotRate1\":6.63,\"dealSpotRate2\":1.487,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR3769533468\",\"lastTrans\":\"lastTrans-535\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-423\",\"period1\":\"period1-818\",\"period2\":\"period2-750\",\"sellBookText1\":\"sellBookText1-265\",\"sellBookText2\":\"sellBookText2-929\",\"sellQty1\":6888,\"sellQty2\":9002,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.476,\"trxDate\":\"2026-03-18\"}"

# [232] POST /doc-fxtrs — FXTR API
run_request "[232] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4680,\"advText\":\"advText-600\",\"bdeRecVersion\":1873,\"buyQty\":1184,\"dealFwdRate\":5.479,\"dealSpotRate\":7.017,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-168\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-673\",\"fwdSpread\":6376,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-118\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-570\",\"limit\":8800,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":3102,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":5789,\"orderedBy\":\"orderedBy-397\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-491\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5784,\"settlePlanA\":true,\"spotSpread1\":676,\"spotSpread2\":1356,\"trdrRate\":2.256,\"trigPrice\":7565,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41811682468\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [233] GET /doc-fxtrs/{id} — FXTR API
run_request "[233] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [234] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[234] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":9017,\"advText\":\"advText-924\",\"bdeRecVersion\":9831,\"buyQty\":1667,\"dealFwdRate\":0.264,\"dealSpotRate\":3.745,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-682\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-764\",\"fwdSpread\":5752,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-887\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-795\",\"limit\":1592,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":9901,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6673,\"orderedBy\":\"orderedBy-750\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-232\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7445,\"settlePlanA\":true,\"spotSpread1\":9247,\"spotSpread2\":6729,\"trdrRate\":2.816,\"trigPrice\":5480,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39369964178\"}"

# [235] POST /doc-fxsws — FX Swap API
run_request "[235] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-253\",\"bdeRecVersion\":2587,\"buyBookText1\":\"buyBookText1-879\",\"buyBookText2\":\"buyBookText2-542\",\"buyQty1\":7722,\"buyQty2\":4400,\"cfi\":\"cfi-309\",\"dealFwdRate1\":7.645,\"dealFwdRate2\":5.849,\"dealSpotRate1\":7.633,\"dealSpotRate2\":4.049,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH1160710209\",\"lastTrans\":\"lastTrans-709\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-754\",\"period1\":\"period1-846\",\"period2\":\"period2-173\",\"sellBookText1\":\"sellBookText1-838\",\"sellBookText2\":\"sellBookText2-855\",\"sellQty1\":7288,\"sellQty2\":5542,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.985,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [236] GET /doc-fxsws/{id} — FX Swap API
run_request "[236] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [237] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[237] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-810\",\"bdeRecVersion\":3192,\"buyBookText1\":\"buyBookText1-918\",\"buyBookText2\":\"buyBookText2-113\",\"buyQty1\":6613,\"buyQty2\":5464,\"cfi\":\"cfi-127\",\"dealFwdRate1\":4.156,\"dealFwdRate2\":3.685,\"dealSpotRate1\":0.545,\"dealSpotRate2\":1.574,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE5627654921\",\"lastTrans\":\"lastTrans-418\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-778\",\"period1\":\"period1-118\",\"period2\":\"period2-683\",\"sellBookText1\":\"sellBookText1-240\",\"sellBookText2\":\"sellBookText2-329\",\"sellQty1\":3607,\"sellQty2\":5367,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.57,\"trxDate\":\"2026-03-18\"}"

# [238] POST /doc-fxtrs — FXTR API
run_request "[238] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4782,\"advText\":\"advText-283\",\"bdeRecVersion\":5268,\"buyQty\":3684,\"dealFwdRate\":3.188,\"dealSpotRate\":2.459,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-355\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-523\",\"fwdSpread\":5820,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-539\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-530\",\"limit\":4708,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":9609,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":7012,\"orderedBy\":\"orderedBy-371\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-939\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4687,\"settlePlanA\":true,\"spotSpread1\":3247,\"spotSpread2\":7437,\"trdrRate\":3.071,\"trigPrice\":8171,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41432833906\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [239] GET /doc-fxtrs/{id} — FXTR API
run_request "[239] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [240] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[240] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":5661,\"advText\":\"advText-214\",\"bdeRecVersion\":665,\"buyQty\":6137,\"dealFwdRate\":4.84,\"dealSpotRate\":1.801,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-815\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-544\",\"fwdSpread\":7831,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-126\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-637\",\"limit\":7179,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":5844,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6752,\"orderedBy\":\"orderedBy-630\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-170\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6723,\"settlePlanA\":true,\"spotSpread1\":5360,\"spotSpread2\":7261,\"trdrRate\":1.935,\"trigPrice\":6610,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41194884238\"}"

# [241] POST /doc-fxsws — FX Swap API
run_request "[241] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-778\",\"bdeRecVersion\":4666,\"buyBookText1\":\"buyBookText1-368\",\"buyBookText2\":\"buyBookText2-409\",\"buyQty1\":7108,\"buyQty2\":5343,\"cfi\":\"cfi-129\",\"dealFwdRate1\":5.732,\"dealFwdRate2\":5.276,\"dealSpotRate1\":1.864,\"dealSpotRate2\":6.481,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR5211400634\",\"lastTrans\":\"lastTrans-566\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-730\",\"period1\":\"period1-425\",\"period2\":\"period2-907\",\"sellBookText1\":\"sellBookText1-552\",\"sellBookText2\":\"sellBookText2-352\",\"sellQty1\":2569,\"sellQty2\":8348,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.173,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [242] GET /doc-fxsws/{id} — FX Swap API
run_request "[242] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [243] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[243] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-116\",\"bdeRecVersion\":5840,\"buyBookText1\":\"buyBookText1-714\",\"buyBookText2\":\"buyBookText2-786\",\"buyQty1\":6605,\"buyQty2\":6272,\"cfi\":\"cfi-989\",\"dealFwdRate1\":0.709,\"dealFwdRate2\":7.129,\"dealSpotRate1\":1.192,\"dealSpotRate2\":8.446,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE8389691787\",\"lastTrans\":\"lastTrans-819\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-589\",\"period1\":\"period1-704\",\"period2\":\"period2-272\",\"sellBookText1\":\"sellBookText1-326\",\"sellBookText2\":\"sellBookText2-739\",\"sellQty1\":5584,\"sellQty2\":2143,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.647,\"trxDate\":\"2026-03-18\"}"

# [244] POST /doc-fxtrs — FXTR API
run_request "[244] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":522,\"advText\":\"advText-794\",\"bdeRecVersion\":9956,\"buyQty\":2720,\"dealFwdRate\":3.343,\"dealSpotRate\":4.655,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-573\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-932\",\"fwdSpread\":8840,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-884\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-387\",\"limit\":1945,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2576,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6737,\"orderedBy\":\"orderedBy-359\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-740\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9759,\"settlePlanA\":true,\"spotSpread1\":3014,\"spotSpread2\":8816,\"trdrRate\":1.837,\"trigPrice\":4040,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44446863160\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [245] GET /doc-fxtrs/{id} — FXTR API
run_request "[245] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [246] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[246] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":6465,\"advText\":\"advText-942\",\"bdeRecVersion\":9215,\"buyQty\":9105,\"dealFwdRate\":5.572,\"dealSpotRate\":3.216,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-744\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-154\",\"fwdSpread\":802,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-876\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-678\",\"limit\":3868,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":3660,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6552,\"orderedBy\":\"orderedBy-412\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-828\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4415,\"settlePlanA\":true,\"spotSpread1\":2398,\"spotSpread2\":2144,\"trdrRate\":0.66,\"trigPrice\":2501,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44590703924\"}"

# [247] POST /doc-fxsws — FX Swap API
run_request "[247] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-356\",\"bdeRecVersion\":8429,\"buyBookText1\":\"buyBookText1-541\",\"buyBookText2\":\"buyBookText2-876\",\"buyQty1\":139,\"buyQty2\":1895,\"cfi\":\"cfi-422\",\"dealFwdRate1\":6.191,\"dealFwdRate2\":5.205,\"dealSpotRate1\":2.586,\"dealSpotRate2\":8.26,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH3554188433\",\"lastTrans\":\"lastTrans-990\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-568\",\"period1\":\"period1-117\",\"period2\":\"period2-925\",\"sellBookText1\":\"sellBookText1-340\",\"sellBookText2\":\"sellBookText2-452\",\"sellQty1\":8344,\"sellQty2\":4576,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.044,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [248] GET /doc-fxsws/{id} — FX Swap API
run_request "[248] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [249] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[249] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-884\",\"bdeRecVersion\":9411,\"buyBookText1\":\"buyBookText1-536\",\"buyBookText2\":\"buyBookText2-341\",\"buyQty1\":4227,\"buyQty2\":6498,\"cfi\":\"cfi-676\",\"dealFwdRate1\":0.417,\"dealFwdRate2\":1.182,\"dealSpotRate1\":3.163,\"dealSpotRate2\":5.054,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR1192805426\",\"lastTrans\":\"lastTrans-730\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-737\",\"period1\":\"period1-911\",\"period2\":\"period2-959\",\"sellBookText1\":\"sellBookText1-318\",\"sellBookText2\":\"sellBookText2-900\",\"sellQty1\":9165,\"sellQty2\":3991,\"spotDate\":\"2026-03-18\",\"trdrRate1\":2.534,\"trxDate\":\"2026-03-18\"}"

# [250] POST /doc-fxtrs — FXTR API
run_request "[250] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":2942,\"advText\":\"advText-440\",\"bdeRecVersion\":5362,\"buyQty\":1951,\"dealFwdRate\":5.924,\"dealSpotRate\":5.235,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-793\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-744\",\"fwdSpread\":2241,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-323\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-561\",\"limit\":9839,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":439,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":7318,\"orderedBy\":\"orderedBy-689\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-908\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3860,\"settlePlanA\":true,\"spotSpread1\":6303,\"spotSpread2\":3123,\"trdrRate\":5.554,\"trigPrice\":7063,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49938424832\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [251] GET /doc-fxtrs/{id} — FXTR API
run_request "[251] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [252] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[252] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1401,\"advText\":\"advText-725\",\"bdeRecVersion\":839,\"buyQty\":6628,\"dealFwdRate\":3.974,\"dealSpotRate\":6.064,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-293\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-636\",\"fwdSpread\":2665,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-131\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-551\",\"limit\":6848,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":5243,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":3517,\"orderedBy\":\"orderedBy-835\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-220\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5260,\"settlePlanA\":true,\"spotSpread1\":8230,\"spotSpread2\":1458,\"trdrRate\":0.249,\"trigPrice\":8085,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41406300318\"}"

# [253] POST /doc-fxsws — FX Swap API
run_request "[253] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-882\",\"bdeRecVersion\":6908,\"buyBookText1\":\"buyBookText1-856\",\"buyBookText2\":\"buyBookText2-417\",\"buyQty1\":8328,\"buyQty2\":7201,\"cfi\":\"cfi-887\",\"dealFwdRate1\":4.088,\"dealFwdRate2\":1.038,\"dealSpotRate1\":5.881,\"dealSpotRate2\":2.847,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB2924645210\",\"lastTrans\":\"lastTrans-817\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-188\",\"period1\":\"period1-986\",\"period2\":\"period2-915\",\"sellBookText1\":\"sellBookText1-926\",\"sellBookText2\":\"sellBookText2-387\",\"sellQty1\":3639,\"sellQty2\":5787,\"spotDate\":\"2026-03-18\",\"trdrRate1\":1.693,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [254] GET /doc-fxsws/{id} — FX Swap API
run_request "[254] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [255] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[255] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-374\",\"bdeRecVersion\":8251,\"buyBookText1\":\"buyBookText1-750\",\"buyBookText2\":\"buyBookText2-107\",\"buyQty1\":5087,\"buyQty2\":5707,\"cfi\":\"cfi-320\",\"dealFwdRate1\":7.797,\"dealFwdRate2\":7.624,\"dealSpotRate1\":8.378,\"dealSpotRate2\":5.209,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US7901416013\",\"lastTrans\":\"lastTrans-254\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-676\",\"period1\":\"period1-608\",\"period2\":\"period2-427\",\"sellBookText1\":\"sellBookText1-887\",\"sellBookText2\":\"sellBookText2-237\",\"sellQty1\":4503,\"sellQty2\":4337,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.631,\"trxDate\":\"2026-03-18\"}"

# [256] POST /doc-fxtrs — FXTR API
run_request "[256] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":414,\"advText\":\"advText-272\",\"bdeRecVersion\":2057,\"buyQty\":2238,\"dealFwdRate\":7.258,\"dealSpotRate\":7.46,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-708\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-658\",\"fwdSpread\":1812,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-862\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-198\",\"limit\":8277,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4871,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2212,\"orderedBy\":\"orderedBy-240\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-129\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4248,\"settlePlanA\":true,\"spotSpread1\":670,\"spotSpread2\":8314,\"trdrRate\":1.586,\"trigPrice\":8706,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41793581762\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [257] GET /doc-fxtrs/{id} — FXTR API
run_request "[257] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [258] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[258] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":4018,\"advText\":\"advText-927\",\"bdeRecVersion\":3314,\"buyQty\":3275,\"dealFwdRate\":2.491,\"dealSpotRate\":0.528,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-578\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-650\",\"fwdSpread\":1757,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-986\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-540\",\"limit\":2581,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":9692,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":5475,\"orderedBy\":\"orderedBy-741\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-723\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1198,\"settlePlanA\":true,\"spotSpread1\":8403,\"spotSpread2\":1901,\"trdrRate\":3.947,\"trigPrice\":5185,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39770355209\"}"

# [259] POST /doc-fxsws — FX Swap API
run_request "[259] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-317\",\"bdeRecVersion\":3484,\"buyBookText1\":\"buyBookText1-753\",\"buyBookText2\":\"buyBookText2-551\",\"buyQty1\":7489,\"buyQty2\":5531,\"cfi\":\"cfi-526\",\"dealFwdRate1\":3.287,\"dealFwdRate2\":2.261,\"dealSpotRate1\":7.287,\"dealSpotRate2\":2.903,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH6042166383\",\"lastTrans\":\"lastTrans-458\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-992\",\"period1\":\"period1-626\",\"period2\":\"period2-783\",\"sellBookText1\":\"sellBookText1-391\",\"sellBookText2\":\"sellBookText2-314\",\"sellQty1\":6584,\"sellQty2\":368,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.111,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [260] GET /doc-fxsws/{id} — FX Swap API
run_request "[260] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [261] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[261] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-100\",\"bdeRecVersion\":1747,\"buyBookText1\":\"buyBookText1-377\",\"buyBookText2\":\"buyBookText2-936\",\"buyQty1\":4795,\"buyQty2\":9123,\"cfi\":\"cfi-578\",\"dealFwdRate1\":1.34,\"dealFwdRate2\":8.325,\"dealSpotRate1\":4.183,\"dealSpotRate2\":7.557,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR5417777120\",\"lastTrans\":\"lastTrans-718\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-883\",\"period1\":\"period1-202\",\"period2\":\"period2-582\",\"sellBookText1\":\"sellBookText1-609\",\"sellBookText2\":\"sellBookText2-204\",\"sellQty1\":5989,\"sellQty2\":3445,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.26,\"trxDate\":\"2026-03-18\"}"

# [262] POST /doc-fxtrs — FXTR API
run_request "[262] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":9620,\"advText\":\"advText-379\",\"bdeRecVersion\":2904,\"buyQty\":871,\"dealFwdRate\":5.356,\"dealSpotRate\":2.058,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-230\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-279\",\"fwdSpread\":8322,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-328\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-829\",\"limit\":1848,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8257,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":1665,\"orderedBy\":\"orderedBy-606\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-235\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9977,\"settlePlanA\":true,\"spotSpread1\":157,\"spotSpread2\":5332,\"trdrRate\":2.133,\"trigPrice\":3519,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44488710185\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [263] GET /doc-fxtrs/{id} — FXTR API
run_request "[263] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [264] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[264] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":3575,\"advText\":\"advText-848\",\"bdeRecVersion\":6888,\"buyQty\":2351,\"dealFwdRate\":2.909,\"dealSpotRate\":4.562,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-427\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-419\",\"fwdSpread\":1140,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-305\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-201\",\"limit\":2804,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":1853,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":933,\"orderedBy\":\"orderedBy-715\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-240\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3145,\"settlePlanA\":true,\"spotSpread1\":5948,\"spotSpread2\":8476,\"trdrRate\":3.116,\"trigPrice\":3303,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41489955486\"}"

# [265] POST /doc-fxsws — FX Swap API
run_request "[265] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-887\",\"bdeRecVersion\":9977,\"buyBookText1\":\"buyBookText1-993\",\"buyBookText2\":\"buyBookText2-378\",\"buyQty1\":1957,\"buyQty2\":865,\"cfi\":\"cfi-273\",\"dealFwdRate1\":0.36,\"dealFwdRate2\":5.716,\"dealSpotRate1\":1.631,\"dealSpotRate2\":2.195,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH4155355756\",\"lastTrans\":\"lastTrans-651\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-689\",\"period1\":\"period1-438\",\"period2\":\"period2-394\",\"sellBookText1\":\"sellBookText1-963\",\"sellBookText2\":\"sellBookText2-612\",\"sellQty1\":1285,\"sellQty2\":6836,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.077,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [266] GET /doc-fxsws/{id} — FX Swap API
run_request "[266] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [267] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[267] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-509\",\"bdeRecVersion\":9404,\"buyBookText1\":\"buyBookText1-905\",\"buyBookText2\":\"buyBookText2-111\",\"buyQty1\":1673,\"buyQty2\":3089,\"cfi\":\"cfi-460\",\"dealFwdRate1\":5.82,\"dealFwdRate2\":3.217,\"dealSpotRate1\":7.907,\"dealSpotRate2\":1.008,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US2769690017\",\"lastTrans\":\"lastTrans-955\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-389\",\"period1\":\"period1-652\",\"period2\":\"period2-966\",\"sellBookText1\":\"sellBookText1-208\",\"sellBookText2\":\"sellBookText2-342\",\"sellQty1\":1790,\"sellQty2\":7051,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.756,\"trxDate\":\"2026-03-18\"}"

# [268] POST /doc-fxtrs — FXTR API
run_request "[268] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":9526,\"advText\":\"advText-174\",\"bdeRecVersion\":3181,\"buyQty\":1163,\"dealFwdRate\":5.486,\"dealSpotRate\":1.547,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-569\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-607\",\"fwdSpread\":9340,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-250\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-706\",\"limit\":223,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":9146,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":1937,\"orderedBy\":\"orderedBy-224\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-554\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6298,\"settlePlanA\":true,\"spotSpread1\":9879,\"spotSpread2\":6864,\"trdrRate\":6.925,\"trigPrice\":4923,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41509772952\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [269] GET /doc-fxtrs/{id} — FXTR API
run_request "[269] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [270] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[270] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":8207,\"advText\":\"advText-761\",\"bdeRecVersion\":3547,\"buyQty\":7788,\"dealFwdRate\":1.114,\"dealSpotRate\":8.294,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-260\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-273\",\"fwdSpread\":299,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-919\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-393\",\"limit\":8556,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":5251,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":8170,\"orderedBy\":\"orderedBy-216\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-347\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6088,\"settlePlanA\":true,\"spotSpread1\":2143,\"spotSpread2\":5183,\"trdrRate\":5.295,\"trigPrice\":3332,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39825777663\"}"

# [271] POST /doc-fxsws — FX Swap API
run_request "[271] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-284\",\"bdeRecVersion\":5238,\"buyBookText1\":\"buyBookText1-543\",\"buyBookText2\":\"buyBookText2-831\",\"buyQty1\":875,\"buyQty2\":2455,\"cfi\":\"cfi-604\",\"dealFwdRate1\":5.8,\"dealFwdRate2\":4.553,\"dealSpotRate1\":0.499,\"dealSpotRate2\":8.12,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH8033259879\",\"lastTrans\":\"lastTrans-850\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-141\",\"period1\":\"period1-361\",\"period2\":\"period2-975\",\"sellBookText1\":\"sellBookText1-855\",\"sellBookText2\":\"sellBookText2-889\",\"sellQty1\":6941,\"sellQty2\":4659,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.095,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [272] GET /doc-fxsws/{id} — FX Swap API
run_request "[272] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [273] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[273] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-767\",\"bdeRecVersion\":5698,\"buyBookText1\":\"buyBookText1-383\",\"buyBookText2\":\"buyBookText2-695\",\"buyQty1\":2276,\"buyQty2\":4334,\"cfi\":\"cfi-850\",\"dealFwdRate1\":8.245,\"dealFwdRate2\":7.31,\"dealSpotRate1\":2.561,\"dealSpotRate2\":7.184,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH3299858126\",\"lastTrans\":\"lastTrans-950\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-404\",\"period1\":\"period1-519\",\"period2\":\"period2-522\",\"sellBookText1\":\"sellBookText1-791\",\"sellBookText2\":\"sellBookText2-477\",\"sellQty1\":252,\"sellQty2\":6793,\"spotDate\":\"2026-03-18\",\"trdrRate1\":0.58,\"trxDate\":\"2026-03-18\"}"

# [274] POST /doc-fxtrs — FXTR API
run_request "[274] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":1134,\"advText\":\"advText-234\",\"bdeRecVersion\":3216,\"buyQty\":2403,\"dealFwdRate\":1.365,\"dealSpotRate\":6.08,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-801\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-724\",\"fwdSpread\":4407,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-882\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-175\",\"limit\":8890,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7329,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4195,\"orderedBy\":\"orderedBy-205\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-676\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3082,\"settlePlanA\":true,\"spotSpread1\":390,\"spotSpread2\":985,\"trdrRate\":3.881,\"trigPrice\":6227,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49283309069\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [275] GET /doc-fxtrs/{id} — FXTR API
run_request "[275] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [276] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[276] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":6644,\"advText\":\"advText-781\",\"bdeRecVersion\":8039,\"buyQty\":907,\"dealFwdRate\":3.421,\"dealSpotRate\":0.193,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-660\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-370\",\"fwdSpread\":7704,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-950\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-198\",\"limit\":6228,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":7725,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2358,\"orderedBy\":\"orderedBy-885\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-869\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4435,\"settlePlanA\":true,\"spotSpread1\":2521,\"spotSpread2\":3906,\"trdrRate\":0.527,\"trigPrice\":6987,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41963706762\"}"

# [277] POST /doc-fxsws — FX Swap API
run_request "[277] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-599\",\"bdeRecVersion\":6839,\"buyBookText1\":\"buyBookText1-348\",\"buyBookText2\":\"buyBookText2-702\",\"buyQty1\":7243,\"buyQty2\":7996,\"cfi\":\"cfi-827\",\"dealFwdRate1\":0.208,\"dealFwdRate2\":5.072,\"dealSpotRate1\":2.303,\"dealSpotRate2\":1.921,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US8009276423\",\"lastTrans\":\"lastTrans-153\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-938\",\"period1\":\"period1-501\",\"period2\":\"period2-256\",\"sellBookText1\":\"sellBookText1-511\",\"sellBookText2\":\"sellBookText2-467\",\"sellQty1\":4907,\"sellQty2\":4985,\"spotDate\":\"2026-03-18\",\"trdrRate1\":3.206,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [278] GET /doc-fxsws/{id} — FX Swap API
run_request "[278] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [279] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[279] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-675\",\"bdeRecVersion\":6928,\"buyBookText1\":\"buyBookText1-666\",\"buyBookText2\":\"buyBookText2-696\",\"buyQty1\":5835,\"buyQty2\":3571,\"cfi\":\"cfi-141\",\"dealFwdRate1\":1.156,\"dealFwdRate2\":5.548,\"dealSpotRate1\":3.34,\"dealSpotRate2\":0.372,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE7979140885\",\"lastTrans\":\"lastTrans-505\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-118\",\"period1\":\"period1-947\",\"period2\":\"period2-154\",\"sellBookText1\":\"sellBookText1-669\",\"sellBookText2\":\"sellBookText2-127\",\"sellQty1\":1121,\"sellQty2\":5263,\"spotDate\":\"2026-03-18\",\"trdrRate1\":7.494,\"trxDate\":\"2026-03-18\"}"

# [280] POST /doc-fxtrs — FXTR API
run_request "[280] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3834,\"advText\":\"advText-302\",\"bdeRecVersion\":9707,\"buyQty\":2798,\"dealFwdRate\":3.029,\"dealSpotRate\":5.342,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-722\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-422\",\"fwdSpread\":1945,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-990\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-929\",\"limit\":4715,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":3827,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":610,\"orderedBy\":\"orderedBy-771\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-710\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8788,\"settlePlanA\":true,\"spotSpread1\":661,\"spotSpread2\":2375,\"trdrRate\":6.472,\"trigPrice\":8481,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+39823974950\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [281] GET /doc-fxtrs/{id} — FXTR API
run_request "[281] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [282] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[282] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1865,\"advText\":\"advText-556\",\"bdeRecVersion\":685,\"buyQty\":4627,\"dealFwdRate\":4.426,\"dealSpotRate\":7.092,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-621\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-710\",\"fwdSpread\":8337,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-594\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-810\",\"limit\":4306,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":9156,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":53,\"orderedBy\":\"orderedBy-832\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-803\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3591,\"settlePlanA\":true,\"spotSpread1\":9995,\"spotSpread2\":6129,\"trdrRate\":6.086,\"trigPrice\":5016,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+33862951113\"}"

# [283] POST /doc-fxsws — FX Swap API
run_request "[283] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-650\",\"bdeRecVersion\":4911,\"buyBookText1\":\"buyBookText1-284\",\"buyBookText2\":\"buyBookText2-606\",\"buyQty1\":3817,\"buyQty2\":5125,\"cfi\":\"cfi-828\",\"dealFwdRate1\":0.221,\"dealFwdRate2\":2.149,\"dealSpotRate1\":8.477,\"dealSpotRate2\":0.78,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH4480540602\",\"lastTrans\":\"lastTrans-454\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-842\",\"period1\":\"period1-252\",\"period2\":\"period2-209\",\"sellBookText1\":\"sellBookText1-117\",\"sellBookText2\":\"sellBookText2-205\",\"sellQty1\":3208,\"sellQty2\":7936,\"spotDate\":\"2026-03-18\",\"trdrRate1\":2.521,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [284] GET /doc-fxsws/{id} — FX Swap API
run_request "[284] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [285] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[285] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-468\",\"bdeRecVersion\":1956,\"buyBookText1\":\"buyBookText1-221\",\"buyBookText2\":\"buyBookText2-960\",\"buyQty1\":6544,\"buyQty2\":2490,\"cfi\":\"cfi-297\",\"dealFwdRate1\":5.848,\"dealFwdRate2\":8.32,\"dealSpotRate1\":0.803,\"dealSpotRate2\":2.62,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH8378538511\",\"lastTrans\":\"lastTrans-859\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-589\",\"period1\":\"period1-711\",\"period2\":\"period2-914\",\"sellBookText1\":\"sellBookText1-884\",\"sellBookText2\":\"sellBookText2-108\",\"sellQty1\":247,\"sellQty2\":8762,\"spotDate\":\"2026-03-18\",\"trdrRate1\":4.477,\"trxDate\":\"2026-03-18\"}"

# [286] POST /doc-fxtrs — FXTR API
run_request "[286] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":2215,\"advText\":\"advText-171\",\"bdeRecVersion\":9388,\"buyQty\":2293,\"dealFwdRate\":6.853,\"dealSpotRate\":2.57,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-173\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-902\",\"fwdSpread\":5881,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-302\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-916\",\"limit\":8725,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8135,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":7580,\"orderedBy\":\"orderedBy-871\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-469\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":2219,\"settlePlanA\":true,\"spotSpread1\":35,\"spotSpread2\":1159,\"trdrRate\":7.653,\"trigPrice\":7751,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44960282175\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [287] GET /doc-fxtrs/{id} — FXTR API
run_request "[287] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [288] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[288] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":5423,\"advText\":\"advText-331\",\"bdeRecVersion\":138,\"buyQty\":7006,\"dealFwdRate\":7.666,\"dealSpotRate\":7.962,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-568\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-266\",\"fwdSpread\":4062,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-542\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-255\",\"limit\":5129,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":444,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":2094,\"orderedBy\":\"orderedBy-847\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-450\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7722,\"settlePlanA\":true,\"spotSpread1\":7711,\"spotSpread2\":2042,\"trdrRate\":5.148,\"trigPrice\":2460,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49575340407\"}"

# [289] POST /doc-fxsws — FX Swap API
run_request "[289] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-409\",\"bdeRecVersion\":993,\"buyBookText1\":\"buyBookText1-498\",\"buyBookText2\":\"buyBookText2-368\",\"buyQty1\":1082,\"buyQty2\":7110,\"cfi\":\"cfi-363\",\"dealFwdRate1\":1.072,\"dealFwdRate2\":1.842,\"dealSpotRate1\":1.537,\"dealSpotRate2\":7.736,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US4455474409\",\"lastTrans\":\"lastTrans-416\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-369\",\"period1\":\"period1-621\",\"period2\":\"period2-443\",\"sellBookText1\":\"sellBookText1-412\",\"sellBookText2\":\"sellBookText2-477\",\"sellQty1\":2874,\"sellQty2\":7399,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.32,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [290] GET /doc-fxsws/{id} — FX Swap API
run_request "[290] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [291] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[291] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-661\",\"bdeRecVersion\":3645,\"buyBookText1\":\"buyBookText1-184\",\"buyBookText2\":\"buyBookText2-287\",\"buyQty1\":7168,\"buyQty2\":8563,\"cfi\":\"cfi-587\",\"dealFwdRate1\":7.022,\"dealFwdRate2\":8.098,\"dealSpotRate1\":0.367,\"dealSpotRate2\":6.995,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US4681906872\",\"lastTrans\":\"lastTrans-531\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-565\",\"period1\":\"period1-609\",\"period2\":\"period2-754\",\"sellBookText1\":\"sellBookText1-654\",\"sellBookText2\":\"sellBookText2-710\",\"sellQty1\":4842,\"sellQty2\":4637,\"spotDate\":\"2026-03-18\",\"trdrRate1\":6.487,\"trxDate\":\"2026-03-18\"}"

# [292] POST /doc-fxtrs — FXTR API
run_request "[292] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":6371,\"advText\":\"advText-289\",\"bdeRecVersion\":776,\"buyQty\":9692,\"dealFwdRate\":1.168,\"dealSpotRate\":1.693,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-521\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-650\",\"fwdSpread\":2244,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-597\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-939\",\"limit\":6621,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2247,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":5963,\"orderedBy\":\"orderedBy-509\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-984\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":56,\"settlePlanA\":true,\"spotSpread1\":903,\"spotSpread2\":3527,\"trdrRate\":7.909,\"trigPrice\":915,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+41344268643\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [293] GET /doc-fxtrs/{id} — FXTR API
run_request "[293] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [294] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[294] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":6161,\"advText\":\"advText-246\",\"bdeRecVersion\":330,\"buyQty\":240,\"dealFwdRate\":6.411,\"dealSpotRate\":4.152,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-131\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-635\",\"fwdSpread\":6954,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-524\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-653\",\"limit\":3162,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":2775,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":5551,\"orderedBy\":\"orderedBy-870\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-107\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8463,\"settlePlanA\":true,\"spotSpread1\":765,\"spotSpread2\":117,\"trdrRate\":4.605,\"trigPrice\":1569,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+44631699794\"}"

# [295] POST /doc-fxsws — FX Swap API
run_request "[295] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-159\",\"bdeRecVersion\":8763,\"buyBookText1\":\"buyBookText1-127\",\"buyBookText2\":\"buyBookText2-864\",\"buyQty1\":9209,\"buyQty2\":8909,\"cfi\":\"cfi-232\",\"dealFwdRate1\":8.149,\"dealFwdRate2\":4.953,\"dealSpotRate1\":3.106,\"dealSpotRate2\":4.086,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE5376456156\",\"lastTrans\":\"lastTrans-224\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-653\",\"period1\":\"period1-176\",\"period2\":\"period2-197\",\"sellBookText1\":\"sellBookText1-376\",\"sellBookText2\":\"sellBookText2-233\",\"sellQty1\":4968,\"sellQty2\":6090,\"spotDate\":\"2026-03-18\",\"trdrRate1\":2.262,\"trxDate\":\"2026-03-18\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [296] GET /doc-fxsws/{id} — FX Swap API
run_request "[296] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [297] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[297] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-571\",\"bdeRecVersion\":7437,\"buyBookText1\":\"buyBookText1-840\",\"buyBookText2\":\"buyBookText2-688\",\"buyQty1\":6577,\"buyQty2\":7957,\"cfi\":\"cfi-494\",\"dealFwdRate1\":4.713,\"dealFwdRate2\":5.207,\"dealSpotRate1\":6.405,\"dealSpotRate2\":7.58,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB3337004344\",\"lastTrans\":\"lastTrans-829\",\"maturityDate1\":\"2026-03-18\",\"maturityDate2\":\"2026-03-18\",\"orderDate\":\"2026-03-18\",\"orderedBy\":\"orderedBy-743\",\"period1\":\"period1-522\",\"period2\":\"period2-157\",\"sellBookText1\":\"sellBookText1-175\",\"sellBookText2\":\"sellBookText2-924\",\"sellQty1\":4585,\"sellQty2\":115,\"spotDate\":\"2026-03-18\",\"trdrRate1\":5.379,\"trxDate\":\"2026-03-18\"}"

# [298] POST /doc-fxtrs — FXTR API
run_request "[298] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":441,\"advText\":\"advText-284\",\"bdeRecVersion\":5630,\"buyQty\":6003,\"dealFwdRate\":3.995,\"dealSpotRate\":0.158,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-813\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-110\",\"fwdSpread\":9051,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-995\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-975\",\"limit\":9933,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":4305,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":4923,\"orderedBy\":\"orderedBy-672\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-152\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3568,\"settlePlanA\":true,\"spotSpread1\":8954,\"spotSpread2\":9732,\"trdrRate\":7.173,\"trigPrice\":9793,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49678097878\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [299] GET /doc-fxtrs/{id} — FXTR API
run_request "[299] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [300] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[300] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1625,\"advText\":\"advText-702\",\"bdeRecVersion\":8025,\"buyQty\":2216,\"dealFwdRate\":2.132,\"dealSpotRate\":0.914,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-755\",\"dueDate\":\"2026-03-18\",\"enteredVmDate\":\"2026-03-18\",\"expirDate\":\"2026-03-18\",\"expirDateA\":\"2026-03-18\",\"extlRefNr\":\"extlRefNr-132\",\"fwdSpread\":9402,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-402\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-499\",\"limit\":9546,\"maturityDate\":\"2026-03-18\",\"mktFwdBps\":8661,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-18\",\"orderNr\":6655,\"orderedBy\":\"orderedBy-126\",\"perfDate\":\"2026-03-18\",\"perfDateA\":\"2026-03-18\",\"period\":\"period-389\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3624,\"settlePlanA\":true,\"spotSpread1\":8276,\"spotSpread2\":8206,\"trdrRate\":1.38,\"trigPrice\":3794,\"trxDate\":\"2026-03-18\",\"trxDateA\":\"2026-03-18\",\"valDate\":\"2026-03-18\",\"valDateA\":\"2026-03-18\",\"xrateList\":\"+49293023383\"}"

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>MultiTest Report · Part 2</title>
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
<h1>🧪 MultiTest Report <span style='color:#8b949e;font-size:14px'>Part 2 / 2</span></h1>
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