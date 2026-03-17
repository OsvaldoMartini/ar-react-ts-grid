#!/usr/bin/env bash
# =============================================================
# Capi Test Runner — FLOW Execution (Part 3/8)
# Generated: 2026-03-17T10:50:15.352Z
# Cases:     857–220 of 1596
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-17-10-50-12_part3_report.html"
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
ID_DOC_CDSS=""
ID_DOC_DCDS=""
ID_DOC_XIOMS=""
ID_DOC_XFERFEES=""
ID_DOC_FIDDS=""
ID_DOC_FRAS=""

# ── INIT HTML REPORT ─────────────────────────────────────────
echo "Starting 200 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [857] POST /doc-fxsws — FX Swap API
run_request "[857] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-956\",\"bdeRecVersion\":2252,\"buyBookText1\":\"buyBookText1-957\",\"buyBookText2\":\"buyBookText2-589\",\"buyQty1\":4432,\"buyQty2\":9982,\"cfi\":\"cfi-124\",\"dealFwdRate1\":5.201,\"dealFwdRate2\":2.728,\"dealSpotRate1\":3.313,\"dealSpotRate2\":6.239,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR2602592284\",\"lastTrans\":\"lastTrans-587\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-875\",\"period1\":\"period1-479\",\"period2\":\"period2-374\",\"sellBookText1\":\"sellBookText1-733\",\"sellBookText2\":\"sellBookText2-710\",\"sellQty1\":6674,\"sellQty2\":4395,\"spotDate\":\"2026-03-17\",\"trdrRate1\":7.019,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [858] GET /doc-fxsws/{id} — FX Swap API
run_request "[858] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [859] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[859] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-849\",\"bdeRecVersion\":789,\"buyBookText1\":\"buyBookText1-454\",\"buyBookText2\":\"buyBookText2-647\",\"buyQty1\":3173,\"buyQty2\":5629,\"cfi\":\"cfi-315\",\"dealFwdRate1\":8.242,\"dealFwdRate2\":2.273,\"dealSpotRate1\":1.526,\"dealSpotRate2\":5.837,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US8862038215\",\"lastTrans\":\"lastTrans-941\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-780\",\"period1\":\"period1-295\",\"period2\":\"period2-396\",\"sellBookText1\":\"sellBookText1-776\",\"sellBookText2\":\"sellBookText2-192\",\"sellQty1\":3613,\"sellQty2\":9717,\"spotDate\":\"2026-03-17\",\"trdrRate1\":4.237,\"trxDate\":\"2026-03-17\"}"

# [860] POST /doc-fxtrs — FXTR API
run_request "[860] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":1667,\"advText\":\"advText-311\",\"bdeRecVersion\":7684,\"buyQty\":9273,\"dealFwdRate\":6.874,\"dealSpotRate\":8.025,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-571\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-314\",\"fwdSpread\":4220,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-713\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-228\",\"limit\":4100,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4191,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3231,\"orderedBy\":\"orderedBy-216\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-876\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4917,\"settlePlanA\":true,\"spotSpread1\":99,\"spotSpread2\":3445,\"trdrRate\":3.295,\"trigPrice\":1417,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+49660262760\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [861] GET /doc-fxtrs/{id} — FXTR API
run_request "[861] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [862] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[862] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":618,\"advText\":\"advText-341\",\"bdeRecVersion\":9738,\"buyQty\":5546,\"dealFwdRate\":5.536,\"dealSpotRate\":3.088,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-676\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-649\",\"fwdSpread\":2726,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-733\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-517\",\"limit\":3076,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":604,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1957,\"orderedBy\":\"orderedBy-773\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-357\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":2931,\"settlePlanA\":true,\"spotSpread1\":7863,\"spotSpread2\":6922,\"trdrRate\":4.956,\"trigPrice\":633,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+49421900367\"}"

