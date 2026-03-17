#!/usr/bin/env bash
# =============================================================
# Capi Test Runner — FLOW Execution (Part 6/8)
# Generated: 2026-03-17T10:50:15.592Z
# Cases:     317–1580 of 1596
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-17-10-50-12_part6_report.html"
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
ID_DOC_SECTRX2S=""
ID_DOC_CTACT2S=""
ID_DOC_CMGS=""
ID_DOC_COPS=""
ID_DOC_CLTS=""
ID_DOC_CLTAS=""
ID_DOC_CLTMS=""
ID_DOC_CORDS=""

# ── INIT HTML REPORT ─────────────────────────────────────────
echo "Starting 200 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [317] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[317] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [318] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[318] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [319] POST /doc-xioms — External Investment Order Manager API
run_request "[319] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":7837,\"bdeRecVersion\":5789,\"bpLevelRep\":true,\"descn\":\"descn-893\",\"extlRefNr\":\"extlRefNr-145\",\"extlRepLang\":\"extlRepLang-940\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-256\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-547\",\"linkGrp\":9805,\"orderDate\":\"2026-03-17\",\"orderNr\":8140,\"orderedBy\":\"orderedBy-204\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [320] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[320] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [321] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[321] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":6842,\"bdeRecVersion\":3867,\"bpLevelRep\":true,\"descn\":\"descn-473\",\"extlRefNr\":\"extlRefNr-724\",\"extlRepLang\":\"extlRepLang-208\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-788\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-567\",\"linkGrp\":2862,\"orderDate\":\"2026-03-17\",\"orderNr\":6607,\"orderedBy\":\"orderedBy-544\",\"sendRepToEbank\":true}"

# [322] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[322] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [323] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[323] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [324] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[324] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [325] POST /doc-fxsws — FX Swap API
run_request "[325] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-290\",\"bdeRecVersion\":8826,\"buyBookText1\":\"buyBookText1-308\",\"buyBookText2\":\"buyBookText2-835\",\"buyQty1\":9199,\"buyQty2\":8376,\"cfi\":\"cfi-616\",\"dealFwdRate1\":2.76,\"dealFwdRate2\":5.627,\"dealSpotRate1\":7.955,\"dealSpotRate2\":2.842,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB7028577218\",\"lastTrans\":\"lastTrans-428\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-998\",\"period1\":\"period1-523\",\"period2\":\"period2-180\",\"sellBookText1\":\"sellBookText1-774\",\"sellBookText2\":\"sellBookText2-525\",\"sellQty1\":9306,\"sellQty2\":563,\"spotDate\":\"2026-03-17\",\"trdrRate1\":0.723,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [326] GET /doc-fxsws/{id} — FX Swap API
run_request "[326] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [327] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[327] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-778\",\"bdeRecVersion\":2194,\"buyBookText1\":\"buyBookText1-896\",\"buyBookText2\":\"buyBookText2-393\",\"buyQty1\":2353,\"buyQty2\":4430,\"cfi\":\"cfi-937\",\"dealFwdRate1\":5.706,\"dealFwdRate2\":3.348,\"dealSpotRate1\":5.158,\"dealSpotRate2\":6.006,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE6543417770\",\"lastTrans\":\"lastTrans-425\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-243\",\"period1\":\"period1-783\",\"period2\":\"period2-531\",\"sellBookText1\":\"sellBookText1-646\",\"sellBookText2\":\"sellBookText2-476\",\"sellQty1\":3560,\"sellQty2\":195,\"spotDate\":\"2026-03-17\",\"trdrRate1\":6.54,\"trxDate\":\"2026-03-17\"}"

# [328] POST /doc-fxtrs — FXTR API
run_request "[328] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":1602,\"advText\":\"advText-124\",\"bdeRecVersion\":2219,\"buyQty\":6226,\"dealFwdRate\":6.748,\"dealSpotRate\":6.987,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-312\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-451\",\"fwdSpread\":307,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-122\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-508\",\"limit\":8929,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":9199,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6650,\"orderedBy\":\"orderedBy-754\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-612\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7584,\"settlePlanA\":true,\"spotSpread1\":9771,\"spotSpread2\":2110,\"trdrRate\":5.224,\"trigPrice\":495,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39308576507\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [329] GET /doc-fxtrs/{id} — FXTR API
run_request "[329] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [330] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[330] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":7254,\"advText\":\"advText-616\",\"bdeRecVersion\":1289,\"buyQty\":405,\"dealFwdRate\":3.701,\"dealSpotRate\":6.838,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-258\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-826\",\"fwdSpread\":502,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-342\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-719\",\"limit\":3420,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":8149,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1894,\"orderedBy\":\"orderedBy-791\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-931\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8564,\"settlePlanA\":true,\"spotSpread1\":3913,\"spotSpread2\":7544,\"trdrRate\":6.33,\"trigPrice\":503,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44960107731\"}"

