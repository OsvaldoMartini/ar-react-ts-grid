#!/usr/bin/env bash
# =============================================================
# Capi Test Runner — FLOW Execution (Part 1/8)
# Generated: 2026-03-17T10:50:15.139Z
# Cases:     1–1188 of 1596
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-17-10-50-12_part1_report.html"
DATA_FILE="capi_flow_execution_2026-03-17-10-50-12_data.csv"

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
ID_DOC_SECTRX2S=""
ID_DOC_CTACT2S=""
ID_DOC_CMGS=""
ID_DOC_COPS=""
ID_DOC_CLTS=""
ID_DOC_CLTAS=""
ID_DOC_CLTMS=""
ID_DOC_CORDS=""
ID_DOC_CDSS=""
ID_DOC_DCDS=""
ID_DOC_XIOMS=""
ID_DOC_XFERFEES=""
ID_DOC_FIDDS=""
ID_DOC_FRAS=""
ID_DOC_FXSWS=""
ID_DOC_FXTRS=""
ID_DOC_GUARCREDS=""
ID_DOC_INPAYS=""
ID_DOC_IRSS=""
ID_DOC_INTRS=""
ID_DOC_INVST_BDLS=""
ID_DOC_CRM_ISSUES=""
ID_DOC_LEDGERS=""
ID_DOC_LETTERS=""
ID_DOC_LIMITS=""
ID_DOC_LOANS=""
ID_DOC_MASS_SETTLES=""
ID_DOC_MMKTS=""
ID_DOC_XFERMONS=""
ID_DOC_OOFXS=""
ID_DOC_OOOTS=""
ID_DOC_OTCOPTS=""
ID_DOC_OTHSECS=""
ID_DOC_PAYS=""
ID_DOC_REALSECS=""
ID_DOC_REALTYS=""
ID_DOC_REBALPS=""
ID_DOC_REBALMS=""
ID_DOC_REBALSS=""
ID_DOC_REPOCS=""

# ── INIT HTML REPORT ─────────────────────────────────────────
echo "Starting 200 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [1] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[1] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [2] POST /doc-ctact2s — Contact Management (V2) API
run_request "[2] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":8702,\"attch\":\"attch-695\",\"attchA\":true,\"bdeRecVersion\":842,\"campgnCltReaction\":\"campgnCltReaction-951\",\"campgnRespKey\":\"campgnRespKey-646\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-696\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-156\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-737\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-795\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-720\",\"linkDocListA\":true,\"loc\":\"loc-645\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9029,\"orderedBy\":\"orderedBy-942\",\"particListA\":true,\"questrSeqNr\":2758,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":756,\"reactComment\":\"reactComment-504\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-371\",\"reactNrPartic\":862,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-998\",\"subjA\":true,\"syncSeqNr\":7504,\"totExpndTimeM\":6770,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [3] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[3] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [4] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[4] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":5878,\"attch\":\"attch-989\",\"attchA\":true,\"bdeRecVersion\":7005,\"campgnCltReaction\":\"campgnCltReaction-131\",\"campgnRespKey\":\"campgnRespKey-600\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-794\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-544\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-583\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-319\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-332\",\"linkDocListA\":true,\"loc\":\"loc-400\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1485,\"orderedBy\":\"orderedBy-275\",\"particListA\":true,\"questrSeqNr\":226,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":1559,\"reactComment\":\"reactComment-209\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-577\",\"reactNrPartic\":7106,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-705\",\"subjA\":true,\"syncSeqNr\":2225,\"totExpndTimeM\":8785,\"trxDate\":\"2026-03-17\"}"

# [5] GET /doc-cmgs/{id} — Cashier Management API
run_request "[5] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [6] GET /doc-cops/{id} — Cashier Operations API
run_request "[6] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [7] POST /doc-clts — Client Opening API
run_request "[7] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [8] GET /doc-clts/{id} — Client Opening API
run_request "[8] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [9] PATCH /doc-clts/{id} — Client Opening API
run_request "[9] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [10] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[10] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [11] GET /doc-cltms/{id} — Collateral Movement API
run_request "[11] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [12] GET /doc-cords/{id} — Collective Order API
run_request "[12] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [13] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[13] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [14] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[14] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [15] POST /doc-xioms — External Investment Order Manager API
run_request "[15] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":4787,\"bdeRecVersion\":9017,\"bpLevelRep\":true,\"descn\":\"descn-939\",\"extlRefNr\":\"extlRefNr-824\",\"extlRepLang\":\"extlRepLang-603\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-674\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-327\",\"linkGrp\":44,\"orderDate\":\"2026-03-17\",\"orderNr\":6947,\"orderedBy\":\"orderedBy-201\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [16] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[16] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [17] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[17] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":2080,\"bdeRecVersion\":8903,\"bpLevelRep\":true,\"descn\":\"descn-436\",\"extlRefNr\":\"extlRefNr-928\",\"extlRepLang\":\"extlRepLang-482\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-546\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-894\",\"linkGrp\":5162,\"orderDate\":\"2026-03-17\",\"orderNr\":3663,\"orderedBy\":\"orderedBy-689\",\"sendRepToEbank\":true}"

# [18] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[18] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [19] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[19] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [20] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[20] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [21] POST /doc-fxsws — FX Swap API
run_request "[21] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-399\",\"bdeRecVersion\":2299,\"buyBookText1\":\"buyBookText1-798\",\"buyBookText2\":\"buyBookText2-448\",\"buyQty1\":210,\"buyQty2\":3050,\"cfi\":\"cfi-588\",\"dealFwdRate1\":2.226,\"dealFwdRate2\":3.652,\"dealSpotRate1\":4.708,\"dealSpotRate2\":0.433,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH4800078709\",\"lastTrans\":\"lastTrans-649\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-530\",\"period1\":\"period1-590\",\"period2\":\"period2-820\",\"sellBookText1\":\"sellBookText1-161\",\"sellBookText2\":\"sellBookText2-618\",\"sellQty1\":9208,\"sellQty2\":2032,\"spotDate\":\"2026-03-17\",\"trdrRate1\":4.2,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [22] GET /doc-fxsws/{id} — FX Swap API
run_request "[22] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [23] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[23] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-188\",\"bdeRecVersion\":1087,\"buyBookText1\":\"buyBookText1-866\",\"buyBookText2\":\"buyBookText2-500\",\"buyQty1\":4854,\"buyQty2\":9031,\"cfi\":\"cfi-193\",\"dealFwdRate1\":4.933,\"dealFwdRate2\":1.763,\"dealSpotRate1\":8.438,\"dealSpotRate2\":4.257,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB6310584570\",\"lastTrans\":\"lastTrans-725\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-244\",\"period1\":\"period1-670\",\"period2\":\"period2-431\",\"sellBookText1\":\"sellBookText1-755\",\"sellBookText2\":\"sellBookText2-156\",\"sellQty1\":4040,\"sellQty2\":2166,\"spotDate\":\"2026-03-17\",\"trdrRate1\":3.048,\"trxDate\":\"2026-03-17\"}"