# [863] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[863] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [864] POST /doc-inpays — Incoming Payment API
run_request "[864] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":4306,\"amount\":725244,\"bankClearNr\":\"bankClearNr-795\",\"bankInfo\":\"bankInfo-388\",\"bdeRecVersion\":4867,\"benefAcc\":\"benefAcc-915\",\"benefRefNr\":\"benefRefNr-305\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-887\",\"contrPeriodStart\":\"contrPeriodStart-571\",\"credAddr\":\"credAddr-447\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-136\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-852\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-260\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-233\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-126\",\"orderDate\":\"2026-03-17\",\"orderNr\":4363,\"orderedBy\":\"orderedBy-744\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payerAcc\":\"payerAcc-191\",\"payerAddrTxt\":\"payerAddrTxt-244\",\"payerIban\":\"CH97845228755818809\",\"payerInfo\":\"payerInfo-755\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-886\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [865] GET /doc-inpays/{id} — Incoming Payment API
run_request "[865] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [866] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[866] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":6734,\"amount\":702077.24,\"bankClearNr\":\"bankClearNr-425\",\"bankInfo\":\"bankInfo-445\",\"bdeRecVersion\":7113,\"benefAcc\":\"benefAcc-852\",\"benefRefNr\":\"benefRefNr-473\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-778\",\"contrPeriodStart\":\"contrPeriodStart-208\",\"credAddr\":\"credAddr-915\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-692\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-860\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-713\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-661\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-702\",\"orderDate\":\"2026-03-17\",\"orderNr\":3628,\"orderedBy\":\"orderedBy-386\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-811\",\"payerAddrTxt\":\"payerAddrTxt-825\",\"payerIban\":\"FR74620615241859045\",\"payerInfo\":\"payerInfo-176\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-680\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [867] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[867] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [868] GET /doc-intrs/{id} — Interest API
run_request "[868] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [869] POST /doc-invst-bdls — Investment Bundler API
run_request "[869] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":9791,\"bdeRecVersion\":3783,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-681\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-823\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-290\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-196\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6189,\"orderedBy\":\"orderedBy-962\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":5078,\"remnBaccBalMin\":2171,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [870] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[870] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [871] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[871] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":6094,\"bdeRecVersion\":7520,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-257\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-276\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-152\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-872\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5658,\"orderedBy\":\"orderedBy-727\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":217,\"remnBaccBalMin\":4974,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [872] POST /doc-crm-issues — Issue Management API
run_request "[872] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-621\",\"advNr\":3564,\"allDayEvt\":true,\"attch\":\"attch-621\",\"bdeRecVersion\":3456,\"campgnTaskSeqNr\":1711,\"descn\":\"descn-582\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-766\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-320\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-102\",\"findingKey\":\"findingKey-685\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-555\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-553\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-346\",\"location\":\"location-495\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1794,\"orderedBy\":\"orderedBy-505\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":7084,\"qtyLinked\":1967,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-158\",\"subject\":\"subject-568\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-247\",\"undefBp\":\"undefBp-920\",\"val\":8513,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [873] GET /doc-crm-issues/{id} — Issue Management API
run_request "[873] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [874] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[874] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-582\",\"advNr\":7661,\"allDayEvt\":true,\"attch\":\"attch-939\",\"bdeRecVersion\":6553,\"campgnTaskSeqNr\":8490,\"descn\":\"descn-189\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-230\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-618\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-685\",\"findingKey\":\"findingKey-419\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-868\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-332\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-920\",\"location\":\"location-722\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3810,\"orderedBy\":\"orderedBy-903\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":609,\"qtyLinked\":7,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-845\",\"subject\":\"subject-560\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-200\",\"undefBp\":\"undefBp-844\",\"val\":3153,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [875] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[875] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [876] GET /doc-letters/{id} — Letter API
run_request "[876] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [877] POST /doc-limits — Limit API
run_request "[877] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":2846,\"advTextCred\":\"advTextCred-935\",\"advTextDeb\":\"advTextDeb-610\",\"amount\":730719.29,\"bdeRecVersion\":9174,\"bookTextCred\":\"bookTextCred-782\",\"bookTextDeb\":\"bookTextDeb-652\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-778\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-354\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-649\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-497\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-950\",\"nextReview\":\"nextReview-951\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8792,\"orderedBy\":\"orderedBy-991\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [878] GET /doc-limits/{id} — Limit API
run_request "[878] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [879] PATCH /doc-limits/{id} — Limit API
run_request "[879] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":8000,\"advTextCred\":\"advTextCred-852\",\"advTextDeb\":\"advTextDeb-684\",\"amount\":988080.1,\"bdeRecVersion\":8514,\"bookTextCred\":\"bookTextCred-344\",\"bookTextDeb\":\"bookTextDeb-299\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-631\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-910\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-771\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-398\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-932\",\"nextReview\":\"nextReview-491\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6067,\"orderedBy\":\"orderedBy-312\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [880] POST /doc-loans — Loan API
run_request "[880] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":3559,\"advTextCred\":\"advTextCred-699\",\"advTextDeb\":\"advTextDeb-363\",\"bdeRecVersion\":9220,\"bookTextCred\":\"bookTextCred-457\",\"bookTextDeb\":\"bookTextDeb-375\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-649\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-321\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-836\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-889\",\"intrGradManMarkup\":9372,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-977\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":4215,\"orderedBy\":\"orderedBy-101\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":7993,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [881] GET /doc-loans/{id} — Loan API
run_request "[881] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [882] PATCH /doc-loans/{id} — Loan API
run_request "[882] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":7223,\"advTextCred\":\"advTextCred-889\",\"advTextDeb\":\"advTextDeb-381\",\"bdeRecVersion\":9103,\"bookTextCred\":\"bookTextCred-326\",\"bookTextDeb\":\"bookTextDeb-962\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-409\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-471\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-904\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-868\",\"intrGradManMarkup\":5966,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-234\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2017,\"orderedBy\":\"orderedBy-116\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6700,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [883] POST /doc-mass-settles — Mass Settlement API
run_request "[883] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":1605,\"autoFillList\":true,\"bdeRecVersion\":6163,\"benefBpText\":\"benefBpText-982\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-489\",\"destBankBic\":\"CRESCHZZ80A\",\"destBankBpText\":\"destBankBpText-596\",\"destBankClr\":\"destBankClr-139\",\"destBankText\":\"destBankText-609\",\"destBenefText\":\"destBenefText-211\",\"destInfo\":\"destInfo-127\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-543\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-389\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-754\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-978\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2987,\"orderedBy\":\"orderedBy-939\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [884] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[884] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [885] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[885] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":5905,\"autoFillList\":true,\"bdeRecVersion\":2208,\"benefBpText\":\"benefBpText-906\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-746\",\"destBankBic\":\"DEUTDEDB\",\"destBankBpText\":\"destBankBpText-404\",\"destBankClr\":\"destBankClr-195\",\"destBankText\":\"destBankText-259\",\"destBenefText\":\"destBenefText-570\",\"destInfo\":\"destInfo-607\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-258\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-352\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-791\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-621\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":845,\"orderedBy\":\"orderedBy-843\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [886] POST /doc-mmkts — Money Market API
run_request "[886] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":2116,\"bdeRecVersion\":3981,\"capt\":9681,\"dcdStrike\":7610,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-346\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-928\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-103\",\"intrRate\":8.363,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-392\",\"maturityDate\":\"2026-03-17\",\"mktRate\":7.624,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8054,\"orderedBy\":\"orderedBy-693\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8586,\"respBpA\":true,\"respObjA\":true,\"rmRate\":4.546,\"settlePlanA\":true,\"trdrRate\":8.411,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [887] GET /doc-mmkts/{id} — Money Market API
run_request "[887] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [888] PATCH /doc-mmkts/{id} — Money Market API
run_request "[888] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":9899,\"bdeRecVersion\":8221,\"capt\":2001,\"dcdStrike\":5958,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-304\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-513\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-179\",\"intrRate\":0.212,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-585\",\"maturityDate\":\"2026-03-17\",\"mktRate\":1.884,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5727,\"orderedBy\":\"orderedBy-595\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1375,\"respBpA\":true,\"respObjA\":true,\"rmRate\":4.725,\"settlePlanA\":true,\"trdrRate\":8.146,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [889] POST /doc-xfermons — Money Transfer API
run_request "[889] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":5951,\"amount\":740322.55,\"bdeRecVersion\":1276,\"bulkItemIdent\":\"bulkItemIdent-497\",\"credAdvText\":\"credAdvText-658\",\"credBookText\":\"credBookText-325\",\"debAdvText\":\"debAdvText-924\",\"debBookText\":\"debBookText-321\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-561\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-875\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-795\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-904\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1348,\"orderedBy\":\"orderedBy-692\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [890] GET /doc-xfermons/{id} — Money Transfer API
run_request "[890] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [891] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[891] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":7050,\"amount\":44570.53,\"bdeRecVersion\":333,\"bulkItemIdent\":\"bulkItemIdent-686\",\"credAdvText\":\"credAdvText-866\",\"credBookText\":\"credBookText-676\",\"debAdvText\":\"debAdvText-371\",\"debBookText\":\"debBookText-607\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-504\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-861\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-432\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-854\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6553,\"orderedBy\":\"orderedBy-124\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [892] POST /doc-oofxs — OTC FX Option API
run_request "[892] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":8031,\"advTextCred\":\"advTextCred-618\",\"advTextDeb\":\"advTextDeb-130\",\"bdeRecVersion\":2082,\"bookTextCred\":\"bookTextCred-878\",\"bookTextDeb\":\"bookTextDeb-179\",\"callQty\":1955,\"cutOffTime\":\"cutOffTime-896\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-161\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-793\",\"gross\":\"gross-393\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-731\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-577\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7357,\"orderedBy\":\"orderedBy-900\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-147\",\"putQty\":6409,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-676\",\"spread2\":\"spread2-475\",\"strike\":248,\"strikePict\":7249,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [893] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[893] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [894] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[894] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":5122,\"advTextCred\":\"advTextCred-788\",\"advTextDeb\":\"advTextDeb-635\",\"bdeRecVersion\":1329,\"bookTextCred\":\"bookTextCred-363\",\"bookTextDeb\":\"bookTextDeb-736\",\"callQty\":2364,\"cutOffTime\":\"cutOffTime-745\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-103\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-620\",\"gross\":\"gross-922\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-782\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-821\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8841,\"orderedBy\":\"orderedBy-421\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-586\",\"putQty\":5641,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-723\",\"spread2\":\"spread2-584\",\"strike\":4101,\"strikePict\":252,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [895] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[895] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [896] GET /doc-otcopts/{id} — OTC Option API
run_request "[896] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [897] GET /doc-othsecs/{id} — Other Security API
run_request "[897] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [898] POST /doc-pays — Payment API
run_request "[898] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":651,\"amount\":926441.05,\"bank\":\"bank-285\",\"bankAcc\":\"bankAcc-512\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-982\",\"bankCorr1\":\"bankCorr1-916\",\"bankCorr1Acc\":\"bankCorr1Acc-463\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-626\",\"bankCorr3\":\"bankCorr3-594\",\"bankCorr3Acc\":\"bankCorr3Acc-801\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-329\",\"bankCorr4\":\"bankCorr4-147\",\"bankCorr4Acc\":\"bankCorr4Acc-250\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-975\",\"bankInfo\":\"bankInfo-799\",\"bdeRecVersion\":2832,\"benef\":\"benef-215\",\"benefAcc\":\"benefAcc-642\",\"benefIban\":\"FR46653168472649384\",\"benefInfo\":\"benefInfo-596\",\"benefRefNr\":\"benefRefNr-930\",\"bookTextCred\":\"bookTextCred-934\",\"bookTextDeb\":\"bookTextDeb-837\",\"bulkItemIdent\":\"bulkItemIdent-132\",\"destCountry\":{\"id\":6,\"ident\":\"GB\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-287\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-252\",\"hasPostit\":true,\"instrAmount\":934037.9,\"intlRefNr\":\"intlRefNr-189\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"FR6740535589\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-929\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-507\",\"ordBankAcc\":\"ordBankAcc-756\",\"ordBankClearNr\":\"ordBankClearNr-452\",\"ordRef\":\"ordRef-673\",\"orderDate\":\"2026-03-17\",\"orderNr\":8219,\"orderedBy\":\"orderedBy-607\",\"orderedByAcc\":\"orderedByAcc-601\",\"origGrpRef\":\"origGrpRef-124\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-649\",\"stordPeriodEnd\":\"stordPeriodEnd-966\",\"stordPeriodStart\":\"stordPeriodStart-661\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+44993815224\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [899] GET /doc-pays/{id} — Payment API
run_request "[899] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [900] PATCH /doc-pays/{id} — Payment API
run_request "[900] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":6266,\"amount\":874976.29,\"bank\":\"bank-984\",\"bankAcc\":\"bankAcc-827\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-604\",\"bankCorr1\":\"bankCorr1-899\",\"bankCorr1Acc\":\"bankCorr1Acc-589\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-297\",\"bankCorr3\":\"bankCorr3-669\",\"bankCorr3Acc\":\"bankCorr3Acc-161\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-493\",\"bankCorr4\":\"bankCorr4-393\",\"bankCorr4Acc\":\"bankCorr4Acc-243\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-834\",\"bankInfo\":\"bankInfo-741\",\"bdeRecVersion\":630,\"benef\":\"benef-231\",\"benefAcc\":\"benefAcc-756\",\"benefIban\":\"IT69160145977385068\",\"benefInfo\":\"benefInfo-639\",\"benefRefNr\":\"benefRefNr-920\",\"bookTextCred\":\"bookTextCred-858\",\"bookTextDeb\":\"bookTextDeb-143\",\"bulkItemIdent\":\"bulkItemIdent-373\",\"destCountry\":{\"id\":2,\"ident\":\"DE\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-912\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-716\",\"hasPostit\":true,\"instrAmount\":394157.87,\"intlRefNr\":\"intlRefNr-511\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"FR5087938698\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-357\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-784\",\"ordBankAcc\":\"ordBankAcc-982\",\"ordBankClearNr\":\"ordBankClearNr-779\",\"ordRef\":\"ordRef-967\",\"orderDate\":\"2026-03-17\",\"orderNr\":4520,\"orderedBy\":\"orderedBy-341\",\"orderedByAcc\":\"orderedByAcc-922\",\"origGrpRef\":\"origGrpRef-515\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-986\",\"stordPeriodEnd\":\"stordPeriodEnd-846\",\"stordPeriodStart\":\"stordPeriodStart-713\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49104394627\"}"