# [331] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[331] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [332] POST /doc-inpays — Incoming Payment API
run_request "[332] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":99,\"amount\":166773.62,\"bankClearNr\":\"bankClearNr-196\",\"bankInfo\":\"bankInfo-265\",\"bdeRecVersion\":3487,\"benefAcc\":\"benefAcc-894\",\"benefRefNr\":\"benefRefNr-941\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-907\",\"contrPeriodStart\":\"contrPeriodStart-283\",\"credAddr\":\"credAddr-514\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-184\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-512\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-669\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-235\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-982\",\"orderDate\":\"2026-03-17\",\"orderNr\":4610,\"orderedBy\":\"orderedBy-581\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payerAcc\":\"payerAcc-110\",\"payerAddrTxt\":\"payerAddrTxt-213\",\"payerIban\":\"AT25424373379874647\",\"payerInfo\":\"payerInfo-510\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-337\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [333] GET /doc-inpays/{id} — Incoming Payment API
run_request "[333] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [334] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[334] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":4709,\"amount\":758351.52,\"bankClearNr\":\"bankClearNr-160\",\"bankInfo\":\"bankInfo-989\",\"bdeRecVersion\":8646,\"benefAcc\":\"benefAcc-414\",\"benefRefNr\":\"benefRefNr-658\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-273\",\"contrPeriodStart\":\"contrPeriodStart-237\",\"credAddr\":\"credAddr-129\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-568\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-714\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-867\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-682\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-726\",\"orderDate\":\"2026-03-17\",\"orderNr\":2711,\"orderedBy\":\"orderedBy-841\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payerAcc\":\"payerAcc-872\",\"payerAddrTxt\":\"payerAddrTxt-251\",\"payerIban\":\"IT24966395033334560\",\"payerInfo\":\"payerInfo-268\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-191\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [335] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[335] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [336] GET /doc-intrs/{id} — Interest API
run_request "[336] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [337] POST /doc-invst-bdls — Investment Bundler API
run_request "[337] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":1703,\"bdeRecVersion\":7358,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-948\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-378\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-117\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-155\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2116,\"orderedBy\":\"orderedBy-703\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":2677,\"remnBaccBalMin\":501,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [338] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[338] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [339] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[339] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":5537,\"bdeRecVersion\":1687,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-373\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-978\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-164\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-648\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3053,\"orderedBy\":\"orderedBy-768\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":2258,\"remnBaccBalMin\":4965,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [340] POST /doc-crm-issues — Issue Management API
run_request "[340] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-772\",\"advNr\":4471,\"allDayEvt\":true,\"attch\":\"attch-511\",\"bdeRecVersion\":4461,\"campgnTaskSeqNr\":8458,\"descn\":\"descn-582\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-299\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-290\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-882\",\"findingKey\":\"findingKey-662\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-243\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-853\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-465\",\"location\":\"location-803\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1444,\"orderedBy\":\"orderedBy-181\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":668,\"qtyLinked\":3884,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-970\",\"subject\":\"subject-609\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-594\",\"undefBp\":\"undefBp-818\",\"val\":2363,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [341] GET /doc-crm-issues/{id} — Issue Management API
run_request "[341] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [342] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[342] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-661\",\"advNr\":8604,\"allDayEvt\":true,\"attch\":\"attch-151\",\"bdeRecVersion\":8997,\"campgnTaskSeqNr\":5597,\"descn\":\"descn-164\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-191\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-934\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-280\",\"findingKey\":\"findingKey-574\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-578\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-933\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-746\",\"location\":\"location-438\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2493,\"orderedBy\":\"orderedBy-839\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2536,\"qtyLinked\":9066,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-932\",\"subject\":\"subject-843\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-503\",\"undefBp\":\"undefBp-481\",\"val\":1933,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [343] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[343] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [344] GET /doc-letters/{id} — Letter API
run_request "[344] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [345] POST /doc-limits — Limit API
run_request "[345] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":7440,\"advTextCred\":\"advTextCred-956\",\"advTextDeb\":\"advTextDeb-474\",\"amount\":669635.22,\"bdeRecVersion\":4786,\"bookTextCred\":\"bookTextCred-217\",\"bookTextDeb\":\"bookTextDeb-550\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-676\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-532\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-656\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-547\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-350\",\"nextReview\":\"nextReview-215\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9174,\"orderedBy\":\"orderedBy-413\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [346] GET /doc-limits/{id} — Limit API
run_request "[346] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [347] PATCH /doc-limits/{id} — Limit API
run_request "[347] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":2675,\"advTextCred\":\"advTextCred-794\",\"advTextDeb\":\"advTextDeb-885\",\"amount\":695918.56,\"bdeRecVersion\":4793,\"bookTextCred\":\"bookTextCred-243\",\"bookTextDeb\":\"bookTextDeb-965\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-696\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-421\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-840\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-862\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-722\",\"nextReview\":\"nextReview-605\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":563,\"orderedBy\":\"orderedBy-514\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [348] POST /doc-loans — Loan API
run_request "[348] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":4138,\"advTextCred\":\"advTextCred-306\",\"advTextDeb\":\"advTextDeb-216\",\"bdeRecVersion\":2617,\"bookTextCred\":\"bookTextCred-632\",\"bookTextDeb\":\"bookTextDeb-366\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-958\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-387\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-951\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-210\",\"intrGradManMarkup\":8151,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-766\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8352,\"orderedBy\":\"orderedBy-211\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":7341,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [349] GET /doc-loans/{id} — Loan API
run_request "[349] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [350] PATCH /doc-loans/{id} — Loan API
run_request "[350] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":383,\"advTextCred\":\"advTextCred-301\",\"advTextDeb\":\"advTextDeb-479\",\"bdeRecVersion\":4442,\"bookTextCred\":\"bookTextCred-617\",\"bookTextDeb\":\"bookTextDeb-835\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-300\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-866\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-589\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-908\",\"intrGradManMarkup\":5680,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-871\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":946,\"orderedBy\":\"orderedBy-946\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9814,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [351] POST /doc-mass-settles — Mass Settlement API
run_request "[351] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":2379,\"autoFillList\":true,\"bdeRecVersion\":1675,\"benefBpText\":\"benefBpText-262\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-395\",\"destBankBic\":\"BFGEIT3F\",\"destBankBpText\":\"destBankBpText-584\",\"destBankClr\":\"destBankClr-898\",\"destBankText\":\"destBankText-921\",\"destBenefText\":\"destBenefText-196\",\"destInfo\":\"destInfo-455\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-524\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-268\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-442\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-524\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2165,\"orderedBy\":\"orderedBy-996\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [352] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[352] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [353] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[353] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":948,\"autoFillList\":true,\"bdeRecVersion\":1070,\"benefBpText\":\"benefBpText-867\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-551\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-786\",\"destBankClr\":\"destBankClr-938\",\"destBankText\":\"destBankText-877\",\"destBenefText\":\"destBenefText-675\",\"destInfo\":\"destInfo-122\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-460\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-785\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-901\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-447\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2370,\"orderedBy\":\"orderedBy-137\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [354] POST /doc-mmkts — Money Market API
run_request "[354] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":1021,\"bdeRecVersion\":7,\"capt\":4132,\"dcdStrike\":4802,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-640\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-475\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-473\",\"intrRate\":6.57,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-390\",\"maturityDate\":\"2026-03-17\",\"mktRate\":5.279,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2504,\"orderedBy\":\"orderedBy-742\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8580,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.3,\"settlePlanA\":true,\"trdrRate\":3.492,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [355] GET /doc-mmkts/{id} — Money Market API
run_request "[355] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [356] PATCH /doc-mmkts/{id} — Money Market API
run_request "[356] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":7871,\"bdeRecVersion\":3363,\"capt\":3270,\"dcdStrike\":6090,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-905\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-753\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-368\",\"intrRate\":7.763,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-527\",\"maturityDate\":\"2026-03-17\",\"mktRate\":6.183,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2091,\"orderedBy\":\"orderedBy-124\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1648,\"respBpA\":true,\"respObjA\":true,\"rmRate\":6.903,\"settlePlanA\":true,\"trdrRate\":5.878,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [357] POST /doc-xfermons — Money Transfer API
run_request "[357] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":5508,\"amount\":184502.37,\"bdeRecVersion\":7370,\"bulkItemIdent\":\"bulkItemIdent-764\",\"credAdvText\":\"credAdvText-341\",\"credBookText\":\"credBookText-961\",\"debAdvText\":\"debAdvText-996\",\"debBookText\":\"debBookText-429\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-735\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-304\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-503\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-554\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5678,\"orderedBy\":\"orderedBy-510\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [358] GET /doc-xfermons/{id} — Money Transfer API
run_request "[358] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [359] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[359] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":9131,\"amount\":383153.05,\"bdeRecVersion\":6765,\"bulkItemIdent\":\"bulkItemIdent-429\",\"credAdvText\":\"credAdvText-240\",\"credBookText\":\"credBookText-259\",\"debAdvText\":\"debAdvText-343\",\"debBookText\":\"debBookText-319\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-177\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-743\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-908\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-345\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3519,\"orderedBy\":\"orderedBy-332\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [360] POST /doc-oofxs — OTC FX Option API
run_request "[360] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":3500,\"advTextCred\":\"advTextCred-783\",\"advTextDeb\":\"advTextDeb-317\",\"bdeRecVersion\":7090,\"bookTextCred\":\"bookTextCred-218\",\"bookTextDeb\":\"bookTextDeb-812\",\"callQty\":8309,\"cutOffTime\":\"cutOffTime-509\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-275\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-448\",\"gross\":\"gross-636\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-965\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-496\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8849,\"orderedBy\":\"orderedBy-336\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-602\",\"putQty\":2012,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-869\",\"spread2\":\"spread2-828\",\"strike\":9042,\"strikePict\":4451,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [361] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[361] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [362] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[362] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":4012,\"advTextCred\":\"advTextCred-720\",\"advTextDeb\":\"advTextDeb-853\",\"bdeRecVersion\":8007,\"bookTextCred\":\"bookTextCred-306\",\"bookTextDeb\":\"bookTextDeb-479\",\"callQty\":1907,\"cutOffTime\":\"cutOffTime-705\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-342\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-845\",\"gross\":\"gross-397\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-720\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-892\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6153,\"orderedBy\":\"orderedBy-235\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-260\",\"putQty\":5542,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-941\",\"spread2\":\"spread2-335\",\"strike\":1650,\"strikePict\":2350,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [363] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[363] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [364] GET /doc-otcopts/{id} — OTC Option API
run_request "[364] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [365] GET /doc-othsecs/{id} — Other Security API
run_request "[365] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [366] POST /doc-pays — Payment API
run_request "[366] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":6310,\"amount\":761954.55,\"bank\":\"bank-305\",\"bankAcc\":\"bankAcc-978\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-675\",\"bankCorr1\":\"bankCorr1-819\",\"bankCorr1Acc\":\"bankCorr1Acc-579\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-528\",\"bankCorr3\":\"bankCorr3-627\",\"bankCorr3Acc\":\"bankCorr3Acc-986\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-521\",\"bankCorr4\":\"bankCorr4-269\",\"bankCorr4Acc\":\"bankCorr4Acc-776\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-506\",\"bankInfo\":\"bankInfo-875\",\"bdeRecVersion\":7384,\"benef\":\"benef-956\",\"benefAcc\":\"benefAcc-308\",\"benefIban\":\"FR81596952848514957\",\"benefInfo\":\"benefInfo-974\",\"benefRefNr\":\"benefRefNr-149\",\"bookTextCred\":\"bookTextCred-445\",\"bookTextDeb\":\"bookTextDeb-400\",\"bulkItemIdent\":\"bulkItemIdent-630\",\"destCountry\":{\"id\":7,\"ident\":\"US\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-969\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-156\",\"hasPostit\":true,\"instrAmount\":959714.72,\"intlRefNr\":\"intlRefNr-520\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"GB1243069084\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-634\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-301\",\"ordBankAcc\":\"ordBankAcc-369\",\"ordBankClearNr\":\"ordBankClearNr-947\",\"ordRef\":\"ordRef-968\",\"orderDate\":\"2026-03-17\",\"orderNr\":2525,\"orderedBy\":\"orderedBy-108\",\"orderedByAcc\":\"orderedByAcc-244\",\"origGrpRef\":\"origGrpRef-975\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-922\",\"stordPeriodEnd\":\"stordPeriodEnd-190\",\"stordPeriodStart\":\"stordPeriodStart-165\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+44908249043\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [367] GET /doc-pays/{id} — Payment API
run_request "[367] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [368] PATCH /doc-pays/{id} — Payment API
run_request "[368] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":8391,\"amount\":234436.05,\"bank\":\"bank-418\",\"bankAcc\":\"bankAcc-679\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-367\",\"bankCorr1\":\"bankCorr1-247\",\"bankCorr1Acc\":\"bankCorr1Acc-284\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-502\",\"bankCorr3\":\"bankCorr3-916\",\"bankCorr3Acc\":\"bankCorr3Acc-212\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-464\",\"bankCorr4\":\"bankCorr4-954\",\"bankCorr4Acc\":\"bankCorr4Acc-352\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-610\",\"bankInfo\":\"bankInfo-809\",\"bdeRecVersion\":3439,\"benef\":\"benef-961\",\"benefAcc\":\"benefAcc-252\",\"benefIban\":\"FR68570888593401725\",\"benefInfo\":\"benefInfo-912\",\"benefRefNr\":\"benefRefNr-220\",\"bookTextCred\":\"bookTextCred-204\",\"bookTextDeb\":\"bookTextDeb-702\",\"bulkItemIdent\":\"bulkItemIdent-177\",\"destCountry\":{\"id\":7,\"ident\":\"US\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-756\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-533\",\"hasPostit\":true,\"instrAmount\":886185.48,\"intlRefNr\":\"intlRefNr-743\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"US8216700274\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-707\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-291\",\"ordBankAcc\":\"ordBankAcc-814\",\"ordBankClearNr\":\"ordBankClearNr-845\",\"ordRef\":\"ordRef-178\",\"orderDate\":\"2026-03-17\",\"orderNr\":7172,\"orderedBy\":\"orderedBy-415\",\"orderedByAcc\":\"orderedByAcc-170\",\"origGrpRef\":\"origGrpRef-964\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-134\",\"stordPeriodEnd\":\"stordPeriodEnd-285\",\"stordPeriodStart\":\"stordPeriodStart-437\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39214596164\"}"