# [24] POST /doc-fxtrs — FXTR API
run_request "[24] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5482,\"advText\":\"advText-137\",\"bdeRecVersion\":3095,\"buyQty\":4039,\"dealFwdRate\":2.107,\"dealSpotRate\":6.631,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-173\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-344\",\"fwdSpread\":6822,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-869\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-117\",\"limit\":498,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":9390,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8744,\"orderedBy\":\"orderedBy-412\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-692\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":563,\"settlePlanA\":true,\"spotSpread1\":6973,\"spotSpread2\":301,\"trdrRate\":7.312,\"trigPrice\":990,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44329431300\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [25] GET /doc-fxtrs/{id} — FXTR API
run_request "[25] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [26] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[26] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":6721,\"advText\":\"advText-879\",\"bdeRecVersion\":9471,\"buyQty\":8127,\"dealFwdRate\":0.158,\"dealSpotRate\":1.548,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-871\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-374\",\"fwdSpread\":1261,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-784\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-991\",\"limit\":5371,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":8571,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":34,\"orderedBy\":\"orderedBy-684\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-257\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":2022,\"settlePlanA\":true,\"spotSpread1\":9354,\"spotSpread2\":8512,\"trdrRate\":4.264,\"trigPrice\":7211,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39237806499\"}"

# [27] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[27] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [28] POST /doc-inpays — Incoming Payment API
run_request "[28] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":2206,\"amount\":878479.63,\"bankClearNr\":\"bankClearNr-582\",\"bankInfo\":\"bankInfo-625\",\"bdeRecVersion\":738,\"benefAcc\":\"benefAcc-379\",\"benefRefNr\":\"benefRefNr-920\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-633\",\"contrPeriodStart\":\"contrPeriodStart-698\",\"credAddr\":\"credAddr-151\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-837\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-608\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-557\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-562\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-913\",\"orderDate\":\"2026-03-17\",\"orderNr\":7237,\"orderedBy\":\"orderedBy-686\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-273\",\"payerAddrTxt\":\"payerAddrTxt-772\",\"payerIban\":\"CH15941265306672263\",\"payerInfo\":\"payerInfo-423\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-816\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [29] GET /doc-inpays/{id} — Incoming Payment API
run_request "[29] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [30] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[30] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":2720,\"amount\":913449,\"bankClearNr\":\"bankClearNr-550\",\"bankInfo\":\"bankInfo-766\",\"bdeRecVersion\":2001,\"benefAcc\":\"benefAcc-694\",\"benefRefNr\":\"benefRefNr-102\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-113\",\"contrPeriodStart\":\"contrPeriodStart-605\",\"credAddr\":\"credAddr-160\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-545\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-438\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-145\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-395\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-671\",\"orderDate\":\"2026-03-17\",\"orderNr\":6474,\"orderedBy\":\"orderedBy-896\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payerAcc\":\"payerAcc-196\",\"payerAddrTxt\":\"payerAddrTxt-950\",\"payerIban\":\"DE16217956741922252\",\"payerInfo\":\"payerInfo-970\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-396\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [31] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[31] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [32] GET /doc-intrs/{id} — Interest API
run_request "[32] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [33] POST /doc-invst-bdls — Investment Bundler API
run_request "[33] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":6450,\"bdeRecVersion\":6411,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-674\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-366\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-469\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-791\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8087,\"orderedBy\":\"orderedBy-133\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":3258,\"remnBaccBalMin\":7874,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [34] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[34] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [35] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[35] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":3998,\"bdeRecVersion\":9467,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-246\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-472\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-717\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-771\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2447,\"orderedBy\":\"orderedBy-945\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":492,\"remnBaccBalMin\":8738,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [36] POST /doc-crm-issues — Issue Management API
run_request "[36] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-325\",\"advNr\":4105,\"allDayEvt\":true,\"attch\":\"attch-785\",\"bdeRecVersion\":5278,\"campgnTaskSeqNr\":8960,\"descn\":\"descn-104\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-867\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-798\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-126\",\"findingKey\":\"findingKey-777\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-845\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-151\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-354\",\"location\":\"location-916\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9772,\"orderedBy\":\"orderedBy-411\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6102,\"qtyLinked\":8922,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-198\",\"subject\":\"subject-301\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-992\",\"undefBp\":\"undefBp-505\",\"val\":6594,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [37] GET /doc-crm-issues/{id} — Issue Management API
run_request "[37] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [38] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[38] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-518\",\"advNr\":1249,\"allDayEvt\":true,\"attch\":\"attch-898\",\"bdeRecVersion\":9670,\"campgnTaskSeqNr\":5984,\"descn\":\"descn-990\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-786\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-483\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-281\",\"findingKey\":\"findingKey-160\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-418\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-904\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-588\",\"location\":\"location-910\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6643,\"orderedBy\":\"orderedBy-939\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8064,\"qtyLinked\":4000,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-586\",\"subject\":\"subject-206\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-989\",\"undefBp\":\"undefBp-104\",\"val\":6402,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [39] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[39] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [40] GET /doc-letters/{id} — Letter API
run_request "[40] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [41] POST /doc-limits — Limit API
run_request "[41] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":4710,\"advTextCred\":\"advTextCred-129\",\"advTextDeb\":\"advTextDeb-638\",\"amount\":129460.26,\"bdeRecVersion\":4145,\"bookTextCred\":\"bookTextCred-266\",\"bookTextDeb\":\"bookTextDeb-940\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-388\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-129\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-189\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-830\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-404\",\"nextReview\":\"nextReview-616\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8509,\"orderedBy\":\"orderedBy-311\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [42] GET /doc-limits/{id} — Limit API
run_request "[42] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [43] PATCH /doc-limits/{id} — Limit API
run_request "[43] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":8412,\"advTextCred\":\"advTextCred-494\",\"advTextDeb\":\"advTextDeb-179\",\"amount\":175290.06,\"bdeRecVersion\":2901,\"bookTextCred\":\"bookTextCred-491\",\"bookTextDeb\":\"bookTextDeb-226\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-102\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-925\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-747\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-550\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-404\",\"nextReview\":\"nextReview-627\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6326,\"orderedBy\":\"orderedBy-595\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [44] POST /doc-loans — Loan API
run_request "[44] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":1900,\"advTextCred\":\"advTextCred-820\",\"advTextDeb\":\"advTextDeb-744\",\"bdeRecVersion\":5534,\"bookTextCred\":\"bookTextCred-701\",\"bookTextDeb\":\"bookTextDeb-294\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-404\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-633\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-672\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-324\",\"intrGradManMarkup\":2389,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-540\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5418,\"orderedBy\":\"orderedBy-302\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5505,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [45] GET /doc-loans/{id} — Loan API
run_request "[45] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [46] PATCH /doc-loans/{id} — Loan API
run_request "[46] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":3614,\"advTextCred\":\"advTextCred-427\",\"advTextDeb\":\"advTextDeb-927\",\"bdeRecVersion\":9266,\"bookTextCred\":\"bookTextCred-718\",\"bookTextDeb\":\"bookTextDeb-551\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-321\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-136\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-640\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-438\",\"intrGradManMarkup\":2462,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-330\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6326,\"orderedBy\":\"orderedBy-250\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1952,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [47] POST /doc-mass-settles — Mass Settlement API
run_request "[47] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":2099,\"autoFillList\":true,\"bdeRecVersion\":7343,\"benefBpText\":\"benefBpText-953\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-230\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-373\",\"destBankClr\":\"destBankClr-537\",\"destBankText\":\"destBankText-952\",\"destBenefText\":\"destBenefText-525\",\"destInfo\":\"destInfo-511\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-966\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-469\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-546\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-453\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2109,\"orderedBy\":\"orderedBy-320\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [48] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[48] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [49] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[49] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":2003,\"autoFillList\":true,\"bdeRecVersion\":2742,\"benefBpText\":\"benefBpText-763\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-680\",\"destBankBic\":\"UBSWCHZH80A\",\"destBankBpText\":\"destBankBpText-908\",\"destBankClr\":\"destBankClr-940\",\"destBankText\":\"destBankText-199\",\"destBenefText\":\"destBenefText-709\",\"destInfo\":\"destInfo-132\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-622\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-750\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-351\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-869\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5379,\"orderedBy\":\"orderedBy-298\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [50] POST /doc-mmkts — Money Market API
run_request "[50] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":3299,\"bdeRecVersion\":3137,\"capt\":8362,\"dcdStrike\":658,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-358\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-175\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-948\",\"intrRate\":7.162,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-701\",\"maturityDate\":\"2026-03-17\",\"mktRate\":5.818,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9540,\"orderedBy\":\"orderedBy-105\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":7928,\"respBpA\":true,\"respObjA\":true,\"rmRate\":7.216,\"settlePlanA\":true,\"trdrRate\":5.72,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [51] GET /doc-mmkts/{id} — Money Market API
run_request "[51] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [52] PATCH /doc-mmkts/{id} — Money Market API
run_request "[52] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":7386,\"bdeRecVersion\":6262,\"capt\":7314,\"dcdStrike\":9237,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-277\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-266\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-764\",\"intrRate\":4.274,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-344\",\"maturityDate\":\"2026-03-17\",\"mktRate\":4.241,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6392,\"orderedBy\":\"orderedBy-960\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4026,\"respBpA\":true,\"respObjA\":true,\"rmRate\":0.254,\"settlePlanA\":true,\"trdrRate\":2.804,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [53] POST /doc-xfermons — Money Transfer API
run_request "[53] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":4640,\"amount\":329182.57,\"bdeRecVersion\":4787,\"bulkItemIdent\":\"bulkItemIdent-386\",\"credAdvText\":\"credAdvText-897\",\"credBookText\":\"credBookText-123\",\"debAdvText\":\"debAdvText-167\",\"debBookText\":\"debBookText-558\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-132\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-141\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-301\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-896\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6130,\"orderedBy\":\"orderedBy-909\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [54] GET /doc-xfermons/{id} — Money Transfer API
run_request "[54] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [55] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[55] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":8212,\"amount\":884258.72,\"bdeRecVersion\":6292,\"bulkItemIdent\":\"bulkItemIdent-768\",\"credAdvText\":\"credAdvText-402\",\"credBookText\":\"credBookText-835\",\"debAdvText\":\"debAdvText-821\",\"debBookText\":\"debBookText-269\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-509\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-902\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-873\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-615\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5255,\"orderedBy\":\"orderedBy-350\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [56] POST /doc-oofxs — OTC FX Option API
run_request "[56] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":1778,\"advTextCred\":\"advTextCred-630\",\"advTextDeb\":\"advTextDeb-201\",\"bdeRecVersion\":2979,\"bookTextCred\":\"bookTextCred-115\",\"bookTextDeb\":\"bookTextDeb-953\",\"callQty\":1357,\"cutOffTime\":\"cutOffTime-957\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-968\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-116\",\"gross\":\"gross-559\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-716\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-863\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1580,\"orderedBy\":\"orderedBy-182\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-169\",\"putQty\":7951,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-796\",\"spread2\":\"spread2-109\",\"strike\":948,\"strikePict\":3458,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [57] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[57] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [58] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[58] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":7774,\"advTextCred\":\"advTextCred-979\",\"advTextDeb\":\"advTextDeb-553\",\"bdeRecVersion\":429,\"bookTextCred\":\"bookTextCred-942\",\"bookTextDeb\":\"bookTextDeb-744\",\"callQty\":8167,\"cutOffTime\":\"cutOffTime-921\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-874\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-437\",\"gross\":\"gross-176\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-440\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-198\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2061,\"orderedBy\":\"orderedBy-234\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-848\",\"putQty\":8161,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-338\",\"spread2\":\"spread2-552\",\"strike\":3879,\"strikePict\":4930,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [59] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[59] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [60] GET /doc-otcopts/{id} — OTC Option API
run_request "[60] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [61] GET /doc-othsecs/{id} — Other Security API
run_request "[61] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [62] POST /doc-pays — Payment API
run_request "[62] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":4685,\"amount\":998349.3,\"bank\":\"bank-691\",\"bankAcc\":\"bankAcc-762\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-296\",\"bankCorr1\":\"bankCorr1-365\",\"bankCorr1Acc\":\"bankCorr1Acc-395\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-564\",\"bankCorr3\":\"bankCorr3-200\",\"bankCorr3Acc\":\"bankCorr3Acc-678\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-835\",\"bankCorr4\":\"bankCorr4-734\",\"bankCorr4Acc\":\"bankCorr4Acc-286\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-440\",\"bankInfo\":\"bankInfo-414\",\"bdeRecVersion\":4456,\"benef\":\"benef-571\",\"benefAcc\":\"benefAcc-127\",\"benefIban\":\"IT62877237966470413\",\"benefInfo\":\"benefInfo-956\",\"benefRefNr\":\"benefRefNr-342\",\"bookTextCred\":\"bookTextCred-592\",\"bookTextDeb\":\"bookTextDeb-758\",\"bulkItemIdent\":\"bulkItemIdent-197\",\"destCountry\":{\"id\":5,\"ident\":\"AT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-109\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-769\",\"hasPostit\":true,\"instrAmount\":326956.74,\"intlRefNr\":\"intlRefNr-356\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"US2785387788\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-724\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-775\",\"ordBankAcc\":\"ordBankAcc-145\",\"ordBankClearNr\":\"ordBankClearNr-332\",\"ordRef\":\"ordRef-259\",\"orderDate\":\"2026-03-17\",\"orderNr\":8295,\"orderedBy\":\"orderedBy-350\",\"orderedByAcc\":\"orderedByAcc-100\",\"origGrpRef\":\"origGrpRef-253\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-156\",\"stordPeriodEnd\":\"stordPeriodEnd-519\",\"stordPeriodStart\":\"stordPeriodStart-618\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39834659398\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [63] GET /doc-pays/{id} — Payment API
run_request "[63] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [64] PATCH /doc-pays/{id} — Payment API
run_request "[64] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":674,\"amount\":892788.04,\"bank\":\"bank-796\",\"bankAcc\":\"bankAcc-347\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-776\",\"bankCorr1\":\"bankCorr1-180\",\"bankCorr1Acc\":\"bankCorr1Acc-593\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-880\",\"bankCorr3\":\"bankCorr3-103\",\"bankCorr3Acc\":\"bankCorr3Acc-857\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-413\",\"bankCorr4\":\"bankCorr4-767\",\"bankCorr4Acc\":\"bankCorr4Acc-629\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-281\",\"bankInfo\":\"bankInfo-427\",\"bdeRecVersion\":1842,\"benef\":\"benef-786\",\"benefAcc\":\"benefAcc-328\",\"benefIban\":\"AT98973192531371650\",\"benefInfo\":\"benefInfo-424\",\"benefRefNr\":\"benefRefNr-129\",\"bookTextCred\":\"bookTextCred-784\",\"bookTextDeb\":\"bookTextDeb-656\",\"bulkItemIdent\":\"bulkItemIdent-130\",\"destCountry\":{\"id\":7,\"ident\":\"US\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-581\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-250\",\"hasPostit\":true,\"instrAmount\":159406.3,\"intlRefNr\":\"intlRefNr-862\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH8027236963\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-116\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-808\",\"ordBankAcc\":\"ordBankAcc-120\",\"ordBankClearNr\":\"ordBankClearNr-381\",\"ordRef\":\"ordRef-130\",\"orderDate\":\"2026-03-17\",\"orderNr\":2246,\"orderedBy\":\"orderedBy-665\",\"orderedByAcc\":\"orderedByAcc-123\",\"origGrpRef\":\"origGrpRef-283\",\"originCountry\":{\"id\":2,\"ident\":\"DE\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-576\",\"stordPeriodEnd\":\"stordPeriodEnd-441\",\"stordPeriodStart\":\"stordPeriodStart-585\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49779196647\"}"