# [901] GET /doc-realsecs/{id} — Real Security API
run_request "[901] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [902] POST /doc-realtys — Realty API
run_request "[902] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":8050,\"bdeRecVersion\":2955,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-797\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-274\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-873\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-344\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9307,\"orderedBy\":\"orderedBy-666\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [903] GET /doc-realtys/{id} — Realty API
run_request "[903] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [904] PATCH /doc-realtys/{id} — Realty API
run_request "[904] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":5791,\"bdeRecVersion\":9709,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-125\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-592\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-975\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-770\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3942,\"orderedBy\":\"orderedBy-315\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [905] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[905] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":9109,\"bdeRecVersion\":5523,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-211\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-287\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-426\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-948\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1736,\"orderedBy\":\"orderedBy-528\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [906] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[906] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [907] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[907] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":7708,\"bdeRecVersion\":2229,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-134\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-995\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-478\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-243\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9182,\"orderedBy\":\"orderedBy-627\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [908] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[908] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [909] POST /doc-rebalss — Rebalancer Order API
run_request "[909] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":7721,\"bdeRecVersion\":3834,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-221\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-471\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-529\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-530\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7832,\"orderedBy\":\"orderedBy-973\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [910] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[910] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [911] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[911] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":107,\"bdeRecVersion\":6275,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-983\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-787\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-683\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-166\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9448,\"orderedBy\":\"orderedBy-769\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [912] GET /doc-repocs/{id} — Repo Contract API
run_request "[912] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [1293] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[1293] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [1294] POST /doc-ctact2s — Contact Management (V2) API
run_request "[1294] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":6614,\"attch\":\"attch-541\",\"attchA\":true,\"bdeRecVersion\":3498,\"campgnCltReaction\":\"campgnCltReaction-390\",\"campgnRespKey\":\"campgnRespKey-953\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-724\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-933\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-179\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-857\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-168\",\"linkDocListA\":true,\"loc\":\"loc-414\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5033,\"orderedBy\":\"orderedBy-700\",\"particListA\":true,\"questrSeqNr\":7030,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":5247,\"reactComment\":\"reactComment-151\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-397\",\"reactNrPartic\":4132,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-365\",\"subjA\":true,\"syncSeqNr\":1113,\"totExpndTimeM\":2783,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1295] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1295] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [1296] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1296] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":5861,\"attch\":\"attch-802\",\"attchA\":true,\"bdeRecVersion\":85,\"campgnCltReaction\":\"campgnCltReaction-222\",\"campgnRespKey\":\"campgnRespKey-105\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-461\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-433\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-467\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-390\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-303\",\"linkDocListA\":true,\"loc\":\"loc-743\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6941,\"orderedBy\":\"orderedBy-465\",\"particListA\":true,\"questrSeqNr\":8111,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":2038,\"reactComment\":\"reactComment-419\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-636\",\"reactNrPartic\":1868,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-729\",\"subjA\":true,\"syncSeqNr\":2927,\"totExpndTimeM\":1263,\"trxDate\":\"2026-03-17\"}"

# [1297] GET /doc-cmgs/{id} — Cashier Management API
run_request "[1297] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [1298] GET /doc-cops/{id} — Cashier Operations API
run_request "[1298] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [1299] POST /doc-clts — Client Opening API
run_request "[1299] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1300] GET /doc-clts/{id} — Client Opening API
run_request "[1300] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [1301] PATCH /doc-clts/{id} — Client Opening API
run_request "[1301] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [1302] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[1302] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [1303] GET /doc-cltms/{id} — Collateral Movement API
run_request "[1303] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [1304] GET /doc-cords/{id} — Collective Order API
run_request "[1304] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [1305] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[1305] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [1306] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[1306] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [1307] POST /doc-xioms — External Investment Order Manager API
run_request "[1307] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":768,\"bdeRecVersion\":6177,\"bpLevelRep\":true,\"descn\":\"descn-942\",\"extlRefNr\":\"extlRefNr-394\",\"extlRepLang\":\"extlRepLang-603\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-396\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-431\",\"linkGrp\":1915,\"orderDate\":\"2026-03-17\",\"orderNr\":7585,\"orderedBy\":\"orderedBy-440\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1308] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[1308] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [1309] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[1309] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":6970,\"bdeRecVersion\":8715,\"bpLevelRep\":true,\"descn\":\"descn-880\",\"extlRefNr\":\"extlRefNr-206\",\"extlRepLang\":\"extlRepLang-936\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-893\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-936\",\"linkGrp\":1858,\"orderDate\":\"2026-03-17\",\"orderNr\":3339,\"orderedBy\":\"orderedBy-303\",\"sendRepToEbank\":true}"

# [1310] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[1310] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [1311] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[1311] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [1312] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[1312] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [1313] POST /doc-fxsws — FX Swap API
run_request "[1313] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-590\",\"bdeRecVersion\":9554,\"buyBookText1\":\"buyBookText1-803\",\"buyBookText2\":\"buyBookText2-181\",\"buyQty1\":8004,\"buyQty2\":334,\"cfi\":\"cfi-640\",\"dealFwdRate1\":4.032,\"dealFwdRate2\":2.162,\"dealSpotRate1\":1.378,\"dealSpotRate2\":2.199,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB9832931017\",\"lastTrans\":\"lastTrans-347\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-221\",\"period1\":\"period1-584\",\"period2\":\"period2-970\",\"sellBookText1\":\"sellBookText1-382\",\"sellBookText2\":\"sellBookText2-687\",\"sellQty1\":9131,\"sellQty2\":7251,\"spotDate\":\"2026-03-17\",\"trdrRate1\":3.79,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1314] GET /doc-fxsws/{id} — FX Swap API
run_request "[1314] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [1315] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[1315] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-775\",\"bdeRecVersion\":4850,\"buyBookText1\":\"buyBookText1-991\",\"buyBookText2\":\"buyBookText2-662\",\"buyQty1\":1364,\"buyQty2\":408,\"cfi\":\"cfi-659\",\"dealFwdRate1\":2.851,\"dealFwdRate2\":2.815,\"dealSpotRate1\":2.303,\"dealSpotRate2\":4.795,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US9244422877\",\"lastTrans\":\"lastTrans-679\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-414\",\"period1\":\"period1-416\",\"period2\":\"period2-587\",\"sellBookText1\":\"sellBookText1-447\",\"sellBookText2\":\"sellBookText2-742\",\"sellQty1\":9026,\"sellQty2\":1128,\"spotDate\":\"2026-03-17\",\"trdrRate1\":2.444,\"trxDate\":\"2026-03-17\"}"