# [369] GET /doc-realsecs/{id} — Real Security API
run_request "[369] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [370] POST /doc-realtys — Realty API
run_request "[370] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":5943,\"bdeRecVersion\":1073,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-449\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-962\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-135\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-397\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5593,\"orderedBy\":\"orderedBy-632\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [371] GET /doc-realtys/{id} — Realty API
run_request "[371] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [372] PATCH /doc-realtys/{id} — Realty API
run_request "[372] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":8780,\"bdeRecVersion\":5700,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-118\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-662\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-679\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-465\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3076,\"orderedBy\":\"orderedBy-955\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [373] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[373] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":7189,\"bdeRecVersion\":36,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-329\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-689\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-998\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-240\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7171,\"orderedBy\":\"orderedBy-520\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [374] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[374] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [375] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[375] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":5086,\"bdeRecVersion\":8282,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-979\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-260\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-904\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-755\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9217,\"orderedBy\":\"orderedBy-869\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [376] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[376] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [377] POST /doc-rebalss — Rebalancer Order API
run_request "[377] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":8677,\"bdeRecVersion\":8637,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-311\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-110\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-349\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-719\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9211,\"orderedBy\":\"orderedBy-442\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [378] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[378] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [379] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[379] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":8077,\"bdeRecVersion\":1965,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-562\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-623\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-802\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-976\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6221,\"orderedBy\":\"orderedBy-421\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [380] GET /doc-repocs/{id} — Repo Contract API
run_request "[380] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [1065] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[1065] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [1066] POST /doc-ctact2s — Contact Management (V2) API
run_request "[1066] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":6225,\"attch\":\"attch-291\",\"attchA\":true,\"bdeRecVersion\":5233,\"campgnCltReaction\":\"campgnCltReaction-916\",\"campgnRespKey\":\"campgnRespKey-361\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-484\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-837\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-477\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-665\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-206\",\"linkDocListA\":true,\"loc\":\"loc-692\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1180,\"orderedBy\":\"orderedBy-734\",\"particListA\":true,\"questrSeqNr\":5396,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":394,\"reactComment\":\"reactComment-733\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-493\",\"reactNrPartic\":9761,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-982\",\"subjA\":true,\"syncSeqNr\":724,\"totExpndTimeM\":3445,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1067] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1067] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [1068] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1068] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":7074,\"attch\":\"attch-400\",\"attchA\":true,\"bdeRecVersion\":729,\"campgnCltReaction\":\"campgnCltReaction-958\",\"campgnRespKey\":\"campgnRespKey-575\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-684\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-519\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-584\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-491\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-431\",\"linkDocListA\":true,\"loc\":\"loc-539\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9460,\"orderedBy\":\"orderedBy-114\",\"particListA\":true,\"questrSeqNr\":2542,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":1090,\"reactComment\":\"reactComment-947\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-140\",\"reactNrPartic\":4920,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-294\",\"subjA\":true,\"syncSeqNr\":1810,\"totExpndTimeM\":3027,\"trxDate\":\"2026-03-17\"}"