# [65] GET /doc-realsecs/{id} — Real Security API
run_request "[65] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [66] POST /doc-realtys — Realty API
run_request "[66] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":5454,\"bdeRecVersion\":133,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-543\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-964\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-259\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-136\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3227,\"orderedBy\":\"orderedBy-835\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [67] GET /doc-realtys/{id} — Realty API
run_request "[67] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [68] PATCH /doc-realtys/{id} — Realty API
run_request "[68] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":5805,\"bdeRecVersion\":5633,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-849\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-923\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-741\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-163\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9734,\"orderedBy\":\"orderedBy-548\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [69] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[69] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":8069,\"bdeRecVersion\":2414,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-487\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-416\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-663\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-101\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":448,\"orderedBy\":\"orderedBy-728\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [70] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[70] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [71] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[71] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":7174,\"bdeRecVersion\":6557,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-378\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-822\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-222\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-794\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4569,\"orderedBy\":\"orderedBy-611\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [72] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[72] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [73] POST /doc-rebalss — Rebalancer Order API
run_request "[73] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":5796,\"bdeRecVersion\":4892,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-685\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-105\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-261\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-935\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6783,\"orderedBy\":\"orderedBy-152\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [74] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[74] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [75] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[75] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":1484,\"bdeRecVersion\":6814,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-859\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-167\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-256\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-708\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2394,\"orderedBy\":\"orderedBy-721\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [76] GET /doc-repocs/{id} — Repo Contract API
run_request "[76] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [761] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[761] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [762] POST /doc-ctact2s — Contact Management (V2) API
run_request "[762] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":9571,\"attch\":\"attch-375\",\"attchA\":true,\"bdeRecVersion\":2730,\"campgnCltReaction\":\"campgnCltReaction-332\",\"campgnRespKey\":\"campgnRespKey-840\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-358\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-849\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-915\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-390\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-426\",\"linkDocListA\":true,\"loc\":\"loc-829\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9904,\"orderedBy\":\"orderedBy-666\",\"particListA\":true,\"questrSeqNr\":7769,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":2796,\"reactComment\":\"reactComment-117\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-566\",\"reactNrPartic\":5757,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-526\",\"subjA\":true,\"syncSeqNr\":8523,\"totExpndTimeM\":8656,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [763] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[763] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [764] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[764] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":2905,\"attch\":\"attch-342\",\"attchA\":true,\"bdeRecVersion\":4143,\"campgnCltReaction\":\"campgnCltReaction-822\",\"campgnRespKey\":\"campgnRespKey-600\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-631\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-174\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-455\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-662\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-645\",\"linkDocListA\":true,\"loc\":\"loc-202\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9468,\"orderedBy\":\"orderedBy-657\",\"particListA\":true,\"questrSeqNr\":7315,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":3256,\"reactComment\":\"reactComment-900\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-204\",\"reactNrPartic\":3814,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-379\",\"subjA\":true,\"syncSeqNr\":1343,\"totExpndTimeM\":2726,\"trxDate\":\"2026-03-17\"}"