# [1316] POST /doc-fxtrs — FXTR API
run_request "[1316] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5855,\"advText\":\"advText-296\",\"bdeRecVersion\":2696,\"buyQty\":4627,\"dealFwdRate\":5.696,\"dealSpotRate\":5.418,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-387\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-583\",\"fwdSpread\":1364,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-825\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-202\",\"limit\":4236,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":6414,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2667,\"orderedBy\":\"orderedBy-935\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-146\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4017,\"settlePlanA\":true,\"spotSpread1\":8467,\"spotSpread2\":2365,\"trdrRate\":2.25,\"trigPrice\":9271,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44378643056\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1317] GET /doc-fxtrs/{id} — FXTR API
run_request "[1317] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [1318] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[1318] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1601,\"advText\":\"advText-889\",\"bdeRecVersion\":2932,\"buyQty\":5378,\"dealFwdRate\":5.403,\"dealSpotRate\":4.508,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-860\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-225\",\"fwdSpread\":3648,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-397\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-510\",\"limit\":7686,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":1016,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4764,\"orderedBy\":\"orderedBy-535\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-290\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7958,\"settlePlanA\":true,\"spotSpread1\":1756,\"spotSpread2\":7537,\"trdrRate\":7.437,\"trigPrice\":8287,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39396297054\"}"