# [1069] GET /doc-cmgs/{id} — Cashier Management API
run_request "[1069] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [1070] GET /doc-cops/{id} — Cashier Operations API
run_request "[1070] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [1071] POST /doc-clts — Client Opening API
run_request "[1071] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1072] GET /doc-clts/{id} — Client Opening API
run_request "[1072] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [1073] PATCH /doc-clts/{id} — Client Opening API
run_request "[1073] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [1074] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[1074] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [1075] GET /doc-cltms/{id} — Collateral Movement API
run_request "[1075] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [1076] GET /doc-cords/{id} — Collective Order API
run_request "[1076] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [1077] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[1077] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [1078] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[1078] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [1079] POST /doc-xioms — External Investment Order Manager API
run_request "[1079] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":4825,\"bdeRecVersion\":7028,\"bpLevelRep\":true,\"descn\":\"descn-526\",\"extlRefNr\":\"extlRefNr-985\",\"extlRepLang\":\"extlRepLang-831\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-276\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-784\",\"linkGrp\":1816,\"orderDate\":\"2026-03-17\",\"orderNr\":7916,\"orderedBy\":\"orderedBy-593\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1080] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[1080] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [1081] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[1081] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":3130,\"bdeRecVersion\":6361,\"bpLevelRep\":true,\"descn\":\"descn-517\",\"extlRefNr\":\"extlRefNr-313\",\"extlRepLang\":\"extlRepLang-957\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-713\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-310\",\"linkGrp\":6342,\"orderDate\":\"2026-03-17\",\"orderNr\":8544,\"orderedBy\":\"orderedBy-762\",\"sendRepToEbank\":true}"

# [1082] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[1082] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [1083] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[1083] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [1084] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[1084] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [1085] POST /doc-fxsws — FX Swap API
run_request "[1085] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-387\",\"bdeRecVersion\":3713,\"buyBookText1\":\"buyBookText1-755\",\"buyBookText2\":\"buyBookText2-391\",\"buyQty1\":4629,\"buyQty2\":515,\"cfi\":\"cfi-594\",\"dealFwdRate1\":6.758,\"dealFwdRate2\":0.753,\"dealSpotRate1\":0.137,\"dealSpotRate2\":1.417,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE1526855680\",\"lastTrans\":\"lastTrans-474\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-860\",\"period1\":\"period1-870\",\"period2\":\"period2-292\",\"sellBookText1\":\"sellBookText1-799\",\"sellBookText2\":\"sellBookText2-461\",\"sellQty1\":5823,\"sellQty2\":1179,\"spotDate\":\"2026-03-17\",\"trdrRate1\":5.075,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1086] GET /doc-fxsws/{id} — FX Swap API
run_request "[1086] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [1087] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[1087] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-718\",\"bdeRecVersion\":9685,\"buyBookText1\":\"buyBookText1-509\",\"buyBookText2\":\"buyBookText2-952\",\"buyQty1\":5686,\"buyQty2\":8596,\"cfi\":\"cfi-794\",\"dealFwdRate1\":7.836,\"dealFwdRate2\":5.33,\"dealSpotRate1\":4.906,\"dealSpotRate2\":2.65,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE3185105102\",\"lastTrans\":\"lastTrans-975\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-333\",\"period1\":\"period1-270\",\"period2\":\"period2-175\",\"sellBookText1\":\"sellBookText1-659\",\"sellBookText2\":\"sellBookText2-456\",\"sellQty1\":2652,\"sellQty2\":9039,\"spotDate\":\"2026-03-17\",\"trdrRate1\":3.252,\"trxDate\":\"2026-03-17\"}"

# [1088] POST /doc-fxtrs — FXTR API
run_request "[1088] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4817,\"advText\":\"advText-439\",\"bdeRecVersion\":2151,\"buyQty\":2101,\"dealFwdRate\":7.829,\"dealSpotRate\":0.635,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-235\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-713\",\"fwdSpread\":9600,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-599\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-458\",\"limit\":5686,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4737,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7821,\"orderedBy\":\"orderedBy-221\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-296\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":619,\"settlePlanA\":true,\"spotSpread1\":6422,\"spotSpread2\":5516,\"trdrRate\":0.884,\"trigPrice\":4388,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39694432736\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1089] GET /doc-fxtrs/{id} — FXTR API
run_request "[1089] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [1090] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[1090] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":9428,\"advText\":\"advText-422\",\"bdeRecVersion\":7238,\"buyQty\":8436,\"dealFwdRate\":7.644,\"dealSpotRate\":4.791,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-551\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-116\",\"fwdSpread\":7521,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-240\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-711\",\"limit\":115,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4799,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7214,\"orderedBy\":\"orderedBy-294\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-761\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":2419,\"settlePlanA\":true,\"spotSpread1\":3670,\"spotSpread2\":2607,\"trdrRate\":4.838,\"trigPrice\":3893,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+41967181812\"}"