# [765] GET /doc-cmgs/{id} — Cashier Management API
run_request "[765] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [766] GET /doc-cops/{id} — Cashier Operations API
run_request "[766] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [767] POST /doc-clts — Client Opening API
run_request "[767] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [768] GET /doc-clts/{id} — Client Opening API
run_request "[768] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [769] PATCH /doc-clts/{id} — Client Opening API
run_request "[769] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [770] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[770] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [771] GET /doc-cltms/{id} — Collateral Movement API
run_request "[771] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [772] GET /doc-cords/{id} — Collective Order API
run_request "[772] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [773] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[773] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [774] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[774] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [775] POST /doc-xioms — External Investment Order Manager API
run_request "[775] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":2706,\"bdeRecVersion\":7073,\"bpLevelRep\":true,\"descn\":\"descn-854\",\"extlRefNr\":\"extlRefNr-278\",\"extlRepLang\":\"extlRepLang-327\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-288\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-905\",\"linkGrp\":5989,\"orderDate\":\"2026-03-17\",\"orderNr\":9080,\"orderedBy\":\"orderedBy-586\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [776] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[776] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [777] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[777] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":2002,\"bdeRecVersion\":9482,\"bpLevelRep\":true,\"descn\":\"descn-251\",\"extlRefNr\":\"extlRefNr-462\",\"extlRepLang\":\"extlRepLang-323\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-416\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-571\",\"linkGrp\":8038,\"orderDate\":\"2026-03-17\",\"orderNr\":7119,\"orderedBy\":\"orderedBy-262\",\"sendRepToEbank\":true}"

# [778] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[778] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [779] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[779] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [780] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[780] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [781] POST /doc-fxsws — FX Swap API
run_request "[781] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-155\",\"bdeRecVersion\":931,\"buyBookText1\":\"buyBookText1-218\",\"buyBookText2\":\"buyBookText2-930\",\"buyQty1\":3621,\"buyQty2\":9848,\"cfi\":\"cfi-473\",\"dealFwdRate1\":8.258,\"dealFwdRate2\":0.892,\"dealSpotRate1\":2.129,\"dealSpotRate2\":5.06,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB6315026744\",\"lastTrans\":\"lastTrans-445\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-115\",\"period1\":\"period1-607\",\"period2\":\"period2-623\",\"sellBookText1\":\"sellBookText1-195\",\"sellBookText2\":\"sellBookText2-830\",\"sellQty1\":6152,\"sellQty2\":3573,\"spotDate\":\"2026-03-17\",\"trdrRate1\":1.975,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [782] GET /doc-fxsws/{id} — FX Swap API
run_request "[782] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [783] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[783] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-455\",\"bdeRecVersion\":9273,\"buyBookText1\":\"buyBookText1-890\",\"buyBookText2\":\"buyBookText2-337\",\"buyQty1\":7117,\"buyQty2\":9517,\"cfi\":\"cfi-296\",\"dealFwdRate1\":8.126,\"dealFwdRate2\":5.491,\"dealSpotRate1\":7.751,\"dealSpotRate2\":4.137,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR7579472701\",\"lastTrans\":\"lastTrans-994\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-674\",\"period1\":\"period1-460\",\"period2\":\"period2-926\",\"sellBookText1\":\"sellBookText1-589\",\"sellBookText2\":\"sellBookText2-257\",\"sellQty1\":8936,\"sellQty2\":3166,\"spotDate\":\"2026-03-17\",\"trdrRate1\":5.247,\"trxDate\":\"2026-03-17\"}"