# [1319] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[1319] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [1320] POST /doc-inpays — Incoming Payment API
run_request "[1320] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":2544,\"amount\":507360.11,\"bankClearNr\":\"bankClearNr-821\",\"bankInfo\":\"bankInfo-740\",\"bdeRecVersion\":5709,\"benefAcc\":\"benefAcc-832\",\"benefRefNr\":\"benefRefNr-746\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-981\",\"contrPeriodStart\":\"contrPeriodStart-537\",\"credAddr\":\"credAddr-128\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-866\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-747\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-930\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-479\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-243\",\"orderDate\":\"2026-03-17\",\"orderNr\":2817,\"orderedBy\":\"orderedBy-469\",\"originCountry\":{\"id\":4,\"ident\":\"FR\"},\"payerAcc\":\"payerAcc-500\",\"payerAddrTxt\":\"payerAddrTxt-721\",\"payerIban\":\"IT35622495141247493\",\"payerInfo\":\"payerInfo-422\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-341\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1321] GET /doc-inpays/{id} — Incoming Payment API
run_request "[1321] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [1322] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[1322] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":9602,\"amount\":691647.32,\"bankClearNr\":\"bankClearNr-438\",\"bankInfo\":\"bankInfo-678\",\"bdeRecVersion\":6023,\"benefAcc\":\"benefAcc-679\",\"benefRefNr\":\"benefRefNr-646\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-460\",\"contrPeriodStart\":\"contrPeriodStart-793\",\"credAddr\":\"credAddr-530\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-674\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-235\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-430\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-113\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-841\",\"orderDate\":\"2026-03-17\",\"orderNr\":9334,\"orderedBy\":\"orderedBy-967\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payerAcc\":\"payerAcc-627\",\"payerAddrTxt\":\"payerAddrTxt-658\",\"payerIban\":\"FR25198290893554725\",\"payerInfo\":\"payerInfo-217\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-639\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1323] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[1323] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [1324] GET /doc-intrs/{id} — Interest API
run_request "[1324] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [1325] POST /doc-invst-bdls — Investment Bundler API
run_request "[1325] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":976,\"bdeRecVersion\":4031,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-151\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-442\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-101\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-468\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5870,\"orderedBy\":\"orderedBy-944\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":9118,\"remnBaccBalMin\":748,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1326] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1326] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [1327] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1327] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":8037,\"bdeRecVersion\":7196,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-832\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-629\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-882\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-600\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3069,\"orderedBy\":\"orderedBy-251\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":2698,\"remnBaccBalMin\":5470,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1328] POST /doc-crm-issues — Issue Management API
run_request "[1328] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-548\",\"advNr\":6487,\"allDayEvt\":true,\"attch\":\"attch-251\",\"bdeRecVersion\":2985,\"campgnTaskSeqNr\":8926,\"descn\":\"descn-698\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-321\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-944\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-454\",\"findingKey\":\"findingKey-338\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-322\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-125\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-886\",\"location\":\"location-488\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8756,\"orderedBy\":\"orderedBy-165\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":332,\"qtyLinked\":9220,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-540\",\"subject\":\"subject-549\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-863\",\"undefBp\":\"undefBp-791\",\"val\":3324,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1329] GET /doc-crm-issues/{id} — Issue Management API
run_request "[1329] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [1330] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[1330] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-689\",\"advNr\":3931,\"allDayEvt\":true,\"attch\":\"attch-338\",\"bdeRecVersion\":7223,\"campgnTaskSeqNr\":1157,\"descn\":\"descn-174\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-569\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-959\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-340\",\"findingKey\":\"findingKey-127\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-903\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-200\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-915\",\"location\":\"location-400\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1976,\"orderedBy\":\"orderedBy-814\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1185,\"qtyLinked\":8552,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-562\",\"subject\":\"subject-935\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-789\",\"undefBp\":\"undefBp-265\",\"val\":6212,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1331] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[1331] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [1332] GET /doc-letters/{id} — Letter API
run_request "[1332] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [1333] POST /doc-limits — Limit API
run_request "[1333] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":1572,\"advTextCred\":\"advTextCred-555\",\"advTextDeb\":\"advTextDeb-202\",\"amount\":657314.38,\"bdeRecVersion\":5814,\"bookTextCred\":\"bookTextCred-123\",\"bookTextDeb\":\"bookTextDeb-704\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-117\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-986\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-618\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-115\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-649\",\"nextReview\":\"nextReview-952\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2729,\"orderedBy\":\"orderedBy-950\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1334] GET /doc-limits/{id} — Limit API
run_request "[1334] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [1335] PATCH /doc-limits/{id} — Limit API
run_request "[1335] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":4471,\"advTextCred\":\"advTextCred-908\",\"advTextDeb\":\"advTextDeb-540\",\"amount\":589082.89,\"bdeRecVersion\":3834,\"bookTextCred\":\"bookTextCred-715\",\"bookTextDeb\":\"bookTextDeb-737\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-846\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-253\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-726\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-764\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-976\",\"nextReview\":\"nextReview-596\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2301,\"orderedBy\":\"orderedBy-172\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1336] POST /doc-loans — Loan API
run_request "[1336] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":4221,\"advTextCred\":\"advTextCred-515\",\"advTextDeb\":\"advTextDeb-194\",\"bdeRecVersion\":3154,\"bookTextCred\":\"bookTextCred-193\",\"bookTextDeb\":\"bookTextDeb-860\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-441\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-622\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-456\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-595\",\"intrGradManMarkup\":9366,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-806\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5844,\"orderedBy\":\"orderedBy-872\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":282,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1337] GET /doc-loans/{id} — Loan API
run_request "[1337] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [1338] PATCH /doc-loans/{id} — Loan API
run_request "[1338] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":6584,\"advTextCred\":\"advTextCred-980\",\"advTextDeb\":\"advTextDeb-477\",\"bdeRecVersion\":6054,\"bookTextCred\":\"bookTextCred-355\",\"bookTextDeb\":\"bookTextDeb-959\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-677\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-181\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-652\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-100\",\"intrGradManMarkup\":2336,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-406\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7325,\"orderedBy\":\"orderedBy-100\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4263,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1339] POST /doc-mass-settles — Mass Settlement API
run_request "[1339] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":3428,\"autoFillList\":true,\"bdeRecVersion\":9422,\"benefBpText\":\"benefBpText-375\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-848\",\"destBankBic\":\"CRESCHZZ80A\",\"destBankBpText\":\"destBankBpText-321\",\"destBankClr\":\"destBankClr-218\",\"destBankText\":\"destBankText-548\",\"destBenefText\":\"destBenefText-577\",\"destInfo\":\"destInfo-901\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-252\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-723\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-176\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-893\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":248,\"orderedBy\":\"orderedBy-855\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1340] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[1340] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [1341] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[1341] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":6293,\"autoFillList\":true,\"bdeRecVersion\":6877,\"benefBpText\":\"benefBpText-858\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-623\",\"destBankBic\":\"BFGEIT3F\",\"destBankBpText\":\"destBankBpText-403\",\"destBankClr\":\"destBankClr-655\",\"destBankText\":\"destBankText-499\",\"destBenefText\":\"destBenefText-649\",\"destInfo\":\"destInfo-638\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-920\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-352\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-481\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-745\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":836,\"orderedBy\":\"orderedBy-307\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1342] POST /doc-mmkts — Money Market API
run_request "[1342] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":4280,\"bdeRecVersion\":2654,\"capt\":7391,\"dcdStrike\":2607,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-169\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-268\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-437\",\"intrRate\":1.448,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-291\",\"maturityDate\":\"2026-03-17\",\"mktRate\":1.733,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8859,\"orderedBy\":\"orderedBy-463\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1796,\"respBpA\":true,\"respObjA\":true,\"rmRate\":0.128,\"settlePlanA\":true,\"trdrRate\":3.606,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1343] GET /doc-mmkts/{id} — Money Market API
run_request "[1343] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [1344] PATCH /doc-mmkts/{id} — Money Market API
run_request "[1344] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":102,\"bdeRecVersion\":7187,\"capt\":4024,\"dcdStrike\":4779,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-609\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-688\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-441\",\"intrRate\":0.129,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-284\",\"maturityDate\":\"2026-03-17\",\"mktRate\":4.869,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":608,\"orderedBy\":\"orderedBy-489\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5157,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.155,\"settlePlanA\":true,\"trdrRate\":1.344,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1345] POST /doc-xfermons — Money Transfer API
run_request "[1345] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":7505,\"amount\":958965.8,\"bdeRecVersion\":38,\"bulkItemIdent\":\"bulkItemIdent-610\",\"credAdvText\":\"credAdvText-948\",\"credBookText\":\"credBookText-758\",\"debAdvText\":\"debAdvText-283\",\"debBookText\":\"debBookText-267\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-909\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-783\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-874\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-234\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7541,\"orderedBy\":\"orderedBy-560\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1346] GET /doc-xfermons/{id} — Money Transfer API
run_request "[1346] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [1347] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[1347] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":6533,\"amount\":671346.33,\"bdeRecVersion\":9696,\"bulkItemIdent\":\"bulkItemIdent-987\",\"credAdvText\":\"credAdvText-836\",\"credBookText\":\"credBookText-362\",\"debAdvText\":\"debAdvText-495\",\"debBookText\":\"debBookText-354\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-533\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-755\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-418\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-355\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8643,\"orderedBy\":\"orderedBy-194\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1348] POST /doc-oofxs — OTC FX Option API
run_request "[1348] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":1462,\"advTextCred\":\"advTextCred-958\",\"advTextDeb\":\"advTextDeb-188\",\"bdeRecVersion\":5439,\"bookTextCred\":\"bookTextCred-856\",\"bookTextDeb\":\"bookTextDeb-923\",\"callQty\":5004,\"cutOffTime\":\"cutOffTime-159\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-571\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-419\",\"gross\":\"gross-991\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-730\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-149\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2918,\"orderedBy\":\"orderedBy-833\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-444\",\"putQty\":1983,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-512\",\"spread2\":\"spread2-324\",\"strike\":5152,\"strikePict\":4974,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1349] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[1349] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [1350] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[1350] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":7662,\"advTextCred\":\"advTextCred-828\",\"advTextDeb\":\"advTextDeb-532\",\"bdeRecVersion\":6692,\"bookTextCred\":\"bookTextCred-257\",\"bookTextDeb\":\"bookTextDeb-727\",\"callQty\":8071,\"cutOffTime\":\"cutOffTime-927\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-315\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-722\",\"gross\":\"gross-639\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-562\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-116\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4056,\"orderedBy\":\"orderedBy-697\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-566\",\"putQty\":6402,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-787\",\"spread2\":\"spread2-948\",\"strike\":1567,\"strikePict\":7002,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1351] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[1351] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [1352] GET /doc-otcopts/{id} — OTC Option API
run_request "[1352] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [1353] GET /doc-othsecs/{id} — Other Security API
run_request "[1353] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [1354] POST /doc-pays — Payment API
run_request "[1354] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":5852,\"amount\":426368.57,\"bank\":\"bank-870\",\"bankAcc\":\"bankAcc-584\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-395\",\"bankCorr1\":\"bankCorr1-860\",\"bankCorr1Acc\":\"bankCorr1Acc-558\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-346\",\"bankCorr3\":\"bankCorr3-729\",\"bankCorr3Acc\":\"bankCorr3Acc-320\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-340\",\"bankCorr4\":\"bankCorr4-435\",\"bankCorr4Acc\":\"bankCorr4Acc-318\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-187\",\"bankInfo\":\"bankInfo-470\",\"bdeRecVersion\":3075,\"benef\":\"benef-908\",\"benefAcc\":\"benefAcc-635\",\"benefIban\":\"AT13272521658114402\",\"benefInfo\":\"benefInfo-325\",\"benefRefNr\":\"benefRefNr-968\",\"bookTextCred\":\"bookTextCred-622\",\"bookTextDeb\":\"bookTextDeb-508\",\"bulkItemIdent\":\"bulkItemIdent-623\",\"destCountry\":{\"id\":3,\"ident\":\"IT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-376\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-743\",\"hasPostit\":true,\"instrAmount\":321373.29,\"intlRefNr\":\"intlRefNr-717\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"GB3389132795\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-706\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-465\",\"ordBankAcc\":\"ordBankAcc-387\",\"ordBankClearNr\":\"ordBankClearNr-272\",\"ordRef\":\"ordRef-651\",\"orderDate\":\"2026-03-17\",\"orderNr\":1584,\"orderedBy\":\"orderedBy-756\",\"orderedByAcc\":\"orderedByAcc-721\",\"origGrpRef\":\"origGrpRef-379\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-336\",\"stordPeriodEnd\":\"stordPeriodEnd-960\",\"stordPeriodStart\":\"stordPeriodStart-720\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+33544777882\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1355] GET /doc-pays/{id} — Payment API
run_request "[1355] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [1356] PATCH /doc-pays/{id} — Payment API
run_request "[1356] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":291,\"amount\":760129.08,\"bank\":\"bank-255\",\"bankAcc\":\"bankAcc-578\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-173\",\"bankCorr1\":\"bankCorr1-127\",\"bankCorr1Acc\":\"bankCorr1Acc-391\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-849\",\"bankCorr3\":\"bankCorr3-486\",\"bankCorr3Acc\":\"bankCorr3Acc-821\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-334\",\"bankCorr4\":\"bankCorr4-196\",\"bankCorr4Acc\":\"bankCorr4Acc-102\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-389\",\"bankInfo\":\"bankInfo-206\",\"bdeRecVersion\":8508,\"benef\":\"benef-495\",\"benefAcc\":\"benefAcc-718\",\"benefIban\":\"DE57551438064338860\",\"benefInfo\":\"benefInfo-721\",\"benefRefNr\":\"benefRefNr-734\",\"bookTextCred\":\"bookTextCred-856\",\"bookTextDeb\":\"bookTextDeb-805\",\"bulkItemIdent\":\"bulkItemIdent-166\",\"destCountry\":{\"id\":2,\"ident\":\"DE\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-732\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-413\",\"hasPostit\":true,\"instrAmount\":866496.35,\"intlRefNr\":\"intlRefNr-267\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE3459013784\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-909\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-788\",\"ordBankAcc\":\"ordBankAcc-645\",\"ordBankClearNr\":\"ordBankClearNr-188\",\"ordRef\":\"ordRef-362\",\"orderDate\":\"2026-03-17\",\"orderNr\":6392,\"orderedBy\":\"orderedBy-248\",\"orderedByAcc\":\"orderedByAcc-491\",\"origGrpRef\":\"origGrpRef-875\",\"originCountry\":{\"id\":4,\"ident\":\"FR\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-811\",\"stordPeriodEnd\":\"stordPeriodEnd-702\",\"stordPeriodStart\":\"stordPeriodStart-600\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+44172706362\"}"