# [1091] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[1091] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [1092] POST /doc-inpays — Incoming Payment API
run_request "[1092] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":3662,\"amount\":459756.22,\"bankClearNr\":\"bankClearNr-683\",\"bankInfo\":\"bankInfo-495\",\"bdeRecVersion\":6689,\"benefAcc\":\"benefAcc-911\",\"benefRefNr\":\"benefRefNr-467\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-366\",\"contrPeriodStart\":\"contrPeriodStart-354\",\"credAddr\":\"credAddr-202\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-252\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-191\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-323\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-944\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-386\",\"orderDate\":\"2026-03-17\",\"orderNr\":4704,\"orderedBy\":\"orderedBy-561\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-253\",\"payerAddrTxt\":\"payerAddrTxt-925\",\"payerIban\":\"AT58949473215834239\",\"payerInfo\":\"payerInfo-119\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-461\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1093] GET /doc-inpays/{id} — Incoming Payment API
run_request "[1093] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [1094] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[1094] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":4340,\"amount\":497401.95,\"bankClearNr\":\"bankClearNr-312\",\"bankInfo\":\"bankInfo-311\",\"bdeRecVersion\":712,\"benefAcc\":\"benefAcc-663\",\"benefRefNr\":\"benefRefNr-802\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-780\",\"contrPeriodStart\":\"contrPeriodStart-531\",\"credAddr\":\"credAddr-102\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-830\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-920\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-124\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-212\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-599\",\"orderDate\":\"2026-03-17\",\"orderNr\":4030,\"orderedBy\":\"orderedBy-216\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payerAcc\":\"payerAcc-321\",\"payerAddrTxt\":\"payerAddrTxt-669\",\"payerIban\":\"IT60350536739656054\",\"payerInfo\":\"payerInfo-330\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-141\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1095] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[1095] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [1096] GET /doc-intrs/{id} — Interest API
run_request "[1096] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [1097] POST /doc-invst-bdls — Investment Bundler API
run_request "[1097] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":1385,\"bdeRecVersion\":521,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-161\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-183\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-305\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-310\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":634,\"orderedBy\":\"orderedBy-591\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":1699,\"remnBaccBalMin\":4484,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1098] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1098] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [1099] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1099] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":8451,\"bdeRecVersion\":313,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-447\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-596\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-713\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-674\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4373,\"orderedBy\":\"orderedBy-379\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":6826,\"remnBaccBalMin\":4246,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1100] POST /doc-crm-issues — Issue Management API
run_request "[1100] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-163\",\"advNr\":4374,\"allDayEvt\":true,\"attch\":\"attch-736\",\"bdeRecVersion\":2088,\"campgnTaskSeqNr\":1919,\"descn\":\"descn-333\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-649\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-699\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-246\",\"findingKey\":\"findingKey-297\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-892\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-642\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-185\",\"location\":\"location-606\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7043,\"orderedBy\":\"orderedBy-424\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5006,\"qtyLinked\":6718,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-729\",\"subject\":\"subject-325\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-224\",\"undefBp\":\"undefBp-464\",\"val\":7585,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1101] GET /doc-crm-issues/{id} — Issue Management API
run_request "[1101] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [1102] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[1102] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-849\",\"advNr\":6131,\"allDayEvt\":true,\"attch\":\"attch-712\",\"bdeRecVersion\":6353,\"campgnTaskSeqNr\":3752,\"descn\":\"descn-924\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-429\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-227\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-783\",\"findingKey\":\"findingKey-764\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-997\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-655\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-478\",\"location\":\"location-469\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8096,\"orderedBy\":\"orderedBy-726\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":7429,\"qtyLinked\":7304,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-428\",\"subject\":\"subject-301\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-371\",\"undefBp\":\"undefBp-548\",\"val\":4649,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1103] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[1103] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [1104] GET /doc-letters/{id} — Letter API
run_request "[1104] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [1105] POST /doc-limits — Limit API
run_request "[1105] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":8856,\"advTextCred\":\"advTextCred-406\",\"advTextDeb\":\"advTextDeb-937\",\"amount\":967808.69,\"bdeRecVersion\":3152,\"bookTextCred\":\"bookTextCred-327\",\"bookTextDeb\":\"bookTextDeb-486\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-172\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-363\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-271\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-253\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-447\",\"nextReview\":\"nextReview-190\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2298,\"orderedBy\":\"orderedBy-714\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1106] GET /doc-limits/{id} — Limit API
run_request "[1106] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [1107] PATCH /doc-limits/{id} — Limit API
run_request "[1107] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":882,\"advTextCred\":\"advTextCred-472\",\"advTextDeb\":\"advTextDeb-283\",\"amount\":803676.79,\"bdeRecVersion\":9096,\"bookTextCred\":\"bookTextCred-318\",\"bookTextDeb\":\"bookTextDeb-779\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-633\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-948\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-298\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-487\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-955\",\"nextReview\":\"nextReview-502\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2345,\"orderedBy\":\"orderedBy-270\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1108] POST /doc-loans — Loan API
run_request "[1108] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":7547,\"advTextCred\":\"advTextCred-494\",\"advTextDeb\":\"advTextDeb-354\",\"bdeRecVersion\":1617,\"bookTextCred\":\"bookTextCred-243\",\"bookTextDeb\":\"bookTextDeb-648\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-239\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-744\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-866\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-147\",\"intrGradManMarkup\":8033,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-988\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":612,\"orderedBy\":\"orderedBy-694\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2003,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1109] GET /doc-loans/{id} — Loan API
run_request "[1109] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [1110] PATCH /doc-loans/{id} — Loan API
run_request "[1110] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":5504,\"advTextCred\":\"advTextCred-975\",\"advTextDeb\":\"advTextDeb-236\",\"bdeRecVersion\":2541,\"bookTextCred\":\"bookTextCred-761\",\"bookTextDeb\":\"bookTextDeb-159\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-491\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-591\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-535\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-247\",\"intrGradManMarkup\":7859,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-716\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3898,\"orderedBy\":\"orderedBy-737\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2158,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1111] POST /doc-mass-settles — Mass Settlement API
run_request "[1111] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":5204,\"autoFillList\":true,\"bdeRecVersion\":233,\"benefBpText\":\"benefBpText-258\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-871\",\"destBankBic\":\"CRESCHZZ80A\",\"destBankBpText\":\"destBankBpText-834\",\"destBankClr\":\"destBankClr-971\",\"destBankText\":\"destBankText-591\",\"destBenefText\":\"destBenefText-149\",\"destInfo\":\"destInfo-381\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-707\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-396\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-908\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-631\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":502,\"orderedBy\":\"orderedBy-946\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1112] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[1112] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [1113] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[1113] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":7710,\"autoFillList\":true,\"bdeRecVersion\":741,\"benefBpText\":\"benefBpText-587\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-508\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-728\",\"destBankClr\":\"destBankClr-774\",\"destBankText\":\"destBankText-855\",\"destBenefText\":\"destBenefText-709\",\"destInfo\":\"destInfo-977\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-683\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-764\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-785\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-606\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5017,\"orderedBy\":\"orderedBy-976\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1114] POST /doc-mmkts — Money Market API
run_request "[1114] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":3092,\"bdeRecVersion\":62,\"capt\":2621,\"dcdStrike\":3040,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-312\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-612\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-978\",\"intrRate\":8.301,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-108\",\"maturityDate\":\"2026-03-17\",\"mktRate\":2.076,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9695,\"orderedBy\":\"orderedBy-575\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":3826,\"respBpA\":true,\"respObjA\":true,\"rmRate\":0.748,\"settlePlanA\":true,\"trdrRate\":8.244,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1115] GET /doc-mmkts/{id} — Money Market API
run_request "[1115] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [1116] PATCH /doc-mmkts/{id} — Money Market API
run_request "[1116] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":3999,\"bdeRecVersion\":9112,\"capt\":7898,\"dcdStrike\":1435,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-405\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-960\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-725\",\"intrRate\":3.001,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-960\",\"maturityDate\":\"2026-03-17\",\"mktRate\":1.316,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8644,\"orderedBy\":\"orderedBy-772\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5909,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.097,\"settlePlanA\":true,\"trdrRate\":2.112,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1117] POST /doc-xfermons — Money Transfer API
run_request "[1117] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":2058,\"amount\":354555.97,\"bdeRecVersion\":6511,\"bulkItemIdent\":\"bulkItemIdent-267\",\"credAdvText\":\"credAdvText-526\",\"credBookText\":\"credBookText-799\",\"debAdvText\":\"debAdvText-382\",\"debBookText\":\"debBookText-803\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-498\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-931\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-780\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-457\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1238,\"orderedBy\":\"orderedBy-221\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1118] GET /doc-xfermons/{id} — Money Transfer API
run_request "[1118] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [1119] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[1119] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":4664,\"amount\":214252.24,\"bdeRecVersion\":9075,\"bulkItemIdent\":\"bulkItemIdent-368\",\"credAdvText\":\"credAdvText-726\",\"credBookText\":\"credBookText-845\",\"debAdvText\":\"debAdvText-978\",\"debBookText\":\"debBookText-613\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-234\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-803\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-373\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-447\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7153,\"orderedBy\":\"orderedBy-296\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1120] POST /doc-oofxs — OTC FX Option API
run_request "[1120] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":2130,\"advTextCred\":\"advTextCred-856\",\"advTextDeb\":\"advTextDeb-252\",\"bdeRecVersion\":545,\"bookTextCred\":\"bookTextCred-939\",\"bookTextDeb\":\"bookTextDeb-348\",\"callQty\":3112,\"cutOffTime\":\"cutOffTime-949\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-678\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-148\",\"gross\":\"gross-465\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-968\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-129\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3172,\"orderedBy\":\"orderedBy-670\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-287\",\"putQty\":9477,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-194\",\"spread2\":\"spread2-836\",\"strike\":2612,\"strikePict\":2996,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1121] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[1121] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [1122] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[1122] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":4612,\"advTextCred\":\"advTextCred-131\",\"advTextDeb\":\"advTextDeb-365\",\"bdeRecVersion\":7105,\"bookTextCred\":\"bookTextCred-986\",\"bookTextDeb\":\"bookTextDeb-295\",\"callQty\":4181,\"cutOffTime\":\"cutOffTime-424\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-480\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-874\",\"gross\":\"gross-946\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-268\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-138\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8397,\"orderedBy\":\"orderedBy-175\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-402\",\"putQty\":7758,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-935\",\"spread2\":\"spread2-993\",\"strike\":8,\"strikePict\":4836,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1123] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[1123] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [1124] GET /doc-otcopts/{id} — OTC Option API
run_request "[1124] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [1125] GET /doc-othsecs/{id} — Other Security API
run_request "[1125] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [1126] POST /doc-pays — Payment API
run_request "[1126] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":1070,\"amount\":701806.14,\"bank\":\"bank-792\",\"bankAcc\":\"bankAcc-798\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-464\",\"bankCorr1\":\"bankCorr1-650\",\"bankCorr1Acc\":\"bankCorr1Acc-834\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-984\",\"bankCorr3\":\"bankCorr3-588\",\"bankCorr3Acc\":\"bankCorr3Acc-967\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-915\",\"bankCorr4\":\"bankCorr4-668\",\"bankCorr4Acc\":\"bankCorr4Acc-762\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-456\",\"bankInfo\":\"bankInfo-216\",\"bdeRecVersion\":8479,\"benef\":\"benef-280\",\"benefAcc\":\"benefAcc-232\",\"benefIban\":\"FR40245890627702875\",\"benefInfo\":\"benefInfo-826\",\"benefRefNr\":\"benefRefNr-684\",\"bookTextCred\":\"bookTextCred-294\",\"bookTextDeb\":\"bookTextDeb-677\",\"bulkItemIdent\":\"bulkItemIdent-307\",\"destCountry\":{\"id\":2,\"ident\":\"DE\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-967\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-104\",\"hasPostit\":true,\"instrAmount\":399447.94,\"intlRefNr\":\"intlRefNr-307\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"GB8481689545\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-811\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-378\",\"ordBankAcc\":\"ordBankAcc-498\",\"ordBankClearNr\":\"ordBankClearNr-413\",\"ordRef\":\"ordRef-605\",\"orderDate\":\"2026-03-17\",\"orderNr\":3396,\"orderedBy\":\"orderedBy-229\",\"orderedByAcc\":\"orderedByAcc-285\",\"origGrpRef\":\"origGrpRef-165\",\"originCountry\":{\"id\":2,\"ident\":\"DE\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-498\",\"stordPeriodEnd\":\"stordPeriodEnd-715\",\"stordPeriodStart\":\"stordPeriodStart-463\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49290524569\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1127] GET /doc-pays/{id} — Payment API
run_request "[1127] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [1128] PATCH /doc-pays/{id} — Payment API
run_request "[1128] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":5824,\"amount\":561086.74,\"bank\":\"bank-585\",\"bankAcc\":\"bankAcc-530\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-521\",\"bankCorr1\":\"bankCorr1-591\",\"bankCorr1Acc\":\"bankCorr1Acc-193\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-876\",\"bankCorr3\":\"bankCorr3-258\",\"bankCorr3Acc\":\"bankCorr3Acc-851\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-437\",\"bankCorr4\":\"bankCorr4-180\",\"bankCorr4Acc\":\"bankCorr4Acc-638\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-785\",\"bankInfo\":\"bankInfo-136\",\"bdeRecVersion\":2292,\"benef\":\"benef-258\",\"benefAcc\":\"benefAcc-461\",\"benefIban\":\"FR87726131629385606\",\"benefInfo\":\"benefInfo-673\",\"benefRefNr\":\"benefRefNr-157\",\"bookTextCred\":\"bookTextCred-814\",\"bookTextDeb\":\"bookTextDeb-391\",\"bulkItemIdent\":\"bulkItemIdent-379\",\"destCountry\":{\"id\":5,\"ident\":\"AT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-584\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-644\",\"hasPostit\":true,\"instrAmount\":976495.67,\"intlRefNr\":\"intlRefNr-156\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"US4034500035\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-276\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-467\",\"ordBankAcc\":\"ordBankAcc-861\",\"ordBankClearNr\":\"ordBankClearNr-667\",\"ordRef\":\"ordRef-458\",\"orderDate\":\"2026-03-17\",\"orderNr\":756,\"orderedBy\":\"orderedBy-511\",\"orderedByAcc\":\"orderedByAcc-893\",\"origGrpRef\":\"origGrpRef-897\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-257\",\"stordPeriodEnd\":\"stordPeriodEnd-921\",\"stordPeriodStart\":\"stordPeriodStart-466\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49910962156\"}"