# [784] POST /doc-fxtrs — FXTR API
run_request "[784] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3729,\"advText\":\"advText-901\",\"bdeRecVersion\":2930,\"buyQty\":1409,\"dealFwdRate\":7.025,\"dealSpotRate\":2.276,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-605\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-733\",\"fwdSpread\":3756,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-744\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-429\",\"limit\":7521,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4190,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4270,\"orderedBy\":\"orderedBy-410\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-236\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":665,\"settlePlanA\":true,\"spotSpread1\":6813,\"spotSpread2\":5507,\"trdrRate\":0.136,\"trigPrice\":6159,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39895796736\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [785] GET /doc-fxtrs/{id} — FXTR API
run_request "[785] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [786] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[786] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":2169,\"advText\":\"advText-999\",\"bdeRecVersion\":4202,\"buyQty\":1694,\"dealFwdRate\":3.832,\"dealSpotRate\":2.732,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-549\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-375\",\"fwdSpread\":6679,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-838\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-777\",\"limit\":8816,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4533,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8684,\"orderedBy\":\"orderedBy-193\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-631\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1693,\"settlePlanA\":true,\"spotSpread1\":4433,\"spotSpread2\":6204,\"trdrRate\":5.182,\"trigPrice\":3601,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39754947137\"}"

# [787] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[787] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [788] POST /doc-inpays — Incoming Payment API
run_request "[788] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":9616,\"amount\":219013.92,\"bankClearNr\":\"bankClearNr-206\",\"bankInfo\":\"bankInfo-738\",\"bdeRecVersion\":2793,\"benefAcc\":\"benefAcc-174\",\"benefRefNr\":\"benefRefNr-871\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-441\",\"contrPeriodStart\":\"contrPeriodStart-395\",\"credAddr\":\"credAddr-174\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-131\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-113\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-304\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-263\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-134\",\"orderDate\":\"2026-03-17\",\"orderNr\":5358,\"orderedBy\":\"orderedBy-440\",\"originCountry\":{\"id\":2,\"ident\":\"DE\"},\"payerAcc\":\"payerAcc-522\",\"payerAddrTxt\":\"payerAddrTxt-283\",\"payerIban\":\"FR57783034578124505\",\"payerInfo\":\"payerInfo-781\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-324\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [789] GET /doc-inpays/{id} — Incoming Payment API
run_request "[789] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [790] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[790] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":6150,\"amount\":674153.04,\"bankClearNr\":\"bankClearNr-356\",\"bankInfo\":\"bankInfo-726\",\"bdeRecVersion\":411,\"benefAcc\":\"benefAcc-985\",\"benefRefNr\":\"benefRefNr-293\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-887\",\"contrPeriodStart\":\"contrPeriodStart-190\",\"credAddr\":\"credAddr-104\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-560\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-901\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-456\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-442\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-870\",\"orderDate\":\"2026-03-17\",\"orderNr\":6816,\"orderedBy\":\"orderedBy-408\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payerAcc\":\"payerAcc-726\",\"payerAddrTxt\":\"payerAddrTxt-605\",\"payerIban\":\"IT51486865245925020\",\"payerInfo\":\"payerInfo-535\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-526\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [791] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[791] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [792] GET /doc-intrs/{id} — Interest API
run_request "[792] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [793] POST /doc-invst-bdls — Investment Bundler API
run_request "[793] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":1483,\"bdeRecVersion\":4119,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-604\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-105\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-473\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-237\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2719,\"orderedBy\":\"orderedBy-553\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":4401,\"remnBaccBalMin\":3144,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [794] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[794] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [795] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[795] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":6403,\"bdeRecVersion\":137,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-614\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-928\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-227\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-845\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9992,\"orderedBy\":\"orderedBy-368\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":4184,\"remnBaccBalMin\":8664,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [796] POST /doc-crm-issues — Issue Management API
run_request "[796] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-985\",\"advNr\":9040,\"allDayEvt\":true,\"attch\":\"attch-483\",\"bdeRecVersion\":6701,\"campgnTaskSeqNr\":5819,\"descn\":\"descn-272\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-656\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-565\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-364\",\"findingKey\":\"findingKey-671\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-220\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-458\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-618\",\"location\":\"location-374\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6435,\"orderedBy\":\"orderedBy-346\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5233,\"qtyLinked\":4553,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-790\",\"subject\":\"subject-970\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-788\",\"undefBp\":\"undefBp-978\",\"val\":8344,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [797] GET /doc-crm-issues/{id} — Issue Management API
run_request "[797] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [798] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[798] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-348\",\"advNr\":2978,\"allDayEvt\":true,\"attch\":\"attch-195\",\"bdeRecVersion\":2200,\"campgnTaskSeqNr\":2440,\"descn\":\"descn-949\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-685\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-648\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-866\",\"findingKey\":\"findingKey-962\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-804\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-810\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-670\",\"location\":\"location-154\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6511,\"orderedBy\":\"orderedBy-952\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2231,\"qtyLinked\":2048,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-741\",\"subject\":\"subject-954\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-391\",\"undefBp\":\"undefBp-604\",\"val\":8956,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [799] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[799] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [800] GET /doc-letters/{id} — Letter API
run_request "[800] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [801] POST /doc-limits — Limit API
run_request "[801] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":4282,\"advTextCred\":\"advTextCred-850\",\"advTextDeb\":\"advTextDeb-587\",\"amount\":169438.81,\"bdeRecVersion\":6775,\"bookTextCred\":\"bookTextCred-380\",\"bookTextDeb\":\"bookTextDeb-221\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-702\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-906\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-877\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-890\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-151\",\"nextReview\":\"nextReview-549\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3095,\"orderedBy\":\"orderedBy-600\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [802] GET /doc-limits/{id} — Limit API
run_request "[802] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [803] PATCH /doc-limits/{id} — Limit API
run_request "[803] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":6940,\"advTextCred\":\"advTextCred-374\",\"advTextDeb\":\"advTextDeb-404\",\"amount\":437779.83,\"bdeRecVersion\":8642,\"bookTextCred\":\"bookTextCred-530\",\"bookTextDeb\":\"bookTextDeb-366\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-322\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-775\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-544\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-421\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-406\",\"nextReview\":\"nextReview-268\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5394,\"orderedBy\":\"orderedBy-979\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [804] POST /doc-loans — Loan API
run_request "[804] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":2155,\"advTextCred\":\"advTextCred-898\",\"advTextDeb\":\"advTextDeb-196\",\"bdeRecVersion\":3076,\"bookTextCred\":\"bookTextCred-372\",\"bookTextDeb\":\"bookTextDeb-670\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-746\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-258\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-936\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-688\",\"intrGradManMarkup\":6484,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-781\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1988,\"orderedBy\":\"orderedBy-474\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8664,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [805] GET /doc-loans/{id} — Loan API
run_request "[805] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [806] PATCH /doc-loans/{id} — Loan API
run_request "[806] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":2895,\"advTextCred\":\"advTextCred-525\",\"advTextDeb\":\"advTextDeb-745\",\"bdeRecVersion\":6521,\"bookTextCred\":\"bookTextCred-747\",\"bookTextDeb\":\"bookTextDeb-835\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-131\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-597\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-359\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-524\",\"intrGradManMarkup\":5054,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-240\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":4196,\"orderedBy\":\"orderedBy-103\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1401,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [807] POST /doc-mass-settles — Mass Settlement API
run_request "[807] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":2711,\"autoFillList\":true,\"bdeRecVersion\":7456,\"benefBpText\":\"benefBpText-923\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-276\",\"destBankBic\":\"CRESCHZZ80A\",\"destBankBpText\":\"destBankBpText-486\",\"destBankClr\":\"destBankClr-889\",\"destBankText\":\"destBankText-475\",\"destBenefText\":\"destBenefText-984\",\"destInfo\":\"destInfo-777\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-286\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-234\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-846\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-810\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8217,\"orderedBy\":\"orderedBy-630\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [808] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[808] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [809] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[809] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":9121,\"autoFillList\":true,\"bdeRecVersion\":7105,\"benefBpText\":\"benefBpText-423\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-927\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-671\",\"destBankClr\":\"destBankClr-366\",\"destBankText\":\"destBankText-898\",\"destBenefText\":\"destBenefText-677\",\"destInfo\":\"destInfo-996\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-719\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-546\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-335\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-649\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6391,\"orderedBy\":\"orderedBy-338\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [810] POST /doc-mmkts — Money Market API
run_request "[810] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":4773,\"bdeRecVersion\":42,\"capt\":7928,\"dcdStrike\":6038,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-319\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-756\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-352\",\"intrRate\":7.222,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-787\",\"maturityDate\":\"2026-03-17\",\"mktRate\":5.825,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5904,\"orderedBy\":\"orderedBy-176\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":251,\"respBpA\":true,\"respObjA\":true,\"rmRate\":5.209,\"settlePlanA\":true,\"trdrRate\":3.546,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [811] GET /doc-mmkts/{id} — Money Market API
run_request "[811] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [812] PATCH /doc-mmkts/{id} — Money Market API
run_request "[812] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":3239,\"bdeRecVersion\":5564,\"capt\":8207,\"dcdStrike\":6354,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-118\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-595\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-228\",\"intrRate\":3.706,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-773\",\"maturityDate\":\"2026-03-17\",\"mktRate\":4.673,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2859,\"orderedBy\":\"orderedBy-810\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4175,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.709,\"settlePlanA\":true,\"trdrRate\":3.867,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [813] POST /doc-xfermons — Money Transfer API
run_request "[813] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":7102,\"amount\":221705.48,\"bdeRecVersion\":3471,\"bulkItemIdent\":\"bulkItemIdent-807\",\"credAdvText\":\"credAdvText-662\",\"credBookText\":\"credBookText-107\",\"debAdvText\":\"debAdvText-505\",\"debBookText\":\"debBookText-120\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-570\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-955\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-983\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-359\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7266,\"orderedBy\":\"orderedBy-794\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [814] GET /doc-xfermons/{id} — Money Transfer API
run_request "[814] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [815] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[815] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":2812,\"amount\":295402.31,\"bdeRecVersion\":4138,\"bulkItemIdent\":\"bulkItemIdent-870\",\"credAdvText\":\"credAdvText-185\",\"credBookText\":\"credBookText-781\",\"debAdvText\":\"debAdvText-425\",\"debBookText\":\"debBookText-797\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-944\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-571\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-258\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-140\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9189,\"orderedBy\":\"orderedBy-521\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [816] POST /doc-oofxs — OTC FX Option API
run_request "[816] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":6195,\"advTextCred\":\"advTextCred-931\",\"advTextDeb\":\"advTextDeb-361\",\"bdeRecVersion\":140,\"bookTextCred\":\"bookTextCred-100\",\"bookTextDeb\":\"bookTextDeb-563\",\"callQty\":8740,\"cutOffTime\":\"cutOffTime-118\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-252\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-380\",\"gross\":\"gross-753\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-855\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-893\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5037,\"orderedBy\":\"orderedBy-740\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-728\",\"putQty\":5513,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-454\",\"spread2\":\"spread2-612\",\"strike\":7544,\"strikePict\":8703,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [817] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[817] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [818] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[818] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":9638,\"advTextCred\":\"advTextCred-759\",\"advTextDeb\":\"advTextDeb-516\",\"bdeRecVersion\":6348,\"bookTextCred\":\"bookTextCred-497\",\"bookTextDeb\":\"bookTextDeb-355\",\"callQty\":5776,\"cutOffTime\":\"cutOffTime-889\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-840\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-463\",\"gross\":\"gross-475\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-117\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-889\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7179,\"orderedBy\":\"orderedBy-909\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-387\",\"putQty\":3502,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-324\",\"spread2\":\"spread2-626\",\"strike\":4102,\"strikePict\":3398,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [819] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[819] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [820] GET /doc-otcopts/{id} — OTC Option API
run_request "[820] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [821] GET /doc-othsecs/{id} — Other Security API
run_request "[821] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [822] POST /doc-pays — Payment API
run_request "[822] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":4063,\"amount\":292933.5,\"bank\":\"bank-103\",\"bankAcc\":\"bankAcc-367\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-933\",\"bankCorr1\":\"bankCorr1-215\",\"bankCorr1Acc\":\"bankCorr1Acc-865\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-307\",\"bankCorr3\":\"bankCorr3-348\",\"bankCorr3Acc\":\"bankCorr3Acc-270\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-397\",\"bankCorr4\":\"bankCorr4-438\",\"bankCorr4Acc\":\"bankCorr4Acc-329\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-227\",\"bankInfo\":\"bankInfo-203\",\"bdeRecVersion\":7433,\"benef\":\"benef-748\",\"benefAcc\":\"benefAcc-868\",\"benefIban\":\"CH56818159836351037\",\"benefInfo\":\"benefInfo-125\",\"benefRefNr\":\"benefRefNr-913\",\"bookTextCred\":\"bookTextCred-531\",\"bookTextDeb\":\"bookTextDeb-753\",\"bulkItemIdent\":\"bulkItemIdent-823\",\"destCountry\":{\"id\":1,\"ident\":\"CH\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-207\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-200\",\"hasPostit\":true,\"instrAmount\":76121.32,\"intlRefNr\":\"intlRefNr-350\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH6228190553\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-131\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-642\",\"ordBankAcc\":\"ordBankAcc-869\",\"ordBankClearNr\":\"ordBankClearNr-199\",\"ordRef\":\"ordRef-689\",\"orderDate\":\"2026-03-17\",\"orderNr\":1973,\"orderedBy\":\"orderedBy-700\",\"orderedByAcc\":\"orderedByAcc-586\",\"origGrpRef\":\"origGrpRef-104\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-527\",\"stordPeriodEnd\":\"stordPeriodEnd-528\",\"stordPeriodStart\":\"stordPeriodStart-799\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39350510071\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [823] GET /doc-pays/{id} — Payment API
run_request "[823] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [824] PATCH /doc-pays/{id} — Payment API
run_request "[824] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":8094,\"amount\":889500.05,\"bank\":\"bank-827\",\"bankAcc\":\"bankAcc-687\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-396\",\"bankCorr1\":\"bankCorr1-911\",\"bankCorr1Acc\":\"bankCorr1Acc-868\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-479\",\"bankCorr3\":\"bankCorr3-769\",\"bankCorr3Acc\":\"bankCorr3Acc-348\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-968\",\"bankCorr4\":\"bankCorr4-753\",\"bankCorr4Acc\":\"bankCorr4Acc-880\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-799\",\"bankInfo\":\"bankInfo-748\",\"bdeRecVersion\":3759,\"benef\":\"benef-505\",\"benefAcc\":\"benefAcc-912\",\"benefIban\":\"FR19161762759460544\",\"benefInfo\":\"benefInfo-577\",\"benefRefNr\":\"benefRefNr-112\",\"bookTextCred\":\"bookTextCred-287\",\"bookTextDeb\":\"bookTextDeb-953\",\"bulkItemIdent\":\"bulkItemIdent-648\",\"destCountry\":{\"id\":3,\"ident\":\"IT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-533\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-514\",\"hasPostit\":true,\"instrAmount\":896600.38,\"intlRefNr\":\"intlRefNr-889\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"FR3242963888\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-643\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-959\",\"ordBankAcc\":\"ordBankAcc-789\",\"ordBankClearNr\":\"ordBankClearNr-888\",\"ordRef\":\"ordRef-658\",\"orderDate\":\"2026-03-17\",\"orderNr\":3152,\"orderedBy\":\"orderedBy-258\",\"orderedByAcc\":\"orderedByAcc-155\",\"origGrpRef\":\"origGrpRef-454\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-243\",\"stordPeriodEnd\":\"stordPeriodEnd-863\",\"stordPeriodStart\":\"stordPeriodStart-632\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+44518374942\"}"