# [1357] GET /doc-realsecs/{id} — Real Security API
run_request "[1357] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [1358] POST /doc-realtys — Realty API
run_request "[1358] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":9111,\"bdeRecVersion\":1678,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-715\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-840\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-141\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-922\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6486,\"orderedBy\":\"orderedBy-440\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1359] GET /doc-realtys/{id} — Realty API
run_request "[1359] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [1360] PATCH /doc-realtys/{id} — Realty API
run_request "[1360] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":3160,\"bdeRecVersion\":8779,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-462\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-518\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-577\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-265\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3809,\"orderedBy\":\"orderedBy-849\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1361] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[1361] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":1123,\"bdeRecVersion\":2899,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-778\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-489\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-987\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-728\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4478,\"orderedBy\":\"orderedBy-319\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1362] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1362] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [1363] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1363] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":6860,\"bdeRecVersion\":870,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-364\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-504\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-680\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-530\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8184,\"orderedBy\":\"orderedBy-600\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1364] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[1364] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [1365] POST /doc-rebalss — Rebalancer Order API
run_request "[1365] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":6742,\"bdeRecVersion\":2184,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-644\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-642\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-900\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-142\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3871,\"orderedBy\":\"orderedBy-916\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1366] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[1366] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [1367] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[1367] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":2464,\"bdeRecVersion\":7688,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-413\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-461\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-578\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-805\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9835,\"orderedBy\":\"orderedBy-386\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1368] GET /doc-repocs/{id} — Repo Contract API
run_request "[1368] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [153] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[153] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [154] POST /doc-ctact2s — Contact Management (V2) API
run_request "[154] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":3302,\"attch\":\"attch-776\",\"attchA\":true,\"bdeRecVersion\":584,\"campgnCltReaction\":\"campgnCltReaction-758\",\"campgnRespKey\":\"campgnRespKey-556\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-604\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-797\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-152\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-457\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-548\",\"linkDocListA\":true,\"loc\":\"loc-174\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1770,\"orderedBy\":\"orderedBy-630\",\"particListA\":true,\"questrSeqNr\":6452,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":2493,\"reactComment\":\"reactComment-596\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-449\",\"reactNrPartic\":2896,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-539\",\"subjA\":true,\"syncSeqNr\":1144,\"totExpndTimeM\":7885,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [155] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[155] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [156] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[156] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":2407,\"attch\":\"attch-532\",\"attchA\":true,\"bdeRecVersion\":7150,\"campgnCltReaction\":\"campgnCltReaction-419\",\"campgnRespKey\":\"campgnRespKey-295\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-604\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-772\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-872\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-181\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-591\",\"linkDocListA\":true,\"loc\":\"loc-803\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7005,\"orderedBy\":\"orderedBy-263\",\"particListA\":true,\"questrSeqNr\":7926,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":88,\"reactComment\":\"reactComment-210\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-717\",\"reactNrPartic\":2218,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-597\",\"subjA\":true,\"syncSeqNr\":6818,\"totExpndTimeM\":5882,\"trxDate\":\"2026-03-17\"}"

# [157] GET /doc-cmgs/{id} — Cashier Management API
run_request "[157] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [158] GET /doc-cops/{id} — Cashier Operations API
run_request "[158] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [159] POST /doc-clts — Client Opening API
run_request "[159] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [160] GET /doc-clts/{id} — Client Opening API
run_request "[160] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [161] PATCH /doc-clts/{id} — Client Opening API
run_request "[161] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [162] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[162] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [163] GET /doc-cltms/{id} — Collateral Movement API
run_request "[163] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [164] GET /doc-cords/{id} — Collective Order API
run_request "[164] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [165] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[165] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [166] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[166] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [167] POST /doc-xioms — External Investment Order Manager API
run_request "[167] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":3346,\"bdeRecVersion\":2533,\"bpLevelRep\":true,\"descn\":\"descn-808\",\"extlRefNr\":\"extlRefNr-434\",\"extlRepLang\":\"extlRepLang-752\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-239\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-907\",\"linkGrp\":4520,\"orderDate\":\"2026-03-17\",\"orderNr\":7961,\"orderedBy\":\"orderedBy-325\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [168] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[168] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [169] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[169] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":5504,\"bdeRecVersion\":1424,\"bpLevelRep\":true,\"descn\":\"descn-855\",\"extlRefNr\":\"extlRefNr-662\",\"extlRepLang\":\"extlRepLang-197\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-848\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-954\",\"linkGrp\":1551,\"orderDate\":\"2026-03-17\",\"orderNr\":2659,\"orderedBy\":\"orderedBy-910\",\"sendRepToEbank\":true}"

# [170] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[170] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [171] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[171] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [172] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[172] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [173] POST /doc-fxsws — FX Swap API
run_request "[173] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-347\",\"bdeRecVersion\":4937,\"buyBookText1\":\"buyBookText1-911\",\"buyBookText2\":\"buyBookText2-576\",\"buyQty1\":4586,\"buyQty2\":1144,\"cfi\":\"cfi-660\",\"dealFwdRate1\":5.143,\"dealFwdRate2\":0.472,\"dealSpotRate1\":1.441,\"dealSpotRate2\":0.375,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB7255024439\",\"lastTrans\":\"lastTrans-773\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-707\",\"period1\":\"period1-654\",\"period2\":\"period2-810\",\"sellBookText1\":\"sellBookText1-170\",\"sellBookText2\":\"sellBookText2-109\",\"sellQty1\":1525,\"sellQty2\":5570,\"spotDate\":\"2026-03-17\",\"trdrRate1\":3.901,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [174] GET /doc-fxsws/{id} — FX Swap API
run_request "[174] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [175] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[175] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-950\",\"bdeRecVersion\":7775,\"buyBookText1\":\"buyBookText1-267\",\"buyBookText2\":\"buyBookText2-110\",\"buyQty1\":9898,\"buyQty2\":7157,\"cfi\":\"cfi-842\",\"dealFwdRate1\":7.486,\"dealFwdRate2\":0.196,\"dealSpotRate1\":2.064,\"dealSpotRate2\":4.963,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB8046205599\",\"lastTrans\":\"lastTrans-937\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-342\",\"period1\":\"period1-907\",\"period2\":\"period2-813\",\"sellBookText1\":\"sellBookText1-642\",\"sellBookText2\":\"sellBookText2-893\",\"sellQty1\":2109,\"sellQty2\":3047,\"spotDate\":\"2026-03-17\",\"trdrRate1\":3.759,\"trxDate\":\"2026-03-17\"}"

# [176] POST /doc-fxtrs — FXTR API
run_request "[176] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":6245,\"advText\":\"advText-185\",\"bdeRecVersion\":6031,\"buyQty\":4006,\"dealFwdRate\":1.542,\"dealSpotRate\":4.983,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-429\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-803\",\"fwdSpread\":9159,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-304\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-932\",\"limit\":1925,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4570,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5858,\"orderedBy\":\"orderedBy-117\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-905\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1260,\"settlePlanA\":true,\"spotSpread1\":7918,\"spotSpread2\":7148,\"trdrRate\":1.803,\"trigPrice\":3473,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39353397339\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [177] GET /doc-fxtrs/{id} — FXTR API
run_request "[177] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [178] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[178] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":546,\"advText\":\"advText-365\",\"bdeRecVersion\":7718,\"buyQty\":9363,\"dealFwdRate\":4.717,\"dealSpotRate\":6.947,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-301\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-669\",\"fwdSpread\":2786,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-642\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-990\",\"limit\":3970,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":396,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4694,\"orderedBy\":\"orderedBy-509\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-854\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":5550,\"settlePlanA\":true,\"spotSpread1\":6274,\"spotSpread2\":9441,\"trdrRate\":6.978,\"trigPrice\":4663,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39341817830\"}"