# [1129] GET /doc-realsecs/{id} — Real Security API
run_request "[1129] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [1130] POST /doc-realtys — Realty API
run_request "[1130] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":3393,\"bdeRecVersion\":1974,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-376\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-682\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-996\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-377\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6416,\"orderedBy\":\"orderedBy-748\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1131] GET /doc-realtys/{id} — Realty API
run_request "[1131] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [1132] PATCH /doc-realtys/{id} — Realty API
run_request "[1132] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":3678,\"bdeRecVersion\":9411,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-130\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-640\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-607\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-884\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1509,\"orderedBy\":\"orderedBy-871\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1133] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[1133] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":7990,\"bdeRecVersion\":1880,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-764\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-915\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-130\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-795\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5042,\"orderedBy\":\"orderedBy-687\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1134] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1134] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [1135] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1135] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":124,\"bdeRecVersion\":4167,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-598\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-756\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-685\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-201\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7450,\"orderedBy\":\"orderedBy-770\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1136] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[1136] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [1137] POST /doc-rebalss — Rebalancer Order API
run_request "[1137] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":5433,\"bdeRecVersion\":5903,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-438\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-561\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-975\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-829\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8750,\"orderedBy\":\"orderedBy-992\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1138] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[1138] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [1139] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[1139] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":3247,\"bdeRecVersion\":3933,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-985\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-749\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-691\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-837\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1735,\"orderedBy\":\"orderedBy-611\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1140] GET /doc-repocs/{id} — Repo Contract API
run_request "[1140] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [1521] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[1521] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [1522] POST /doc-ctact2s — Contact Management (V2) API
run_request "[1522] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":6580,\"attch\":\"attch-907\",\"attchA\":true,\"bdeRecVersion\":7146,\"campgnCltReaction\":\"campgnCltReaction-515\",\"campgnRespKey\":\"campgnRespKey-338\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-880\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-616\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-472\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-995\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-493\",\"linkDocListA\":true,\"loc\":\"loc-888\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5621,\"orderedBy\":\"orderedBy-400\",\"particListA\":true,\"questrSeqNr\":6704,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":8895,\"reactComment\":\"reactComment-856\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-628\",\"reactNrPartic\":6936,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-936\",\"subjA\":true,\"syncSeqNr\":5424,\"totExpndTimeM\":8304,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1523] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1523] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [1524] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1524] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":4613,\"attch\":\"attch-376\",\"attchA\":true,\"bdeRecVersion\":7075,\"campgnCltReaction\":\"campgnCltReaction-953\",\"campgnRespKey\":\"campgnRespKey-928\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-636\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-834\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-699\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-188\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-556\",\"linkDocListA\":true,\"loc\":\"loc-634\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9636,\"orderedBy\":\"orderedBy-644\",\"particListA\":true,\"questrSeqNr\":1368,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":3300,\"reactComment\":\"reactComment-483\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-157\",\"reactNrPartic\":3485,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-310\",\"subjA\":true,\"syncSeqNr\":9820,\"totExpndTimeM\":1943,\"trxDate\":\"2026-03-17\"}"