# [825] GET /doc-realsecs/{id} — Real Security API
run_request "[825] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [826] POST /doc-realtys — Realty API
run_request "[826] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":8247,\"bdeRecVersion\":1572,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-202\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-272\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-424\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-439\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5428,\"orderedBy\":\"orderedBy-127\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [827] GET /doc-realtys/{id} — Realty API
run_request "[827] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [828] PATCH /doc-realtys/{id} — Realty API
run_request "[828] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":7801,\"bdeRecVersion\":5989,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-822\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-975\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-656\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-712\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":953,\"orderedBy\":\"orderedBy-129\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [829] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[829] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":9112,\"bdeRecVersion\":166,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-475\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-185\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-747\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-217\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4621,\"orderedBy\":\"orderedBy-339\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [830] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[830] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [831] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[831] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":6533,\"bdeRecVersion\":3864,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-938\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-929\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-500\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-733\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8664,\"orderedBy\":\"orderedBy-682\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [832] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[832] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [833] POST /doc-rebalss — Rebalancer Order API
run_request "[833] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":766,\"bdeRecVersion\":654,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-488\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-344\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-497\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-599\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8160,\"orderedBy\":\"orderedBy-766\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [834] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[834] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [835] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[835] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":7593,\"bdeRecVersion\":8259,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-835\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-628\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-589\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-811\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4263,\"orderedBy\":\"orderedBy-733\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [836] GET /doc-repocs/{id} — Repo Contract API
run_request "[836] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [1141] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[1141] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [1142] POST /doc-ctact2s — Contact Management (V2) API
run_request "[1142] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":5576,\"attch\":\"attch-816\",\"attchA\":true,\"bdeRecVersion\":3860,\"campgnCltReaction\":\"campgnCltReaction-624\",\"campgnRespKey\":\"campgnRespKey-707\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-782\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-576\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-187\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-241\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-249\",\"linkDocListA\":true,\"loc\":\"loc-740\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5828,\"orderedBy\":\"orderedBy-795\",\"particListA\":true,\"questrSeqNr\":4389,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":7959,\"reactComment\":\"reactComment-402\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-217\",\"reactNrPartic\":3255,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-119\",\"subjA\":true,\"syncSeqNr\":6575,\"totExpndTimeM\":1865,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1143] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1143] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [1144] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1144] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":9678,\"attch\":\"attch-408\",\"attchA\":true,\"bdeRecVersion\":3180,\"campgnCltReaction\":\"campgnCltReaction-901\",\"campgnRespKey\":\"campgnRespKey-274\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-248\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-761\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-693\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-526\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-889\",\"linkDocListA\":true,\"loc\":\"loc-365\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3446,\"orderedBy\":\"orderedBy-925\",\"particListA\":true,\"questrSeqNr\":2015,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":9351,\"reactComment\":\"reactComment-584\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-827\",\"reactNrPartic\":7469,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-189\",\"subjA\":true,\"syncSeqNr\":4554,\"totExpndTimeM\":2344,\"trxDate\":\"2026-03-17\"}"