# [179] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[179] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [180] POST /doc-inpays — Incoming Payment API
run_request "[180] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":9062,\"amount\":809060.38,\"bankClearNr\":\"bankClearNr-737\",\"bankInfo\":\"bankInfo-589\",\"bdeRecVersion\":9976,\"benefAcc\":\"benefAcc-448\",\"benefRefNr\":\"benefRefNr-446\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-167\",\"contrPeriodStart\":\"contrPeriodStart-538\",\"credAddr\":\"credAddr-557\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-499\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-152\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-808\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-958\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-306\",\"orderDate\":\"2026-03-17\",\"orderNr\":6479,\"orderedBy\":\"orderedBy-345\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payerAcc\":\"payerAcc-304\",\"payerAddrTxt\":\"payerAddrTxt-704\",\"payerIban\":\"CH99700188808453042\",\"payerInfo\":\"payerInfo-873\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-862\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [181] GET /doc-inpays/{id} — Incoming Payment API
run_request "[181] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [182] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[182] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":586,\"amount\":213410.14,\"bankClearNr\":\"bankClearNr-317\",\"bankInfo\":\"bankInfo-851\",\"bdeRecVersion\":8538,\"benefAcc\":\"benefAcc-461\",\"benefRefNr\":\"benefRefNr-760\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-898\",\"contrPeriodStart\":\"contrPeriodStart-693\",\"credAddr\":\"credAddr-109\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-512\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-176\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-674\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-939\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-971\",\"orderDate\":\"2026-03-17\",\"orderNr\":4685,\"orderedBy\":\"orderedBy-584\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payerAcc\":\"payerAcc-954\",\"payerAddrTxt\":\"payerAddrTxt-543\",\"payerIban\":\"AT48183275901650001\",\"payerInfo\":\"payerInfo-685\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-196\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [183] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[183] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [184] GET /doc-intrs/{id} — Interest API
run_request "[184] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [185] POST /doc-invst-bdls — Investment Bundler API
run_request "[185] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":9619,\"bdeRecVersion\":7590,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-175\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-416\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-940\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-894\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":161,\"orderedBy\":\"orderedBy-916\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":3693,\"remnBaccBalMin\":1307,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [186] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[186] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [187] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[187] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":127,\"bdeRecVersion\":6662,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-710\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-108\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-517\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-876\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9003,\"orderedBy\":\"orderedBy-280\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":8389,\"remnBaccBalMin\":3372,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [188] POST /doc-crm-issues — Issue Management API
run_request "[188] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-562\",\"advNr\":7593,\"allDayEvt\":true,\"attch\":\"attch-924\",\"bdeRecVersion\":174,\"campgnTaskSeqNr\":7555,\"descn\":\"descn-364\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-183\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-442\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-681\",\"findingKey\":\"findingKey-810\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-589\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-365\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-722\",\"location\":\"location-652\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6610,\"orderedBy\":\"orderedBy-458\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2992,\"qtyLinked\":4887,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-776\",\"subject\":\"subject-584\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-404\",\"undefBp\":\"undefBp-478\",\"val\":1577,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [189] GET /doc-crm-issues/{id} — Issue Management API
run_request "[189] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [190] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[190] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-607\",\"advNr\":9165,\"allDayEvt\":true,\"attch\":\"attch-329\",\"bdeRecVersion\":5174,\"campgnTaskSeqNr\":2804,\"descn\":\"descn-967\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-176\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-834\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-891\",\"findingKey\":\"findingKey-414\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-213\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-308\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-152\",\"location\":\"location-908\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9185,\"orderedBy\":\"orderedBy-147\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6748,\"qtyLinked\":4596,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-798\",\"subject\":\"subject-673\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-943\",\"undefBp\":\"undefBp-881\",\"val\":1363,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [191] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[191] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [192] GET /doc-letters/{id} — Letter API
run_request "[192] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [193] POST /doc-limits — Limit API
run_request "[193] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":6283,\"advTextCred\":\"advTextCred-937\",\"advTextDeb\":\"advTextDeb-819\",\"amount\":603826.33,\"bdeRecVersion\":2574,\"bookTextCred\":\"bookTextCred-806\",\"bookTextDeb\":\"bookTextDeb-758\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-684\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-134\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-579\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-986\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-618\",\"nextReview\":\"nextReview-952\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6987,\"orderedBy\":\"orderedBy-371\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [194] GET /doc-limits/{id} — Limit API
run_request "[194] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [195] PATCH /doc-limits/{id} — Limit API
run_request "[195] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":5763,\"advTextCred\":\"advTextCred-144\",\"advTextDeb\":\"advTextDeb-169\",\"amount\":291782.35,\"bdeRecVersion\":5030,\"bookTextCred\":\"bookTextCred-737\",\"bookTextDeb\":\"bookTextDeb-839\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-468\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-166\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-798\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-654\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-584\",\"nextReview\":\"nextReview-234\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1817,\"orderedBy\":\"orderedBy-146\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [196] POST /doc-loans — Loan API
run_request "[196] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":7232,\"advTextCred\":\"advTextCred-203\",\"advTextDeb\":\"advTextDeb-839\",\"bdeRecVersion\":9672,\"bookTextCred\":\"bookTextCred-809\",\"bookTextDeb\":\"bookTextDeb-568\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-980\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-588\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-817\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-497\",\"intrGradManMarkup\":4823,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-129\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8372,\"orderedBy\":\"orderedBy-347\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6838,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [197] GET /doc-loans/{id} — Loan API
run_request "[197] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [198] PATCH /doc-loans/{id} — Loan API
run_request "[198] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":515,\"advTextCred\":\"advTextCred-813\",\"advTextDeb\":\"advTextDeb-294\",\"bdeRecVersion\":696,\"bookTextCred\":\"bookTextCred-494\",\"bookTextDeb\":\"bookTextDeb-473\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-701\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-893\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-998\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-274\",\"intrGradManMarkup\":9937,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-767\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2712,\"orderedBy\":\"orderedBy-198\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9020,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [199] POST /doc-mass-settles — Mass Settlement API
run_request "[199] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":1756,\"autoFillList\":true,\"bdeRecVersion\":7988,\"benefBpText\":\"benefBpText-244\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-975\",\"destBankBic\":\"UBSWCHZH80A\",\"destBankBpText\":\"destBankBpText-239\",\"destBankClr\":\"destBankClr-444\",\"destBankText\":\"destBankText-849\",\"destBenefText\":\"destBenefText-946\",\"destInfo\":\"destInfo-787\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-995\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-741\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-286\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-963\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":845,\"orderedBy\":\"orderedBy-155\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [200] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[200] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [201] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[201] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":5644,\"autoFillList\":true,\"bdeRecVersion\":1880,\"benefBpText\":\"benefBpText-557\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-748\",\"destBankBic\":\"UBSWCHZH80A\",\"destBankBpText\":\"destBankBpText-629\",\"destBankClr\":\"destBankClr-733\",\"destBankText\":\"destBankText-861\",\"destBenefText\":\"destBenefText-474\",\"destInfo\":\"destInfo-181\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-550\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-191\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-263\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-997\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3036,\"orderedBy\":\"orderedBy-315\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [202] POST /doc-mmkts — Money Market API
run_request "[202] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":2515,\"bdeRecVersion\":4915,\"capt\":7026,\"dcdStrike\":7219,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-892\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-482\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-464\",\"intrRate\":0.367,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-599\",\"maturityDate\":\"2026-03-17\",\"mktRate\":4.982,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2712,\"orderedBy\":\"orderedBy-300\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1306,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.477,\"settlePlanA\":true,\"trdrRate\":8.066,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [203] GET /doc-mmkts/{id} — Money Market API
run_request "[203] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [204] PATCH /doc-mmkts/{id} — Money Market API
run_request "[204] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":9018,\"bdeRecVersion\":4620,\"capt\":3468,\"dcdStrike\":103,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-139\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-426\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-859\",\"intrRate\":4.918,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-959\",\"maturityDate\":\"2026-03-17\",\"mktRate\":0.71,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5745,\"orderedBy\":\"orderedBy-514\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2945,\"respBpA\":true,\"respObjA\":true,\"rmRate\":5.527,\"settlePlanA\":true,\"trdrRate\":5.451,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [205] POST /doc-xfermons — Money Transfer API
run_request "[205] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":27,\"amount\":764368.44,\"bdeRecVersion\":4085,\"bulkItemIdent\":\"bulkItemIdent-990\",\"credAdvText\":\"credAdvText-271\",\"credBookText\":\"credBookText-739\",\"debAdvText\":\"debAdvText-646\",\"debBookText\":\"debBookText-835\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-310\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-688\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-516\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-637\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3861,\"orderedBy\":\"orderedBy-205\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [206] GET /doc-xfermons/{id} — Money Transfer API
run_request "[206] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [207] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[207] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":6802,\"amount\":290624,\"bdeRecVersion\":8198,\"bulkItemIdent\":\"bulkItemIdent-940\",\"credAdvText\":\"credAdvText-492\",\"credBookText\":\"credBookText-759\",\"debAdvText\":\"debAdvText-868\",\"debBookText\":\"debBookText-473\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-152\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-800\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-365\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-903\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6661,\"orderedBy\":\"orderedBy-215\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [208] POST /doc-oofxs — OTC FX Option API
run_request "[208] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":6698,\"advTextCred\":\"advTextCred-577\",\"advTextDeb\":\"advTextDeb-532\",\"bdeRecVersion\":9076,\"bookTextCred\":\"bookTextCred-246\",\"bookTextDeb\":\"bookTextDeb-895\",\"callQty\":8996,\"cutOffTime\":\"cutOffTime-952\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-659\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-544\",\"gross\":\"gross-235\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-122\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-609\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7240,\"orderedBy\":\"orderedBy-823\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-337\",\"putQty\":7361,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-224\",\"spread2\":\"spread2-971\",\"strike\":5194,\"strikePict\":3285,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [209] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[209] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [210] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[210] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":465,\"advTextCred\":\"advTextCred-842\",\"advTextDeb\":\"advTextDeb-405\",\"bdeRecVersion\":8287,\"bookTextCred\":\"bookTextCred-249\",\"bookTextDeb\":\"bookTextDeb-340\",\"callQty\":2047,\"cutOffTime\":\"cutOffTime-261\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-996\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-985\",\"gross\":\"gross-412\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-549\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-265\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7345,\"orderedBy\":\"orderedBy-904\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-775\",\"putQty\":4689,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-720\",\"spread2\":\"spread2-585\",\"strike\":6707,\"strikePict\":6499,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [211] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[211] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [212] GET /doc-otcopts/{id} — OTC Option API
run_request "[212] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [213] GET /doc-othsecs/{id} — Other Security API
run_request "[213] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [214] POST /doc-pays — Payment API
run_request "[214] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":3102,\"amount\":667623.99,\"bank\":\"bank-818\",\"bankAcc\":\"bankAcc-386\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-617\",\"bankCorr1\":\"bankCorr1-534\",\"bankCorr1Acc\":\"bankCorr1Acc-288\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-922\",\"bankCorr3\":\"bankCorr3-825\",\"bankCorr3Acc\":\"bankCorr3Acc-791\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-109\",\"bankCorr4\":\"bankCorr4-534\",\"bankCorr4Acc\":\"bankCorr4Acc-724\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-994\",\"bankInfo\":\"bankInfo-928\",\"bdeRecVersion\":4495,\"benef\":\"benef-118\",\"benefAcc\":\"benefAcc-128\",\"benefIban\":\"CH65402668414565322\",\"benefInfo\":\"benefInfo-903\",\"benefRefNr\":\"benefRefNr-858\",\"bookTextCred\":\"bookTextCred-950\",\"bookTextDeb\":\"bookTextDeb-131\",\"bulkItemIdent\":\"bulkItemIdent-849\",\"destCountry\":{\"id\":5,\"ident\":\"AT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-984\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-683\",\"hasPostit\":true,\"instrAmount\":161926.6,\"intlRefNr\":\"intlRefNr-630\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE5842021154\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-344\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-392\",\"ordBankAcc\":\"ordBankAcc-675\",\"ordBankClearNr\":\"ordBankClearNr-695\",\"ordRef\":\"ordRef-949\",\"orderDate\":\"2026-03-17\",\"orderNr\":3160,\"orderedBy\":\"orderedBy-401\",\"orderedByAcc\":\"orderedByAcc-558\",\"origGrpRef\":\"origGrpRef-639\",\"originCountry\":{\"id\":4,\"ident\":\"FR\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-369\",\"stordPeriodEnd\":\"stordPeriodEnd-102\",\"stordPeriodStart\":\"stordPeriodStart-917\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+33520196986\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [215] GET /doc-pays/{id} — Payment API
run_request "[215] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [216] PATCH /doc-pays/{id} — Payment API
run_request "[216] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":4154,\"amount\":675197.08,\"bank\":\"bank-900\",\"bankAcc\":\"bankAcc-553\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-104\",\"bankCorr1\":\"bankCorr1-615\",\"bankCorr1Acc\":\"bankCorr1Acc-891\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-215\",\"bankCorr3\":\"bankCorr3-392\",\"bankCorr3Acc\":\"bankCorr3Acc-831\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-770\",\"bankCorr4\":\"bankCorr4-969\",\"bankCorr4Acc\":\"bankCorr4Acc-601\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-552\",\"bankInfo\":\"bankInfo-774\",\"bdeRecVersion\":41,\"benef\":\"benef-636\",\"benefAcc\":\"benefAcc-102\",\"benefIban\":\"AT24920084836680289\",\"benefInfo\":\"benefInfo-349\",\"benefRefNr\":\"benefRefNr-899\",\"bookTextCred\":\"bookTextCred-164\",\"bookTextDeb\":\"bookTextDeb-260\",\"bulkItemIdent\":\"bulkItemIdent-701\",\"destCountry\":{\"id\":4,\"ident\":\"FR\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-381\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-199\",\"hasPostit\":true,\"instrAmount\":562928.6,\"intlRefNr\":\"intlRefNr-103\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH7449945181\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-491\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-781\",\"ordBankAcc\":\"ordBankAcc-978\",\"ordBankClearNr\":\"ordBankClearNr-126\",\"ordRef\":\"ordRef-851\",\"orderDate\":\"2026-03-17\",\"orderNr\":5550,\"orderedBy\":\"orderedBy-597\",\"orderedByAcc\":\"orderedByAcc-649\",\"origGrpRef\":\"origGrpRef-447\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-206\",\"stordPeriodEnd\":\"stordPeriodEnd-908\",\"stordPeriodStart\":\"stordPeriodStart-133\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39288804413\"}"

# [217] GET /doc-realsecs/{id} — Real Security API
run_request "[217] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [218] POST /doc-realtys — Realty API
run_request "[218] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":3451,\"bdeRecVersion\":9499,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-825\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-813\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-823\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-454\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1740,\"orderedBy\":\"orderedBy-842\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [219] GET /doc-realtys/{id} — Realty API
run_request "[219] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [220] PATCH /doc-realtys/{id} — Realty API
run_request "[220] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":1035,\"bdeRecVersion\":4498,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-390\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-297\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-984\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-300\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8835,\"orderedBy\":\"orderedBy-268\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>Capi Test Report · Part 3</title>
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
<h1>🧪 Capi Test Report <span style='color:#8b949e;font-size:14px'>Part 3 / 8</span></h1>
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