# [1525] GET /doc-cmgs/{id} — Cashier Management API
run_request "[1525] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [1526] GET /doc-cops/{id} — Cashier Operations API
run_request "[1526] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [1527] POST /doc-clts — Client Opening API
run_request "[1527] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1528] GET /doc-clts/{id} — Client Opening API
run_request "[1528] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [1529] PATCH /doc-clts/{id} — Client Opening API
run_request "[1529] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [1530] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[1530] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [1531] GET /doc-cltms/{id} — Collateral Movement API
run_request "[1531] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [1532] GET /doc-cords/{id} — Collective Order API
run_request "[1532] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [1533] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[1533] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [1534] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[1534] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [1535] POST /doc-xioms — External Investment Order Manager API
run_request "[1535] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":6255,\"bdeRecVersion\":261,\"bpLevelRep\":true,\"descn\":\"descn-166\",\"extlRefNr\":\"extlRefNr-790\",\"extlRepLang\":\"extlRepLang-473\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-438\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-520\",\"linkGrp\":5649,\"orderDate\":\"2026-03-17\",\"orderNr\":6347,\"orderedBy\":\"orderedBy-272\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1536] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[1536] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [1537] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[1537] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":9912,\"bdeRecVersion\":7025,\"bpLevelRep\":true,\"descn\":\"descn-493\",\"extlRefNr\":\"extlRefNr-522\",\"extlRepLang\":\"extlRepLang-673\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-380\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-528\",\"linkGrp\":2165,\"orderDate\":\"2026-03-17\",\"orderNr\":6474,\"orderedBy\":\"orderedBy-535\",\"sendRepToEbank\":true}"

# [1538] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[1538] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [1539] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[1539] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [1540] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[1540] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [1541] POST /doc-fxsws — FX Swap API
run_request "[1541] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-169\",\"bdeRecVersion\":9961,\"buyBookText1\":\"buyBookText1-758\",\"buyBookText2\":\"buyBookText2-472\",\"buyQty1\":7660,\"buyQty2\":6760,\"cfi\":\"cfi-401\",\"dealFwdRate1\":1.68,\"dealFwdRate2\":7.784,\"dealSpotRate1\":3.736,\"dealSpotRate2\":1.757,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH3986735774\",\"lastTrans\":\"lastTrans-815\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-900\",\"period1\":\"period1-379\",\"period2\":\"period2-555\",\"sellBookText1\":\"sellBookText1-254\",\"sellBookText2\":\"sellBookText2-224\",\"sellQty1\":3297,\"sellQty2\":7715,\"spotDate\":\"2026-03-17\",\"trdrRate1\":7.262,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1542] GET /doc-fxsws/{id} — FX Swap API
run_request "[1542] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [1543] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[1543] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-546\",\"bdeRecVersion\":2104,\"buyBookText1\":\"buyBookText1-225\",\"buyBookText2\":\"buyBookText2-260\",\"buyQty1\":6249,\"buyQty2\":374,\"cfi\":\"cfi-809\",\"dealFwdRate1\":6.302,\"dealFwdRate2\":6.153,\"dealSpotRate1\":7.872,\"dealSpotRate2\":0.277,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US6454938691\",\"lastTrans\":\"lastTrans-330\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-271\",\"period1\":\"period1-230\",\"period2\":\"period2-312\",\"sellBookText1\":\"sellBookText1-417\",\"sellBookText2\":\"sellBookText2-186\",\"sellQty1\":6397,\"sellQty2\":2941,\"spotDate\":\"2026-03-17\",\"trdrRate1\":3.253,\"trxDate\":\"2026-03-17\"}"

# [1544] POST /doc-fxtrs — FXTR API
run_request "[1544] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":9192,\"advText\":\"advText-386\",\"bdeRecVersion\":9486,\"buyQty\":6249,\"dealFwdRate\":8.398,\"dealSpotRate\":1.159,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-226\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-784\",\"fwdSpread\":9330,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-445\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-295\",\"limit\":8156,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":869,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6176,\"orderedBy\":\"orderedBy-668\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-822\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":2893,\"settlePlanA\":true,\"spotSpread1\":72,\"spotSpread2\":4540,\"trdrRate\":3.489,\"trigPrice\":1210,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44614113013\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1545] GET /doc-fxtrs/{id} — FXTR API
run_request "[1545] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [1546] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[1546] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":6053,\"advText\":\"advText-980\",\"bdeRecVersion\":697,\"buyQty\":2449,\"dealFwdRate\":7.48,\"dealSpotRate\":7.346,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-862\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-875\",\"fwdSpread\":3917,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-847\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-390\",\"limit\":5326,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":2523,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2523,\"orderedBy\":\"orderedBy-949\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-952\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8230,\"settlePlanA\":true,\"spotSpread1\":6804,\"spotSpread2\":2676,\"trdrRate\":6.086,\"trigPrice\":2219,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39230402552\"}"