# [1145] GET /doc-cmgs/{id} — Cashier Management API
run_request "[1145] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [1146] GET /doc-cops/{id} — Cashier Operations API
run_request "[1146] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [1147] POST /doc-clts — Client Opening API
run_request "[1147] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1148] GET /doc-clts/{id} — Client Opening API
run_request "[1148] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [1149] PATCH /doc-clts/{id} — Client Opening API
run_request "[1149] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [1150] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[1150] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [1151] GET /doc-cltms/{id} — Collateral Movement API
run_request "[1151] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [1152] GET /doc-cords/{id} — Collective Order API
run_request "[1152] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [1153] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[1153] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [1154] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[1154] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [1155] POST /doc-xioms — External Investment Order Manager API
run_request "[1155] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":9671,\"bdeRecVersion\":264,\"bpLevelRep\":true,\"descn\":\"descn-361\",\"extlRefNr\":\"extlRefNr-845\",\"extlRepLang\":\"extlRepLang-317\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-914\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-425\",\"linkGrp\":859,\"orderDate\":\"2026-03-17\",\"orderNr\":1927,\"orderedBy\":\"orderedBy-899\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1156] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[1156] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [1157] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[1157] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":7960,\"bdeRecVersion\":1287,\"bpLevelRep\":true,\"descn\":\"descn-149\",\"extlRefNr\":\"extlRefNr-627\",\"extlRepLang\":\"extlRepLang-129\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-709\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-541\",\"linkGrp\":1378,\"orderDate\":\"2026-03-17\",\"orderNr\":980,\"orderedBy\":\"orderedBy-808\",\"sendRepToEbank\":true}"

# [1158] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[1158] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [1159] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[1159] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [1160] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[1160] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [1161] POST /doc-fxsws — FX Swap API
run_request "[1161] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-448\",\"bdeRecVersion\":9021,\"buyBookText1\":\"buyBookText1-853\",\"buyBookText2\":\"buyBookText2-244\",\"buyQty1\":6600,\"buyQty2\":6592,\"cfi\":\"cfi-623\",\"dealFwdRate1\":6.244,\"dealFwdRate2\":2.518,\"dealSpotRate1\":3.719,\"dealSpotRate2\":1.949,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB8150281609\",\"lastTrans\":\"lastTrans-735\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-869\",\"period1\":\"period1-776\",\"period2\":\"period2-746\",\"sellBookText1\":\"sellBookText1-875\",\"sellBookText2\":\"sellBookText2-668\",\"sellQty1\":3859,\"sellQty2\":8898,\"spotDate\":\"2026-03-17\",\"trdrRate1\":0.391,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1162] GET /doc-fxsws/{id} — FX Swap API
run_request "[1162] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [1163] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[1163] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-123\",\"bdeRecVersion\":8180,\"buyBookText1\":\"buyBookText1-518\",\"buyBookText2\":\"buyBookText2-783\",\"buyQty1\":1020,\"buyQty2\":503,\"cfi\":\"cfi-884\",\"dealFwdRate1\":6.907,\"dealFwdRate2\":5.674,\"dealSpotRate1\":6.049,\"dealSpotRate2\":4.976,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB5756644314\",\"lastTrans\":\"lastTrans-441\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-409\",\"period1\":\"period1-802\",\"period2\":\"period2-489\",\"sellBookText1\":\"sellBookText1-966\",\"sellBookText2\":\"sellBookText2-311\",\"sellQty1\":7630,\"sellQty2\":5642,\"spotDate\":\"2026-03-17\",\"trdrRate1\":5.16,\"trxDate\":\"2026-03-17\"}"