# [1547] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[1547] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [1548] POST /doc-inpays — Incoming Payment API
run_request "[1548] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":1369,\"amount\":421826.18,\"bankClearNr\":\"bankClearNr-974\",\"bankInfo\":\"bankInfo-327\",\"bdeRecVersion\":3249,\"benefAcc\":\"benefAcc-410\",\"benefRefNr\":\"benefRefNr-485\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-457\",\"contrPeriodStart\":\"contrPeriodStart-121\",\"credAddr\":\"credAddr-942\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-264\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-820\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-232\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-843\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-524\",\"orderDate\":\"2026-03-17\",\"orderNr\":1041,\"orderedBy\":\"orderedBy-433\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payerAcc\":\"payerAcc-280\",\"payerAddrTxt\":\"payerAddrTxt-320\",\"payerIban\":\"AT10808176870243760\",\"payerInfo\":\"payerInfo-577\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-486\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1549] GET /doc-inpays/{id} — Incoming Payment API
run_request "[1549] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [1550] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[1550] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":4260,\"amount\":93491.77,\"bankClearNr\":\"bankClearNr-258\",\"bankInfo\":\"bankInfo-800\",\"bdeRecVersion\":8997,\"benefAcc\":\"benefAcc-433\",\"benefRefNr\":\"benefRefNr-134\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-432\",\"contrPeriodStart\":\"contrPeriodStart-756\",\"credAddr\":\"credAddr-928\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-628\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-890\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-732\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-458\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-871\",\"orderDate\":\"2026-03-17\",\"orderNr\":2225,\"orderedBy\":\"orderedBy-622\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payerAcc\":\"payerAcc-908\",\"payerAddrTxt\":\"payerAddrTxt-724\",\"payerIban\":\"AT97117529463660342\",\"payerInfo\":\"payerInfo-876\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-988\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1551] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[1551] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [1552] GET /doc-intrs/{id} — Interest API
run_request "[1552] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [1553] POST /doc-invst-bdls — Investment Bundler API
run_request "[1553] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":6596,\"bdeRecVersion\":9592,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-680\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-467\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-484\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-292\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7635,\"orderedBy\":\"orderedBy-134\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":2180,\"remnBaccBalMin\":2498,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1554] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1554] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [1555] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1555] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":6846,\"bdeRecVersion\":386,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-660\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-110\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-788\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-658\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6197,\"orderedBy\":\"orderedBy-750\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":2040,\"remnBaccBalMin\":1804,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1556] POST /doc-crm-issues — Issue Management API
run_request "[1556] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-669\",\"advNr\":879,\"allDayEvt\":true,\"attch\":\"attch-814\",\"bdeRecVersion\":5875,\"campgnTaskSeqNr\":3242,\"descn\":\"descn-654\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-631\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-309\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-846\",\"findingKey\":\"findingKey-497\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-850\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-855\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-155\",\"location\":\"location-744\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7494,\"orderedBy\":\"orderedBy-839\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9566,\"qtyLinked\":8836,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-181\",\"subject\":\"subject-876\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-526\",\"undefBp\":\"undefBp-417\",\"val\":3398,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1557] GET /doc-crm-issues/{id} — Issue Management API
run_request "[1557] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [1558] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[1558] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-468\",\"advNr\":7829,\"allDayEvt\":true,\"attch\":\"attch-535\",\"bdeRecVersion\":3740,\"campgnTaskSeqNr\":19,\"descn\":\"descn-412\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-924\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-224\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-120\",\"findingKey\":\"findingKey-421\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-283\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-884\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-280\",\"location\":\"location-859\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2344,\"orderedBy\":\"orderedBy-233\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9277,\"qtyLinked\":2113,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-760\",\"subject\":\"subject-333\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-704\",\"undefBp\":\"undefBp-602\",\"val\":8477,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1559] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[1559] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [1560] GET /doc-letters/{id} — Letter API
run_request "[1560] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [1561] POST /doc-limits — Limit API
run_request "[1561] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":5960,\"advTextCred\":\"advTextCred-840\",\"advTextDeb\":\"advTextDeb-722\",\"amount\":138062.29,\"bdeRecVersion\":8755,\"bookTextCred\":\"bookTextCred-496\",\"bookTextDeb\":\"bookTextDeb-559\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-480\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-211\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-918\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-104\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-960\",\"nextReview\":\"nextReview-107\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6677,\"orderedBy\":\"orderedBy-956\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1562] GET /doc-limits/{id} — Limit API
run_request "[1562] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [1563] PATCH /doc-limits/{id} — Limit API
run_request "[1563] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":1938,\"advTextCred\":\"advTextCred-481\",\"advTextDeb\":\"advTextDeb-286\",\"amount\":763534.5,\"bdeRecVersion\":643,\"bookTextCred\":\"bookTextCred-881\",\"bookTextDeb\":\"bookTextDeb-452\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-698\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-467\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-319\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-520\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-908\",\"nextReview\":\"nextReview-692\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7269,\"orderedBy\":\"orderedBy-958\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1564] POST /doc-loans — Loan API
run_request "[1564] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":8555,\"advTextCred\":\"advTextCred-226\",\"advTextDeb\":\"advTextDeb-135\",\"bdeRecVersion\":8967,\"bookTextCred\":\"bookTextCred-854\",\"bookTextDeb\":\"bookTextDeb-645\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-204\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-974\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-706\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-507\",\"intrGradManMarkup\":7498,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-345\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7575,\"orderedBy\":\"orderedBy-113\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6625,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1565] GET /doc-loans/{id} — Loan API
run_request "[1565] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [1566] PATCH /doc-loans/{id} — Loan API
run_request "[1566] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":8724,\"advTextCred\":\"advTextCred-394\",\"advTextDeb\":\"advTextDeb-104\",\"bdeRecVersion\":5427,\"bookTextCred\":\"bookTextCred-266\",\"bookTextDeb\":\"bookTextDeb-408\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-549\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-806\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-626\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-309\",\"intrGradManMarkup\":6211,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-993\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3175,\"orderedBy\":\"orderedBy-427\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5998,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1567] POST /doc-mass-settles — Mass Settlement API
run_request "[1567] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":6119,\"autoFillList\":true,\"bdeRecVersion\":2242,\"benefBpText\":\"benefBpText-319\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-795\",\"destBankBic\":\"DEUTDEDB\",\"destBankBpText\":\"destBankBpText-687\",\"destBankClr\":\"destBankClr-318\",\"destBankText\":\"destBankText-369\",\"destBenefText\":\"destBenefText-693\",\"destInfo\":\"destInfo-481\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-973\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-906\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-789\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-934\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1571,\"orderedBy\":\"orderedBy-471\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1568] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[1568] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [1569] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[1569] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":6324,\"autoFillList\":true,\"bdeRecVersion\":4802,\"benefBpText\":\"benefBpText-979\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-878\",\"destBankBic\":\"BFGEIT3F\",\"destBankBpText\":\"destBankBpText-129\",\"destBankClr\":\"destBankClr-419\",\"destBankText\":\"destBankText-616\",\"destBenefText\":\"destBenefText-794\",\"destInfo\":\"destInfo-353\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-896\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-443\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-997\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-226\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7895,\"orderedBy\":\"orderedBy-741\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1570] POST /doc-mmkts — Money Market API
run_request "[1570] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":2438,\"bdeRecVersion\":5534,\"capt\":2612,\"dcdStrike\":8137,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-897\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-951\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-601\",\"intrRate\":8.405,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-667\",\"maturityDate\":\"2026-03-17\",\"mktRate\":2.106,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6299,\"orderedBy\":\"orderedBy-975\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8084,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.122,\"settlePlanA\":true,\"trdrRate\":5.315,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1571] GET /doc-mmkts/{id} — Money Market API
run_request "[1571] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [1572] PATCH /doc-mmkts/{id} — Money Market API
run_request "[1572] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":6963,\"bdeRecVersion\":5701,\"capt\":4440,\"dcdStrike\":5562,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-414\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-464\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-674\",\"intrRate\":2.26,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-378\",\"maturityDate\":\"2026-03-17\",\"mktRate\":2.969,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3181,\"orderedBy\":\"orderedBy-688\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4062,\"respBpA\":true,\"respObjA\":true,\"rmRate\":7.522,\"settlePlanA\":true,\"trdrRate\":6.296,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1573] POST /doc-xfermons — Money Transfer API
run_request "[1573] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":5485,\"amount\":279164.59,\"bdeRecVersion\":7062,\"bulkItemIdent\":\"bulkItemIdent-165\",\"credAdvText\":\"credAdvText-281\",\"credBookText\":\"credBookText-128\",\"debAdvText\":\"debAdvText-423\",\"debBookText\":\"debBookText-719\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-870\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-440\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-861\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-604\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7102,\"orderedBy\":\"orderedBy-537\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1574] GET /doc-xfermons/{id} — Money Transfer API
run_request "[1574] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [1575] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[1575] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":1267,\"amount\":656049.62,\"bdeRecVersion\":7410,\"bulkItemIdent\":\"bulkItemIdent-219\",\"credAdvText\":\"credAdvText-868\",\"credBookText\":\"credBookText-328\",\"debAdvText\":\"debAdvText-913\",\"debBookText\":\"debBookText-375\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-846\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-612\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-495\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-782\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8599,\"orderedBy\":\"orderedBy-185\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1576] POST /doc-oofxs — OTC FX Option API
run_request "[1576] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":1465,\"advTextCred\":\"advTextCred-380\",\"advTextDeb\":\"advTextDeb-409\",\"bdeRecVersion\":4434,\"bookTextCred\":\"bookTextCred-480\",\"bookTextDeb\":\"bookTextDeb-681\",\"callQty\":7102,\"cutOffTime\":\"cutOffTime-558\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-101\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-535\",\"gross\":\"gross-739\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-848\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-400\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2758,\"orderedBy\":\"orderedBy-394\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-160\",\"putQty\":5149,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-551\",\"spread2\":\"spread2-300\",\"strike\":4920,\"strikePict\":4856,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1577] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[1577] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [1578] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[1578] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":1859,\"advTextCred\":\"advTextCred-336\",\"advTextDeb\":\"advTextDeb-484\",\"bdeRecVersion\":2533,\"bookTextCred\":\"bookTextCred-434\",\"bookTextDeb\":\"bookTextDeb-992\",\"callQty\":7591,\"cutOffTime\":\"cutOffTime-144\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-122\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-988\",\"gross\":\"gross-987\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-709\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-719\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6112,\"orderedBy\":\"orderedBy-727\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-681\",\"putQty\":7134,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-607\",\"spread2\":\"spread2-501\",\"strike\":3003,\"strikePict\":6202,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1579] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[1579] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [1580] GET /doc-otcopts/{id} — OTC Option API
run_request "[1580] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>Capi Test Report · Part 6</title>
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
<h1>🧪 Capi Test Report <span style='color:#8b949e;font-size:14px'>Part 6 / 8</span></h1>
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