# [1164] POST /doc-fxtrs — FXTR API
run_request "[1164] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":1534,\"advText\":\"advText-692\",\"bdeRecVersion\":8289,\"buyQty\":6243,\"dealFwdRate\":8.269,\"dealSpotRate\":2.903,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-771\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-425\",\"fwdSpread\":9489,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-225\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-952\",\"limit\":6041,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":8194,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6728,\"orderedBy\":\"orderedBy-558\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-860\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5986,\"settlePlanA\":true,\"spotSpread1\":3525,\"spotSpread2\":4578,\"trdrRate\":8.302,\"trigPrice\":7616,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39109608353\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1165] GET /doc-fxtrs/{id} — FXTR API
run_request "[1165] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [1166] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[1166] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":7590,\"advText\":\"advText-827\",\"bdeRecVersion\":9019,\"buyQty\":2154,\"dealFwdRate\":5.877,\"dealSpotRate\":1.355,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-552\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-665\",\"fwdSpread\":908,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-277\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-697\",\"limit\":5064,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":9689,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4178,\"orderedBy\":\"orderedBy-709\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-499\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":731,\"settlePlanA\":true,\"spotSpread1\":9206,\"spotSpread2\":1237,\"trdrRate\":6.671,\"trigPrice\":5287,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+49624887848\"}"

# [1167] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[1167] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [1168] POST /doc-inpays — Incoming Payment API
run_request "[1168] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":9286,\"amount\":600452.64,\"bankClearNr\":\"bankClearNr-462\",\"bankInfo\":\"bankInfo-644\",\"bdeRecVersion\":5818,\"benefAcc\":\"benefAcc-177\",\"benefRefNr\":\"benefRefNr-570\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-561\",\"contrPeriodStart\":\"contrPeriodStart-720\",\"credAddr\":\"credAddr-831\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-541\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-532\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-548\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-643\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-315\",\"orderDate\":\"2026-03-17\",\"orderNr\":7819,\"orderedBy\":\"orderedBy-301\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payerAcc\":\"payerAcc-113\",\"payerAddrTxt\":\"payerAddrTxt-667\",\"payerIban\":\"IT67720852379357324\",\"payerInfo\":\"payerInfo-685\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-986\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1169] GET /doc-inpays/{id} — Incoming Payment API
run_request "[1169] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [1170] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[1170] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":1733,\"amount\":250844.8,\"bankClearNr\":\"bankClearNr-810\",\"bankInfo\":\"bankInfo-255\",\"bdeRecVersion\":1163,\"benefAcc\":\"benefAcc-535\",\"benefRefNr\":\"benefRefNr-628\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-770\",\"contrPeriodStart\":\"contrPeriodStart-293\",\"credAddr\":\"credAddr-440\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-155\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-394\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-971\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-687\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-586\",\"orderDate\":\"2026-03-17\",\"orderNr\":342,\"orderedBy\":\"orderedBy-236\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payerAcc\":\"payerAcc-650\",\"payerAddrTxt\":\"payerAddrTxt-604\",\"payerIban\":\"DE49478512080704038\",\"payerInfo\":\"payerInfo-572\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-749\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1171] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[1171] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [1172] GET /doc-intrs/{id} — Interest API
run_request "[1172] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [1173] POST /doc-invst-bdls — Investment Bundler API
run_request "[1173] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":8776,\"bdeRecVersion\":9886,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-151\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-675\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-989\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-982\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5187,\"orderedBy\":\"orderedBy-555\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":4518,\"remnBaccBalMin\":3268,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1174] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1174] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [1175] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1175] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":6760,\"bdeRecVersion\":3052,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-884\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-612\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-554\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-351\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2482,\"orderedBy\":\"orderedBy-290\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":8025,\"remnBaccBalMin\":3800,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1176] POST /doc-crm-issues — Issue Management API
run_request "[1176] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-635\",\"advNr\":9257,\"allDayEvt\":true,\"attch\":\"attch-221\",\"bdeRecVersion\":544,\"campgnTaskSeqNr\":2278,\"descn\":\"descn-263\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-854\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-375\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-481\",\"findingKey\":\"findingKey-902\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-364\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-172\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-680\",\"location\":\"location-919\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7377,\"orderedBy\":\"orderedBy-503\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1845,\"qtyLinked\":7697,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-373\",\"subject\":\"subject-252\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-127\",\"undefBp\":\"undefBp-644\",\"val\":1163,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1177] GET /doc-crm-issues/{id} — Issue Management API
run_request "[1177] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [1178] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[1178] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-984\",\"advNr\":9416,\"allDayEvt\":true,\"attch\":\"attch-652\",\"bdeRecVersion\":6753,\"campgnTaskSeqNr\":5588,\"descn\":\"descn-796\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-297\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-940\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-865\",\"findingKey\":\"findingKey-900\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-624\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-588\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-571\",\"location\":\"location-601\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8424,\"orderedBy\":\"orderedBy-691\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4060,\"qtyLinked\":9811,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-322\",\"subject\":\"subject-371\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-807\",\"undefBp\":\"undefBp-588\",\"val\":8578,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1179] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[1179] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [1180] GET /doc-letters/{id} — Letter API
run_request "[1180] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [1181] POST /doc-limits — Limit API
run_request "[1181] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":2881,\"advTextCred\":\"advTextCred-906\",\"advTextDeb\":\"advTextDeb-831\",\"amount\":169819.63,\"bdeRecVersion\":9995,\"bookTextCred\":\"bookTextCred-136\",\"bookTextDeb\":\"bookTextDeb-252\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-869\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-343\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-657\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-576\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-742\",\"nextReview\":\"nextReview-807\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6954,\"orderedBy\":\"orderedBy-918\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1182] GET /doc-limits/{id} — Limit API
run_request "[1182] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [1183] PATCH /doc-limits/{id} — Limit API
run_request "[1183] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":1091,\"advTextCred\":\"advTextCred-145\",\"advTextDeb\":\"advTextDeb-349\",\"amount\":225476.58,\"bdeRecVersion\":7475,\"bookTextCred\":\"bookTextCred-666\",\"bookTextDeb\":\"bookTextDeb-841\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-599\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-567\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-807\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-384\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-658\",\"nextReview\":\"nextReview-947\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3397,\"orderedBy\":\"orderedBy-125\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1184] POST /doc-loans — Loan API
run_request "[1184] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":5759,\"advTextCred\":\"advTextCred-942\",\"advTextDeb\":\"advTextDeb-838\",\"bdeRecVersion\":5313,\"bookTextCred\":\"bookTextCred-204\",\"bookTextDeb\":\"bookTextDeb-430\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-102\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-489\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-238\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-774\",\"intrGradManMarkup\":5894,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-822\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2285,\"orderedBy\":\"orderedBy-235\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2969,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1185] GET /doc-loans/{id} — Loan API
run_request "[1185] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [1186] PATCH /doc-loans/{id} — Loan API
run_request "[1186] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":3362,\"advTextCred\":\"advTextCred-318\",\"advTextDeb\":\"advTextDeb-888\",\"bdeRecVersion\":1812,\"bookTextCred\":\"bookTextCred-195\",\"bookTextDeb\":\"bookTextDeb-279\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-542\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-627\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-320\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-624\",\"intrGradManMarkup\":5858,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-139\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7765,\"orderedBy\":\"orderedBy-314\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6076,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1187] POST /doc-mass-settles — Mass Settlement API
run_request "[1187] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":4121,\"autoFillList\":true,\"bdeRecVersion\":8639,\"benefBpText\":\"benefBpText-217\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-810\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-332\",\"destBankClr\":\"destBankClr-418\",\"destBankText\":\"destBankText-378\",\"destBenefText\":\"destBenefText-414\",\"destInfo\":\"destInfo-606\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-632\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-489\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-334\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-244\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":337,\"orderedBy\":\"orderedBy-244\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1188] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[1188] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>Capi Test Report · Part 1</title>
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
<h1>🧪 Capi Test Report <span style='color:#8b949e;font-size:14px'>Part 1 / 8</span></h1>
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