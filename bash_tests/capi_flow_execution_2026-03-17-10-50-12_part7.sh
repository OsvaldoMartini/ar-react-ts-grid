#!/usr/bin/env bash
# =============================================================
# Capi Test Runner — FLOW Execution (Part 7/8)
# Generated: 2026-03-17T10:50:15.668Z
# Cases:     1581–564 of 1596
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-17-10-50-12_part7_report.html"
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

# ── INIT HTML REPORT ─────────────────────────────────────────
echo "Starting 200 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [1581] GET /doc-othsecs/{id} — Other Security API
run_request "[1581] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [1582] POST /doc-pays — Payment API
run_request "[1582] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":555,\"amount\":343236.59,\"bank\":\"bank-527\",\"bankAcc\":\"bankAcc-836\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-958\",\"bankCorr1\":\"bankCorr1-988\",\"bankCorr1Acc\":\"bankCorr1Acc-967\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-460\",\"bankCorr3\":\"bankCorr3-225\",\"bankCorr3Acc\":\"bankCorr3Acc-850\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-876\",\"bankCorr4\":\"bankCorr4-951\",\"bankCorr4Acc\":\"bankCorr4Acc-548\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-987\",\"bankInfo\":\"bankInfo-660\",\"bdeRecVersion\":189,\"benef\":\"benef-499\",\"benefAcc\":\"benefAcc-241\",\"benefIban\":\"CH27922782038267732\",\"benefInfo\":\"benefInfo-545\",\"benefRefNr\":\"benefRefNr-994\",\"bookTextCred\":\"bookTextCred-845\",\"bookTextDeb\":\"bookTextDeb-735\",\"bulkItemIdent\":\"bulkItemIdent-414\",\"destCountry\":{\"id\":1,\"ident\":\"CH\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-260\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-448\",\"hasPostit\":true,\"instrAmount\":766827.28,\"intlRefNr\":\"intlRefNr-580\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"FR7702844982\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-102\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-938\",\"ordBankAcc\":\"ordBankAcc-526\",\"ordBankClearNr\":\"ordBankClearNr-179\",\"ordRef\":\"ordRef-198\",\"orderDate\":\"2026-03-17\",\"orderNr\":5379,\"orderedBy\":\"orderedBy-107\",\"orderedByAcc\":\"orderedByAcc-826\",\"origGrpRef\":\"origGrpRef-172\",\"originCountry\":{\"id\":2,\"ident\":\"DE\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-847\",\"stordPeriodEnd\":\"stordPeriodEnd-335\",\"stordPeriodStart\":\"stordPeriodStart-366\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39217721532\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1583] GET /doc-pays/{id} — Payment API
run_request "[1583] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [1584] PATCH /doc-pays/{id} — Payment API
run_request "[1584] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":1681,\"amount\":308823.88,\"bank\":\"bank-753\",\"bankAcc\":\"bankAcc-635\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-498\",\"bankCorr1\":\"bankCorr1-777\",\"bankCorr1Acc\":\"bankCorr1Acc-284\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-600\",\"bankCorr3\":\"bankCorr3-259\",\"bankCorr3Acc\":\"bankCorr3Acc-143\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-168\",\"bankCorr4\":\"bankCorr4-421\",\"bankCorr4Acc\":\"bankCorr4Acc-692\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-306\",\"bankInfo\":\"bankInfo-408\",\"bdeRecVersion\":6117,\"benef\":\"benef-800\",\"benefAcc\":\"benefAcc-227\",\"benefIban\":\"AT70577473494489226\",\"benefInfo\":\"benefInfo-922\",\"benefRefNr\":\"benefRefNr-199\",\"bookTextCred\":\"bookTextCred-894\",\"bookTextDeb\":\"bookTextDeb-651\",\"bulkItemIdent\":\"bulkItemIdent-579\",\"destCountry\":{\"id\":3,\"ident\":\"IT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-143\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-809\",\"hasPostit\":true,\"instrAmount\":403957.06,\"intlRefNr\":\"intlRefNr-778\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE9739137869\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-617\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-603\",\"ordBankAcc\":\"ordBankAcc-887\",\"ordBankClearNr\":\"ordBankClearNr-155\",\"ordRef\":\"ordRef-775\",\"orderDate\":\"2026-03-17\",\"orderNr\":1301,\"orderedBy\":\"orderedBy-688\",\"orderedByAcc\":\"orderedByAcc-990\",\"origGrpRef\":\"origGrpRef-321\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-630\",\"stordPeriodEnd\":\"stordPeriodEnd-546\",\"stordPeriodStart\":\"stordPeriodStart-292\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49472596048\"}"

# [1585] GET /doc-realsecs/{id} — Real Security API
run_request "[1585] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [1586] POST /doc-realtys — Realty API
run_request "[1586] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":5666,\"bdeRecVersion\":8315,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-408\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-368\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-821\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-342\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":920,\"orderedBy\":\"orderedBy-506\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1587] GET /doc-realtys/{id} — Realty API
run_request "[1587] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [1588] PATCH /doc-realtys/{id} — Realty API
run_request "[1588] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":7297,\"bdeRecVersion\":8310,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-544\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-324\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-307\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-648\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3864,\"orderedBy\":\"orderedBy-347\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1589] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[1589] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":9710,\"bdeRecVersion\":8907,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-200\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-104\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-287\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-747\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2892,\"orderedBy\":\"orderedBy-500\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1590] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1590] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [1591] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1591] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":5653,\"bdeRecVersion\":5620,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-222\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-251\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-907\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-328\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7531,\"orderedBy\":\"orderedBy-986\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1592] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[1592] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [1593] POST /doc-rebalss — Rebalancer Order API
run_request "[1593] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":3236,\"bdeRecVersion\":3513,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-885\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-802\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-497\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-425\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6654,\"orderedBy\":\"orderedBy-145\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1594] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[1594] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [1595] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[1595] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":2453,\"bdeRecVersion\":848,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-165\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-268\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-887\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-478\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4318,\"orderedBy\":\"orderedBy-401\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1596] GET /doc-repocs/{id} — Repo Contract API
run_request "[1596] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [381] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[381] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [382] POST /doc-ctact2s — Contact Management (V2) API
run_request "[382] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":4043,\"attch\":\"attch-103\",\"attchA\":true,\"bdeRecVersion\":1667,\"campgnCltReaction\":\"campgnCltReaction-664\",\"campgnRespKey\":\"campgnRespKey-331\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-872\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-306\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-945\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-560\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-284\",\"linkDocListA\":true,\"loc\":\"loc-695\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3446,\"orderedBy\":\"orderedBy-254\",\"particListA\":true,\"questrSeqNr\":1899,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":9390,\"reactComment\":\"reactComment-663\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-569\",\"reactNrPartic\":7556,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-820\",\"subjA\":true,\"syncSeqNr\":3233,\"totExpndTimeM\":970,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [383] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[383] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [384] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[384] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":8028,\"attch\":\"attch-219\",\"attchA\":true,\"bdeRecVersion\":5758,\"campgnCltReaction\":\"campgnCltReaction-440\",\"campgnRespKey\":\"campgnRespKey-402\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-510\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-622\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-776\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-922\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-975\",\"linkDocListA\":true,\"loc\":\"loc-595\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2503,\"orderedBy\":\"orderedBy-766\",\"particListA\":true,\"questrSeqNr\":4663,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":8998,\"reactComment\":\"reactComment-240\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-109\",\"reactNrPartic\":2439,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-278\",\"subjA\":true,\"syncSeqNr\":6069,\"totExpndTimeM\":7845,\"trxDate\":\"2026-03-17\"}"

# [385] GET /doc-cmgs/{id} — Cashier Management API
run_request "[385] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [386] GET /doc-cops/{id} — Cashier Operations API
run_request "[386] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [387] POST /doc-clts — Client Opening API
run_request "[387] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [388] GET /doc-clts/{id} — Client Opening API
run_request "[388] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [389] PATCH /doc-clts/{id} — Client Opening API
run_request "[389] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [390] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[390] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [391] GET /doc-cltms/{id} — Collateral Movement API
run_request "[391] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [392] GET /doc-cords/{id} — Collective Order API
run_request "[392] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [393] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[393] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [394] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[394] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [395] POST /doc-xioms — External Investment Order Manager API
run_request "[395] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":9902,\"bdeRecVersion\":5281,\"bpLevelRep\":true,\"descn\":\"descn-615\",\"extlRefNr\":\"extlRefNr-661\",\"extlRepLang\":\"extlRepLang-218\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-278\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-798\",\"linkGrp\":6267,\"orderDate\":\"2026-03-17\",\"orderNr\":273,\"orderedBy\":\"orderedBy-666\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [396] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[396] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [397] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[397] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":8750,\"bdeRecVersion\":6161,\"bpLevelRep\":true,\"descn\":\"descn-918\",\"extlRefNr\":\"extlRefNr-103\",\"extlRepLang\":\"extlRepLang-544\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-653\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-761\",\"linkGrp\":8500,\"orderDate\":\"2026-03-17\",\"orderNr\":8106,\"orderedBy\":\"orderedBy-746\",\"sendRepToEbank\":true}"

# [398] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[398] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [399] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[399] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [400] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[400] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [401] POST /doc-fxsws — FX Swap API
run_request "[401] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-114\",\"bdeRecVersion\":2654,\"buyBookText1\":\"buyBookText1-621\",\"buyBookText2\":\"buyBookText2-259\",\"buyQty1\":7082,\"buyQty2\":1501,\"cfi\":\"cfi-669\",\"dealFwdRate1\":5.637,\"dealFwdRate2\":2.975,\"dealSpotRate1\":6.522,\"dealSpotRate2\":7.483,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE4010229540\",\"lastTrans\":\"lastTrans-837\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-861\",\"period1\":\"period1-344\",\"period2\":\"period2-977\",\"sellBookText1\":\"sellBookText1-336\",\"sellBookText2\":\"sellBookText2-822\",\"sellQty1\":2194,\"sellQty2\":8305,\"spotDate\":\"2026-03-17\",\"trdrRate1\":4.648,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [402] GET /doc-fxsws/{id} — FX Swap API
run_request "[402] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [403] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[403] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-354\",\"bdeRecVersion\":5606,\"buyBookText1\":\"buyBookText1-553\",\"buyBookText2\":\"buyBookText2-402\",\"buyQty1\":7326,\"buyQty2\":5973,\"cfi\":\"cfi-253\",\"dealFwdRate1\":8.243,\"dealFwdRate2\":6.3,\"dealSpotRate1\":0.364,\"dealSpotRate2\":8.421,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR8645647775\",\"lastTrans\":\"lastTrans-812\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-773\",\"period1\":\"period1-772\",\"period2\":\"period2-999\",\"sellBookText1\":\"sellBookText1-849\",\"sellBookText2\":\"sellBookText2-404\",\"sellQty1\":3882,\"sellQty2\":5524,\"spotDate\":\"2026-03-17\",\"trdrRate1\":2.266,\"trxDate\":\"2026-03-17\"}"

# [404] POST /doc-fxtrs — FXTR API
run_request "[404] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":4754,\"advText\":\"advText-374\",\"bdeRecVersion\":8268,\"buyQty\":5661,\"dealFwdRate\":8.117,\"dealSpotRate\":3.116,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-400\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-222\",\"fwdSpread\":1499,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-960\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-447\",\"limit\":3411,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":9497,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3716,\"orderedBy\":\"orderedBy-926\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-697\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8160,\"settlePlanA\":true,\"spotSpread1\":1449,\"spotSpread2\":9163,\"trdrRate\":3.958,\"trigPrice\":2249,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44656954805\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [405] GET /doc-fxtrs/{id} — FXTR API
run_request "[405] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [406] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[406] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":2704,\"advText\":\"advText-861\",\"bdeRecVersion\":968,\"buyQty\":2088,\"dealFwdRate\":7.036,\"dealSpotRate\":0.683,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-918\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-364\",\"fwdSpread\":3711,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-698\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-133\",\"limit\":1107,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":1739,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3738,\"orderedBy\":\"orderedBy-812\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-269\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8520,\"settlePlanA\":true,\"spotSpread1\":3245,\"spotSpread2\":2394,\"trdrRate\":1.135,\"trigPrice\":8248,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+49699497859\"}"

# [407] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[407] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [408] POST /doc-inpays — Incoming Payment API
run_request "[408] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":3550,\"amount\":109289.87,\"bankClearNr\":\"bankClearNr-332\",\"bankInfo\":\"bankInfo-691\",\"bdeRecVersion\":1945,\"benefAcc\":\"benefAcc-527\",\"benefRefNr\":\"benefRefNr-282\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-129\",\"contrPeriodStart\":\"contrPeriodStart-888\",\"credAddr\":\"credAddr-670\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-841\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-640\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-769\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-352\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-158\",\"orderDate\":\"2026-03-17\",\"orderNr\":3192,\"orderedBy\":\"orderedBy-901\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payerAcc\":\"payerAcc-899\",\"payerAddrTxt\":\"payerAddrTxt-851\",\"payerIban\":\"FR93135083010778469\",\"payerInfo\":\"payerInfo-699\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-634\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [409] GET /doc-inpays/{id} — Incoming Payment API
run_request "[409] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [410] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[410] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":1553,\"amount\":107540.19,\"bankClearNr\":\"bankClearNr-693\",\"bankInfo\":\"bankInfo-572\",\"bdeRecVersion\":4496,\"benefAcc\":\"benefAcc-189\",\"benefRefNr\":\"benefRefNr-233\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-106\",\"contrPeriodStart\":\"contrPeriodStart-893\",\"credAddr\":\"credAddr-140\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-114\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-424\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-791\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-473\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-648\",\"orderDate\":\"2026-03-17\",\"orderNr\":3191,\"orderedBy\":\"orderedBy-603\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-590\",\"payerAddrTxt\":\"payerAddrTxt-460\",\"payerIban\":\"FR90335098658823938\",\"payerInfo\":\"payerInfo-919\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-509\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [411] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[411] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [412] GET /doc-intrs/{id} — Interest API
run_request "[412] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [413] POST /doc-invst-bdls — Investment Bundler API
run_request "[413] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":1534,\"bdeRecVersion\":8326,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-672\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-605\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-517\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-534\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9583,\"orderedBy\":\"orderedBy-904\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":3167,\"remnBaccBalMin\":7270,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [414] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[414] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [415] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[415] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":1439,\"bdeRecVersion\":5403,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-461\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-208\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-538\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-793\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3293,\"orderedBy\":\"orderedBy-592\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":5769,\"remnBaccBalMin\":8124,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [416] POST /doc-crm-issues — Issue Management API
run_request "[416] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-468\",\"advNr\":3088,\"allDayEvt\":true,\"attch\":\"attch-496\",\"bdeRecVersion\":3972,\"campgnTaskSeqNr\":6594,\"descn\":\"descn-304\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-198\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-675\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-330\",\"findingKey\":\"findingKey-537\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-803\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-877\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-754\",\"location\":\"location-601\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":4877,\"orderedBy\":\"orderedBy-165\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":129,\"qtyLinked\":2952,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-306\",\"subject\":\"subject-657\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-280\",\"undefBp\":\"undefBp-885\",\"val\":1747,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [417] GET /doc-crm-issues/{id} — Issue Management API
run_request "[417] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [418] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[418] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-497\",\"advNr\":5816,\"allDayEvt\":true,\"attch\":\"attch-697\",\"bdeRecVersion\":1567,\"campgnTaskSeqNr\":284,\"descn\":\"descn-416\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-835\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-959\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-796\",\"findingKey\":\"findingKey-637\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-317\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-213\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-538\",\"location\":\"location-993\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7067,\"orderedBy\":\"orderedBy-845\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8129,\"qtyLinked\":9598,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-439\",\"subject\":\"subject-951\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-814\",\"undefBp\":\"undefBp-525\",\"val\":9445,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [419] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[419] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [420] GET /doc-letters/{id} — Letter API
run_request "[420] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [421] POST /doc-limits — Limit API
run_request "[421] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":467,\"advTextCred\":\"advTextCred-657\",\"advTextDeb\":\"advTextDeb-980\",\"amount\":551641.19,\"bdeRecVersion\":4049,\"bookTextCred\":\"bookTextCred-237\",\"bookTextDeb\":\"bookTextDeb-302\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-195\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-192\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-720\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-146\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-870\",\"nextReview\":\"nextReview-310\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2949,\"orderedBy\":\"orderedBy-527\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [422] GET /doc-limits/{id} — Limit API
run_request "[422] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [423] PATCH /doc-limits/{id} — Limit API
run_request "[423] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":8759,\"advTextCred\":\"advTextCred-704\",\"advTextDeb\":\"advTextDeb-136\",\"amount\":59784.57,\"bdeRecVersion\":9589,\"bookTextCred\":\"bookTextCred-413\",\"bookTextDeb\":\"bookTextDeb-654\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-396\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-337\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-496\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-199\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-167\",\"nextReview\":\"nextReview-548\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6217,\"orderedBy\":\"orderedBy-160\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [424] POST /doc-loans — Loan API
run_request "[424] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":5329,\"advTextCred\":\"advTextCred-193\",\"advTextDeb\":\"advTextDeb-401\",\"bdeRecVersion\":1642,\"bookTextCred\":\"bookTextCred-968\",\"bookTextDeb\":\"bookTextDeb-348\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-329\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-157\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-811\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-151\",\"intrGradManMarkup\":6319,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-699\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6271,\"orderedBy\":\"orderedBy-924\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4113,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [425] GET /doc-loans/{id} — Loan API
run_request "[425] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [426] PATCH /doc-loans/{id} — Loan API
run_request "[426] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":2473,\"advTextCred\":\"advTextCred-215\",\"advTextDeb\":\"advTextDeb-828\",\"bdeRecVersion\":944,\"bookTextCred\":\"bookTextCred-879\",\"bookTextDeb\":\"bookTextDeb-887\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-376\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-438\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-323\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-323\",\"intrGradManMarkup\":9937,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-482\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1676,\"orderedBy\":\"orderedBy-820\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":517,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [427] POST /doc-mass-settles — Mass Settlement API
run_request "[427] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":1563,\"autoFillList\":true,\"bdeRecVersion\":9835,\"benefBpText\":\"benefBpText-104\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-676\",\"destBankBic\":\"DEUTDEDB\",\"destBankBpText\":\"destBankBpText-713\",\"destBankClr\":\"destBankClr-551\",\"destBankText\":\"destBankText-535\",\"destBenefText\":\"destBenefText-413\",\"destInfo\":\"destInfo-562\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-363\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-244\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-950\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-477\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":667,\"orderedBy\":\"orderedBy-519\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [428] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[428] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [429] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[429] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":2771,\"autoFillList\":true,\"bdeRecVersion\":1000,\"benefBpText\":\"benefBpText-617\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-191\",\"destBankBic\":\"DEUTDEDB\",\"destBankBpText\":\"destBankBpText-145\",\"destBankClr\":\"destBankClr-572\",\"destBankText\":\"destBankText-852\",\"destBenefText\":\"destBenefText-477\",\"destInfo\":\"destInfo-707\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-706\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-142\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-550\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-741\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":903,\"orderedBy\":\"orderedBy-740\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [430] POST /doc-mmkts — Money Market API
run_request "[430] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":6125,\"bdeRecVersion\":9482,\"capt\":7969,\"dcdStrike\":4016,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-376\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-966\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-642\",\"intrRate\":6.513,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-189\",\"maturityDate\":\"2026-03-17\",\"mktRate\":3.384,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":593,\"orderedBy\":\"orderedBy-392\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1081,\"respBpA\":true,\"respObjA\":true,\"rmRate\":0.976,\"settlePlanA\":true,\"trdrRate\":1.044,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [431] GET /doc-mmkts/{id} — Money Market API
run_request "[431] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [432] PATCH /doc-mmkts/{id} — Money Market API
run_request "[432] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":4088,\"bdeRecVersion\":3194,\"capt\":6646,\"dcdStrike\":1861,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-341\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-286\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-907\",\"intrRate\":2.51,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-322\",\"maturityDate\":\"2026-03-17\",\"mktRate\":6.673,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8327,\"orderedBy\":\"orderedBy-403\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8070,\"respBpA\":true,\"respObjA\":true,\"rmRate\":7.963,\"settlePlanA\":true,\"trdrRate\":0.598,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [433] POST /doc-xfermons — Money Transfer API
run_request "[433] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":9820,\"amount\":442905.84,\"bdeRecVersion\":9574,\"bulkItemIdent\":\"bulkItemIdent-511\",\"credAdvText\":\"credAdvText-225\",\"credBookText\":\"credBookText-908\",\"debAdvText\":\"debAdvText-977\",\"debBookText\":\"debBookText-666\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-290\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-277\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-978\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-742\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2805,\"orderedBy\":\"orderedBy-596\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [434] GET /doc-xfermons/{id} — Money Transfer API
run_request "[434] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [435] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[435] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":3746,\"amount\":894115.57,\"bdeRecVersion\":6969,\"bulkItemIdent\":\"bulkItemIdent-243\",\"credAdvText\":\"credAdvText-872\",\"credBookText\":\"credBookText-280\",\"debAdvText\":\"debAdvText-463\",\"debBookText\":\"debBookText-285\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-653\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-478\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-541\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-179\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2162,\"orderedBy\":\"orderedBy-551\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [436] POST /doc-oofxs — OTC FX Option API
run_request "[436] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":2444,\"advTextCred\":\"advTextCred-995\",\"advTextDeb\":\"advTextDeb-168\",\"bdeRecVersion\":3475,\"bookTextCred\":\"bookTextCred-636\",\"bookTextDeb\":\"bookTextDeb-266\",\"callQty\":5613,\"cutOffTime\":\"cutOffTime-814\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-850\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-269\",\"gross\":\"gross-180\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-385\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-153\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7228,\"orderedBy\":\"orderedBy-102\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-315\",\"putQty\":6123,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-454\",\"spread2\":\"spread2-796\",\"strike\":324,\"strikePict\":9829,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [437] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[437] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [438] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[438] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":875,\"advTextCred\":\"advTextCred-486\",\"advTextDeb\":\"advTextDeb-318\",\"bdeRecVersion\":937,\"bookTextCred\":\"bookTextCred-119\",\"bookTextDeb\":\"bookTextDeb-889\",\"callQty\":8983,\"cutOffTime\":\"cutOffTime-972\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-212\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-346\",\"gross\":\"gross-195\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-483\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-489\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7635,\"orderedBy\":\"orderedBy-793\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-249\",\"putQty\":6371,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-406\",\"spread2\":\"spread2-223\",\"strike\":2884,\"strikePict\":2369,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [439] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[439] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [440] GET /doc-otcopts/{id} — OTC Option API
run_request "[440] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [441] GET /doc-othsecs/{id} — Other Security API
run_request "[441] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [442] POST /doc-pays — Payment API
run_request "[442] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":6596,\"amount\":546501.15,\"bank\":\"bank-308\",\"bankAcc\":\"bankAcc-333\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-317\",\"bankCorr1\":\"bankCorr1-649\",\"bankCorr1Acc\":\"bankCorr1Acc-674\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-190\",\"bankCorr3\":\"bankCorr3-672\",\"bankCorr3Acc\":\"bankCorr3Acc-169\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-972\",\"bankCorr4\":\"bankCorr4-349\",\"bankCorr4Acc\":\"bankCorr4Acc-286\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-798\",\"bankInfo\":\"bankInfo-640\",\"bdeRecVersion\":8003,\"benef\":\"benef-645\",\"benefAcc\":\"benefAcc-495\",\"benefIban\":\"AT48147516990476244\",\"benefInfo\":\"benefInfo-383\",\"benefRefNr\":\"benefRefNr-771\",\"bookTextCred\":\"bookTextCred-692\",\"bookTextDeb\":\"bookTextDeb-180\",\"bulkItemIdent\":\"bulkItemIdent-955\",\"destCountry\":{\"id\":5,\"ident\":\"AT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-964\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-509\",\"hasPostit\":true,\"instrAmount\":69421.96,\"intlRefNr\":\"intlRefNr-269\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH6525083687\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-454\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-352\",\"ordBankAcc\":\"ordBankAcc-767\",\"ordBankClearNr\":\"ordBankClearNr-704\",\"ordRef\":\"ordRef-168\",\"orderDate\":\"2026-03-17\",\"orderNr\":5453,\"orderedBy\":\"orderedBy-530\",\"orderedByAcc\":\"orderedByAcc-124\",\"origGrpRef\":\"origGrpRef-524\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-287\",\"stordPeriodEnd\":\"stordPeriodEnd-836\",\"stordPeriodStart\":\"stordPeriodStart-104\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+44225625254\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [443] GET /doc-pays/{id} — Payment API
run_request "[443] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [444] PATCH /doc-pays/{id} — Payment API
run_request "[444] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":8334,\"amount\":509476.75,\"bank\":\"bank-829\",\"bankAcc\":\"bankAcc-447\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-160\",\"bankCorr1\":\"bankCorr1-359\",\"bankCorr1Acc\":\"bankCorr1Acc-782\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-491\",\"bankCorr3\":\"bankCorr3-668\",\"bankCorr3Acc\":\"bankCorr3Acc-136\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-591\",\"bankCorr4\":\"bankCorr4-136\",\"bankCorr4Acc\":\"bankCorr4Acc-429\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-629\",\"bankInfo\":\"bankInfo-204\",\"bdeRecVersion\":1049,\"benef\":\"benef-520\",\"benefAcc\":\"benefAcc-194\",\"benefIban\":\"CH36856340298946116\",\"benefInfo\":\"benefInfo-541\",\"benefRefNr\":\"benefRefNr-250\",\"bookTextCred\":\"bookTextCred-284\",\"bookTextDeb\":\"bookTextDeb-668\",\"bulkItemIdent\":\"bulkItemIdent-731\",\"destCountry\":{\"id\":1,\"ident\":\"CH\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-222\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-966\",\"hasPostit\":true,\"instrAmount\":988689.29,\"intlRefNr\":\"intlRefNr-187\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"FR1373056838\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-247\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-573\",\"ordBankAcc\":\"ordBankAcc-921\",\"ordBankClearNr\":\"ordBankClearNr-543\",\"ordRef\":\"ordRef-455\",\"orderDate\":\"2026-03-17\",\"orderNr\":6681,\"orderedBy\":\"orderedBy-985\",\"orderedByAcc\":\"orderedByAcc-669\",\"origGrpRef\":\"origGrpRef-721\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-991\",\"stordPeriodEnd\":\"stordPeriodEnd-639\",\"stordPeriodStart\":\"stordPeriodStart-827\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49306786452\"}"

# [445] GET /doc-realsecs/{id} — Real Security API
run_request "[445] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [446] POST /doc-realtys — Realty API
run_request "[446] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":713,\"bdeRecVersion\":8172,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-688\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-801\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-898\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-776\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7992,\"orderedBy\":\"orderedBy-171\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [447] GET /doc-realtys/{id} — Realty API
run_request "[447] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [448] PATCH /doc-realtys/{id} — Realty API
run_request "[448] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":9294,\"bdeRecVersion\":4018,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-460\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-905\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-193\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-276\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7914,\"orderedBy\":\"orderedBy-317\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [449] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[449] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":8489,\"bdeRecVersion\":1193,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-269\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-118\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-542\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-829\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9633,\"orderedBy\":\"orderedBy-995\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [450] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[450] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [451] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[451] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":1890,\"bdeRecVersion\":2671,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-708\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-999\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-638\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-896\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6398,\"orderedBy\":\"orderedBy-192\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [452] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[452] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [453] POST /doc-rebalss — Rebalancer Order API
run_request "[453] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":7722,\"bdeRecVersion\":7423,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-761\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-223\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-542\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-251\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4096,\"orderedBy\":\"orderedBy-819\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [454] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[454] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [455] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[455] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":3341,\"bdeRecVersion\":2469,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-279\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-734\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-111\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-704\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8585,\"orderedBy\":\"orderedBy-427\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [456] GET /doc-repocs/{id} — Repo Contract API
run_request "[456] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [457] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[457] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [458] POST /doc-ctact2s — Contact Management (V2) API
run_request "[458] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":2861,\"attch\":\"attch-683\",\"attchA\":true,\"bdeRecVersion\":4314,\"campgnCltReaction\":\"campgnCltReaction-333\",\"campgnRespKey\":\"campgnRespKey-429\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-580\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-214\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-358\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-521\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-394\",\"linkDocListA\":true,\"loc\":\"loc-903\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5794,\"orderedBy\":\"orderedBy-315\",\"particListA\":true,\"questrSeqNr\":8001,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":6023,\"reactComment\":\"reactComment-364\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-512\",\"reactNrPartic\":2100,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-358\",\"subjA\":true,\"syncSeqNr\":8568,\"totExpndTimeM\":4805,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [459] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[459] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [460] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[460] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":6388,\"attch\":\"attch-654\",\"attchA\":true,\"bdeRecVersion\":3639,\"campgnCltReaction\":\"campgnCltReaction-258\",\"campgnRespKey\":\"campgnRespKey-389\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-565\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-304\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-815\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-750\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-701\",\"linkDocListA\":true,\"loc\":\"loc-968\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":368,\"orderedBy\":\"orderedBy-417\",\"particListA\":true,\"questrSeqNr\":8649,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":7579,\"reactComment\":\"reactComment-510\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-511\",\"reactNrPartic\":3943,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-879\",\"subjA\":true,\"syncSeqNr\":2011,\"totExpndTimeM\":9326,\"trxDate\":\"2026-03-17\"}"

# [461] GET /doc-cmgs/{id} — Cashier Management API
run_request "[461] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [462] GET /doc-cops/{id} — Cashier Operations API
run_request "[462] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [463] POST /doc-clts — Client Opening API
run_request "[463] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [464] GET /doc-clts/{id} — Client Opening API
run_request "[464] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [465] PATCH /doc-clts/{id} — Client Opening API
run_request "[465] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [466] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[466] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [467] GET /doc-cltms/{id} — Collateral Movement API
run_request "[467] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [468] GET /doc-cords/{id} — Collective Order API
run_request "[468] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [469] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[469] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [470] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[470] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [471] POST /doc-xioms — External Investment Order Manager API
run_request "[471] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":7275,\"bdeRecVersion\":5424,\"bpLevelRep\":true,\"descn\":\"descn-123\",\"extlRefNr\":\"extlRefNr-146\",\"extlRepLang\":\"extlRepLang-339\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-326\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-367\",\"linkGrp\":6304,\"orderDate\":\"2026-03-17\",\"orderNr\":2367,\"orderedBy\":\"orderedBy-657\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [472] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[472] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [473] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[473] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":3020,\"bdeRecVersion\":9650,\"bpLevelRep\":true,\"descn\":\"descn-799\",\"extlRefNr\":\"extlRefNr-464\",\"extlRepLang\":\"extlRepLang-122\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-267\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-854\",\"linkGrp\":4027,\"orderDate\":\"2026-03-17\",\"orderNr\":6891,\"orderedBy\":\"orderedBy-553\",\"sendRepToEbank\":true}"

# [474] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[474] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [475] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[475] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [476] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[476] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [477] POST /doc-fxsws — FX Swap API
run_request "[477] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-259\",\"bdeRecVersion\":8486,\"buyBookText1\":\"buyBookText1-341\",\"buyBookText2\":\"buyBookText2-761\",\"buyQty1\":9039,\"buyQty2\":1870,\"cfi\":\"cfi-206\",\"dealFwdRate1\":0.112,\"dealFwdRate2\":7.47,\"dealSpotRate1\":5.821,\"dealSpotRate2\":2.994,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE3257670486\",\"lastTrans\":\"lastTrans-420\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-162\",\"period1\":\"period1-464\",\"period2\":\"period2-695\",\"sellBookText1\":\"sellBookText1-204\",\"sellBookText2\":\"sellBookText2-163\",\"sellQty1\":9012,\"sellQty2\":2461,\"spotDate\":\"2026-03-17\",\"trdrRate1\":0.696,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [478] GET /doc-fxsws/{id} — FX Swap API
run_request "[478] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [479] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[479] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-347\",\"bdeRecVersion\":6143,\"buyBookText1\":\"buyBookText1-937\",\"buyBookText2\":\"buyBookText2-399\",\"buyQty1\":7253,\"buyQty2\":7218,\"cfi\":\"cfi-126\",\"dealFwdRate1\":8.42,\"dealFwdRate2\":2.983,\"dealSpotRate1\":1.953,\"dealSpotRate2\":7.483,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH3655901260\",\"lastTrans\":\"lastTrans-193\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-108\",\"period1\":\"period1-551\",\"period2\":\"period2-568\",\"sellBookText1\":\"sellBookText1-701\",\"sellBookText2\":\"sellBookText2-356\",\"sellQty1\":4390,\"sellQty2\":8362,\"spotDate\":\"2026-03-17\",\"trdrRate1\":7.243,\"trxDate\":\"2026-03-17\"}"

# [480] POST /doc-fxtrs — FXTR API
run_request "[480] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":6210,\"advText\":\"advText-518\",\"bdeRecVersion\":4026,\"buyQty\":1153,\"dealFwdRate\":1.732,\"dealSpotRate\":2.035,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-977\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-343\",\"fwdSpread\":517,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-868\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-299\",\"limit\":6995,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4316,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9057,\"orderedBy\":\"orderedBy-595\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-331\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1342,\"settlePlanA\":true,\"spotSpread1\":2495,\"spotSpread2\":6549,\"trdrRate\":6.735,\"trigPrice\":4572,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+41518496175\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [481] GET /doc-fxtrs/{id} — FXTR API
run_request "[481] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [482] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[482] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":7917,\"advText\":\"advText-580\",\"bdeRecVersion\":6333,\"buyQty\":587,\"dealFwdRate\":4.815,\"dealSpotRate\":3.874,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-116\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-623\",\"fwdSpread\":7452,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-430\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-809\",\"limit\":2871,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":921,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9463,\"orderedBy\":\"orderedBy-121\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-270\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4962,\"settlePlanA\":true,\"spotSpread1\":1253,\"spotSpread2\":2205,\"trdrRate\":7.408,\"trigPrice\":4021,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44853410922\"}"

# [483] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[483] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [484] POST /doc-inpays — Incoming Payment API
run_request "[484] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":6980,\"amount\":923808.47,\"bankClearNr\":\"bankClearNr-284\",\"bankInfo\":\"bankInfo-663\",\"bdeRecVersion\":2073,\"benefAcc\":\"benefAcc-920\",\"benefRefNr\":\"benefRefNr-710\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-448\",\"contrPeriodStart\":\"contrPeriodStart-383\",\"credAddr\":\"credAddr-647\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-274\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-280\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-242\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-605\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-416\",\"orderDate\":\"2026-03-17\",\"orderNr\":261,\"orderedBy\":\"orderedBy-480\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payerAcc\":\"payerAcc-574\",\"payerAddrTxt\":\"payerAddrTxt-961\",\"payerIban\":\"DE26155810185663184\",\"payerInfo\":\"payerInfo-563\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-894\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [485] GET /doc-inpays/{id} — Incoming Payment API
run_request "[485] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [486] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[486] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":3892,\"amount\":355776.37,\"bankClearNr\":\"bankClearNr-201\",\"bankInfo\":\"bankInfo-802\",\"bdeRecVersion\":1139,\"benefAcc\":\"benefAcc-664\",\"benefRefNr\":\"benefRefNr-978\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-937\",\"contrPeriodStart\":\"contrPeriodStart-538\",\"credAddr\":\"credAddr-353\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-436\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-602\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-244\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-495\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-750\",\"orderDate\":\"2026-03-17\",\"orderNr\":7090,\"orderedBy\":\"orderedBy-224\",\"originCountry\":{\"id\":2,\"ident\":\"DE\"},\"payerAcc\":\"payerAcc-916\",\"payerAddrTxt\":\"payerAddrTxt-476\",\"payerIban\":\"DE63853660545371223\",\"payerInfo\":\"payerInfo-821\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-139\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [487] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[487] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [488] GET /doc-intrs/{id} — Interest API
run_request "[488] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [489] POST /doc-invst-bdls — Investment Bundler API
run_request "[489] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":3367,\"bdeRecVersion\":7345,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-685\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-222\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-829\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-303\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7015,\"orderedBy\":\"orderedBy-658\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":7771,\"remnBaccBalMin\":956,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [490] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[490] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [491] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[491] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":6875,\"bdeRecVersion\":867,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-524\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-358\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-703\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-544\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7841,\"orderedBy\":\"orderedBy-991\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":314,\"remnBaccBalMin\":1128,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [492] POST /doc-crm-issues — Issue Management API
run_request "[492] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-594\",\"advNr\":3389,\"allDayEvt\":true,\"attch\":\"attch-343\",\"bdeRecVersion\":5765,\"campgnTaskSeqNr\":5269,\"descn\":\"descn-625\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-468\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-796\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-512\",\"findingKey\":\"findingKey-253\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-385\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-303\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-481\",\"location\":\"location-667\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5845,\"orderedBy\":\"orderedBy-508\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8864,\"qtyLinked\":2313,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-935\",\"subject\":\"subject-482\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-220\",\"undefBp\":\"undefBp-376\",\"val\":7585,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [493] GET /doc-crm-issues/{id} — Issue Management API
run_request "[493] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [494] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[494] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-520\",\"advNr\":2969,\"allDayEvt\":true,\"attch\":\"attch-413\",\"bdeRecVersion\":484,\"campgnTaskSeqNr\":1969,\"descn\":\"descn-141\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-376\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-972\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-980\",\"findingKey\":\"findingKey-324\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-593\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-977\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-495\",\"location\":\"location-341\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9324,\"orderedBy\":\"orderedBy-862\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5985,\"qtyLinked\":8484,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-749\",\"subject\":\"subject-256\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-340\",\"undefBp\":\"undefBp-848\",\"val\":2747,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [495] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[495] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [496] GET /doc-letters/{id} — Letter API
run_request "[496] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [497] POST /doc-limits — Limit API
run_request "[497] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":4207,\"advTextCred\":\"advTextCred-259\",\"advTextDeb\":\"advTextDeb-855\",\"amount\":271541.39,\"bdeRecVersion\":1760,\"bookTextCred\":\"bookTextCred-661\",\"bookTextDeb\":\"bookTextDeb-111\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-151\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-722\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-604\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-276\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-161\",\"nextReview\":\"nextReview-185\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7237,\"orderedBy\":\"orderedBy-556\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [498] GET /doc-limits/{id} — Limit API
run_request "[498] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [499] PATCH /doc-limits/{id} — Limit API
run_request "[499] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":6925,\"advTextCred\":\"advTextCred-532\",\"advTextDeb\":\"advTextDeb-320\",\"amount\":262147.93,\"bdeRecVersion\":9613,\"bookTextCred\":\"bookTextCred-877\",\"bookTextDeb\":\"bookTextDeb-872\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-114\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-883\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-471\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-834\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-302\",\"nextReview\":\"nextReview-280\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1791,\"orderedBy\":\"orderedBy-300\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [500] POST /doc-loans — Loan API
run_request "[500] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":1226,\"advTextCred\":\"advTextCred-774\",\"advTextDeb\":\"advTextDeb-339\",\"bdeRecVersion\":2415,\"bookTextCred\":\"bookTextCred-480\",\"bookTextDeb\":\"bookTextDeb-608\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-590\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-103\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-255\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-899\",\"intrGradManMarkup\":8225,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-259\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1855,\"orderedBy\":\"orderedBy-161\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8560,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [501] GET /doc-loans/{id} — Loan API
run_request "[501] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [502] PATCH /doc-loans/{id} — Loan API
run_request "[502] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":9789,\"advTextCred\":\"advTextCred-544\",\"advTextDeb\":\"advTextDeb-607\",\"bdeRecVersion\":3686,\"bookTextCred\":\"bookTextCred-366\",\"bookTextDeb\":\"bookTextDeb-425\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-791\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-195\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-459\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-514\",\"intrGradManMarkup\":5867,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-955\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2626,\"orderedBy\":\"orderedBy-570\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9011,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [503] POST /doc-mass-settles — Mass Settlement API
run_request "[503] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":5603,\"autoFillList\":true,\"bdeRecVersion\":6578,\"benefBpText\":\"benefBpText-357\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-651\",\"destBankBic\":\"UBSWCHZH80A\",\"destBankBpText\":\"destBankBpText-626\",\"destBankClr\":\"destBankClr-513\",\"destBankText\":\"destBankText-475\",\"destBenefText\":\"destBenefText-957\",\"destInfo\":\"destInfo-198\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-395\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-764\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-189\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-610\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5307,\"orderedBy\":\"orderedBy-989\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [504] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[504] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [505] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[505] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":3093,\"autoFillList\":true,\"bdeRecVersion\":3153,\"benefBpText\":\"benefBpText-340\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-275\",\"destBankBic\":\"DEUTDEDB\",\"destBankBpText\":\"destBankBpText-125\",\"destBankClr\":\"destBankClr-920\",\"destBankText\":\"destBankText-449\",\"destBenefText\":\"destBenefText-642\",\"destInfo\":\"destInfo-487\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-332\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-940\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-707\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-212\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2302,\"orderedBy\":\"orderedBy-683\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [506] POST /doc-mmkts — Money Market API
run_request "[506] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":4964,\"bdeRecVersion\":7244,\"capt\":2720,\"dcdStrike\":3909,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-557\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-766\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-601\",\"intrRate\":4.262,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-669\",\"maturityDate\":\"2026-03-17\",\"mktRate\":3.878,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6890,\"orderedBy\":\"orderedBy-196\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":7212,\"respBpA\":true,\"respObjA\":true,\"rmRate\":7.55,\"settlePlanA\":true,\"trdrRate\":5.274,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [507] GET /doc-mmkts/{id} — Money Market API
run_request "[507] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [508] PATCH /doc-mmkts/{id} — Money Market API
run_request "[508] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":2438,\"bdeRecVersion\":9110,\"capt\":9641,\"dcdStrike\":4280,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-608\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-699\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-432\",\"intrRate\":2.843,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-570\",\"maturityDate\":\"2026-03-17\",\"mktRate\":5.56,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7210,\"orderedBy\":\"orderedBy-657\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1227,\"respBpA\":true,\"respObjA\":true,\"rmRate\":5.671,\"settlePlanA\":true,\"trdrRate\":5.442,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [509] POST /doc-xfermons — Money Transfer API
run_request "[509] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":5516,\"amount\":256234.31,\"bdeRecVersion\":3043,\"bulkItemIdent\":\"bulkItemIdent-698\",\"credAdvText\":\"credAdvText-114\",\"credBookText\":\"credBookText-909\",\"debAdvText\":\"debAdvText-676\",\"debBookText\":\"debBookText-502\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-750\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-932\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-768\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-122\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5737,\"orderedBy\":\"orderedBy-423\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [510] GET /doc-xfermons/{id} — Money Transfer API
run_request "[510] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [511] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[511] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":2912,\"amount\":225436.7,\"bdeRecVersion\":9663,\"bulkItemIdent\":\"bulkItemIdent-485\",\"credAdvText\":\"credAdvText-781\",\"credBookText\":\"credBookText-859\",\"debAdvText\":\"debAdvText-931\",\"debBookText\":\"debBookText-535\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-900\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-114\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-678\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-928\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6513,\"orderedBy\":\"orderedBy-821\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [512] POST /doc-oofxs — OTC FX Option API
run_request "[512] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":723,\"advTextCred\":\"advTextCred-290\",\"advTextDeb\":\"advTextDeb-923\",\"bdeRecVersion\":4628,\"bookTextCred\":\"bookTextCred-516\",\"bookTextDeb\":\"bookTextDeb-913\",\"callQty\":9146,\"cutOffTime\":\"cutOffTime-934\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-566\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-731\",\"gross\":\"gross-578\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-313\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-465\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9076,\"orderedBy\":\"orderedBy-918\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-501\",\"putQty\":6003,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-299\",\"spread2\":\"spread2-400\",\"strike\":6318,\"strikePict\":6093,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [513] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[513] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [514] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[514] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":2793,\"advTextCred\":\"advTextCred-534\",\"advTextDeb\":\"advTextDeb-989\",\"bdeRecVersion\":8531,\"bookTextCred\":\"bookTextCred-138\",\"bookTextDeb\":\"bookTextDeb-306\",\"callQty\":3421,\"cutOffTime\":\"cutOffTime-810\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-124\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-866\",\"gross\":\"gross-809\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-566\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-426\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6572,\"orderedBy\":\"orderedBy-154\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-173\",\"putQty\":4930,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-528\",\"spread2\":\"spread2-797\",\"strike\":1536,\"strikePict\":2450,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [515] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[515] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [516] GET /doc-otcopts/{id} — OTC Option API
run_request "[516] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [517] GET /doc-othsecs/{id} — Other Security API
run_request "[517] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [518] POST /doc-pays — Payment API
run_request "[518] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":11,\"amount\":654086.92,\"bank\":\"bank-147\",\"bankAcc\":\"bankAcc-958\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-556\",\"bankCorr1\":\"bankCorr1-939\",\"bankCorr1Acc\":\"bankCorr1Acc-532\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-543\",\"bankCorr3\":\"bankCorr3-191\",\"bankCorr3Acc\":\"bankCorr3Acc-215\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-195\",\"bankCorr4\":\"bankCorr4-677\",\"bankCorr4Acc\":\"bankCorr4Acc-490\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-339\",\"bankInfo\":\"bankInfo-388\",\"bdeRecVersion\":7242,\"benef\":\"benef-950\",\"benefAcc\":\"benefAcc-892\",\"benefIban\":\"CH44703169703724732\",\"benefInfo\":\"benefInfo-366\",\"benefRefNr\":\"benefRefNr-993\",\"bookTextCred\":\"bookTextCred-607\",\"bookTextDeb\":\"bookTextDeb-552\",\"bulkItemIdent\":\"bulkItemIdent-956\",\"destCountry\":{\"id\":3,\"ident\":\"IT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-874\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-662\",\"hasPostit\":true,\"instrAmount\":38602.16,\"intlRefNr\":\"intlRefNr-700\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"GB8332378432\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-762\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-497\",\"ordBankAcc\":\"ordBankAcc-466\",\"ordBankClearNr\":\"ordBankClearNr-156\",\"ordRef\":\"ordRef-272\",\"orderDate\":\"2026-03-17\",\"orderNr\":134,\"orderedBy\":\"orderedBy-947\",\"orderedByAcc\":\"orderedByAcc-170\",\"origGrpRef\":\"origGrpRef-857\",\"originCountry\":{\"id\":4,\"ident\":\"FR\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-632\",\"stordPeriodEnd\":\"stordPeriodEnd-246\",\"stordPeriodStart\":\"stordPeriodStart-515\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39541676640\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [519] GET /doc-pays/{id} — Payment API
run_request "[519] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [520] PATCH /doc-pays/{id} — Payment API
run_request "[520] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":5618,\"amount\":678466.51,\"bank\":\"bank-822\",\"bankAcc\":\"bankAcc-269\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-532\",\"bankCorr1\":\"bankCorr1-404\",\"bankCorr1Acc\":\"bankCorr1Acc-431\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-367\",\"bankCorr3\":\"bankCorr3-870\",\"bankCorr3Acc\":\"bankCorr3Acc-137\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-664\",\"bankCorr4\":\"bankCorr4-508\",\"bankCorr4Acc\":\"bankCorr4Acc-186\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-942\",\"bankInfo\":\"bankInfo-492\",\"bdeRecVersion\":8433,\"benef\":\"benef-102\",\"benefAcc\":\"benefAcc-175\",\"benefIban\":\"CH46501845055628200\",\"benefInfo\":\"benefInfo-572\",\"benefRefNr\":\"benefRefNr-440\",\"bookTextCred\":\"bookTextCred-521\",\"bookTextDeb\":\"bookTextDeb-815\",\"bulkItemIdent\":\"bulkItemIdent-203\",\"destCountry\":{\"id\":4,\"ident\":\"FR\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-403\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-969\",\"hasPostit\":true,\"instrAmount\":189462.72,\"intlRefNr\":\"intlRefNr-484\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"US5959586357\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-817\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-476\",\"ordBankAcc\":\"ordBankAcc-787\",\"ordBankClearNr\":\"ordBankClearNr-454\",\"ordRef\":\"ordRef-872\",\"orderDate\":\"2026-03-17\",\"orderNr\":4802,\"orderedBy\":\"orderedBy-634\",\"orderedByAcc\":\"orderedByAcc-474\",\"origGrpRef\":\"origGrpRef-341\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-817\",\"stordPeriodEnd\":\"stordPeriodEnd-242\",\"stordPeriodStart\":\"stordPeriodStart-107\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49850034671\"}"

# [521] GET /doc-realsecs/{id} — Real Security API
run_request "[521] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [522] POST /doc-realtys — Realty API
run_request "[522] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":9076,\"bdeRecVersion\":3245,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-118\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-436\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-232\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-240\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5820,\"orderedBy\":\"orderedBy-635\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [523] GET /doc-realtys/{id} — Realty API
run_request "[523] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [524] PATCH /doc-realtys/{id} — Realty API
run_request "[524] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":6129,\"bdeRecVersion\":8401,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-232\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-371\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-355\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-418\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2676,\"orderedBy\":\"orderedBy-917\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [525] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[525] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":1635,\"bdeRecVersion\":5938,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-280\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-396\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-464\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-712\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7827,\"orderedBy\":\"orderedBy-405\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [526] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[526] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [527] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[527] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":4589,\"bdeRecVersion\":3120,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-911\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-769\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-776\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-348\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2480,\"orderedBy\":\"orderedBy-981\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [528] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[528] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [529] POST /doc-rebalss — Rebalancer Order API
run_request "[529] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":7601,\"bdeRecVersion\":6083,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-422\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-782\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-825\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-911\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4565,\"orderedBy\":\"orderedBy-656\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [530] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[530] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [531] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[531] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":4056,\"bdeRecVersion\":1280,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-397\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-928\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-959\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-549\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3844,\"orderedBy\":\"orderedBy-872\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [532] GET /doc-repocs/{id} — Repo Contract API
run_request "[532] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [533] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[533] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [534] POST /doc-ctact2s — Contact Management (V2) API
run_request "[534] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":6366,\"attch\":\"attch-884\",\"attchA\":true,\"bdeRecVersion\":6978,\"campgnCltReaction\":\"campgnCltReaction-651\",\"campgnRespKey\":\"campgnRespKey-296\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-988\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-975\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-152\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-147\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-912\",\"linkDocListA\":true,\"loc\":\"loc-438\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":933,\"orderedBy\":\"orderedBy-939\",\"particListA\":true,\"questrSeqNr\":3366,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":4167,\"reactComment\":\"reactComment-618\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-426\",\"reactNrPartic\":7846,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-228\",\"subjA\":true,\"syncSeqNr\":7972,\"totExpndTimeM\":8792,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [535] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[535] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [536] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[536] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":5962,\"attch\":\"attch-488\",\"attchA\":true,\"bdeRecVersion\":722,\"campgnCltReaction\":\"campgnCltReaction-165\",\"campgnRespKey\":\"campgnRespKey-721\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-942\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-844\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-191\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-496\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-351\",\"linkDocListA\":true,\"loc\":\"loc-358\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7634,\"orderedBy\":\"orderedBy-581\",\"particListA\":true,\"questrSeqNr\":1020,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":5850,\"reactComment\":\"reactComment-481\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-860\",\"reactNrPartic\":5751,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-113\",\"subjA\":true,\"syncSeqNr\":5284,\"totExpndTimeM\":2549,\"trxDate\":\"2026-03-17\"}"

# [537] GET /doc-cmgs/{id} — Cashier Management API
run_request "[537] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [538] GET /doc-cops/{id} — Cashier Operations API
run_request "[538] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [539] POST /doc-clts — Client Opening API
run_request "[539] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [540] GET /doc-clts/{id} — Client Opening API
run_request "[540] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [541] PATCH /doc-clts/{id} — Client Opening API
run_request "[541] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [542] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[542] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [543] GET /doc-cltms/{id} — Collateral Movement API
run_request "[543] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [544] GET /doc-cords/{id} — Collective Order API
run_request "[544] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [545] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[545] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [546] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[546] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [547] POST /doc-xioms — External Investment Order Manager API
run_request "[547] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":9613,\"bdeRecVersion\":1665,\"bpLevelRep\":true,\"descn\":\"descn-195\",\"extlRefNr\":\"extlRefNr-316\",\"extlRepLang\":\"extlRepLang-452\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-823\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-115\",\"linkGrp\":3011,\"orderDate\":\"2026-03-17\",\"orderNr\":2271,\"orderedBy\":\"orderedBy-770\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [548] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[548] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [549] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[549] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":2901,\"bdeRecVersion\":5176,\"bpLevelRep\":true,\"descn\":\"descn-182\",\"extlRefNr\":\"extlRefNr-663\",\"extlRepLang\":\"extlRepLang-407\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-773\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-778\",\"linkGrp\":5216,\"orderDate\":\"2026-03-17\",\"orderNr\":9753,\"orderedBy\":\"orderedBy-492\",\"sendRepToEbank\":true}"

# [550] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[550] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [551] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[551] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [552] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[552] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [553] POST /doc-fxsws — FX Swap API
run_request "[553] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-158\",\"bdeRecVersion\":8050,\"buyBookText1\":\"buyBookText1-810\",\"buyBookText2\":\"buyBookText2-699\",\"buyQty1\":873,\"buyQty2\":6926,\"cfi\":\"cfi-346\",\"dealFwdRate1\":5.473,\"dealFwdRate2\":4.233,\"dealSpotRate1\":5.395,\"dealSpotRate2\":6.536,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE1152548000\",\"lastTrans\":\"lastTrans-192\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-628\",\"period1\":\"period1-826\",\"period2\":\"period2-765\",\"sellBookText1\":\"sellBookText1-321\",\"sellBookText2\":\"sellBookText2-705\",\"sellQty1\":5330,\"sellQty2\":7655,\"spotDate\":\"2026-03-17\",\"trdrRate1\":2.753,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [554] GET /doc-fxsws/{id} — FX Swap API
run_request "[554] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [555] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[555] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-269\",\"bdeRecVersion\":1603,\"buyBookText1\":\"buyBookText1-777\",\"buyBookText2\":\"buyBookText2-862\",\"buyQty1\":1455,\"buyQty2\":7203,\"cfi\":\"cfi-807\",\"dealFwdRate1\":2.562,\"dealFwdRate2\":0.974,\"dealSpotRate1\":7.525,\"dealSpotRate2\":8.099,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE2843562535\",\"lastTrans\":\"lastTrans-679\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-827\",\"period1\":\"period1-552\",\"period2\":\"period2-838\",\"sellBookText1\":\"sellBookText1-396\",\"sellBookText2\":\"sellBookText2-138\",\"sellQty1\":2286,\"sellQty2\":8576,\"spotDate\":\"2026-03-17\",\"trdrRate1\":2.59,\"trxDate\":\"2026-03-17\"}"

# [556] POST /doc-fxtrs — FXTR API
run_request "[556] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3746,\"advText\":\"advText-483\",\"bdeRecVersion\":7863,\"buyQty\":2124,\"dealFwdRate\":6.403,\"dealSpotRate\":0.741,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-681\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-877\",\"fwdSpread\":2175,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-142\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-501\",\"limit\":1553,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":8700,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8513,\"orderedBy\":\"orderedBy-713\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-367\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6098,\"settlePlanA\":true,\"spotSpread1\":5216,\"spotSpread2\":3886,\"trdrRate\":2.545,\"trigPrice\":6547,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+41118915218\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [557] GET /doc-fxtrs/{id} — FXTR API
run_request "[557] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [558] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[558] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":399,\"advText\":\"advText-522\",\"bdeRecVersion\":5143,\"buyQty\":7649,\"dealFwdRate\":1.528,\"dealSpotRate\":4.772,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-655\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-938\",\"fwdSpread\":4610,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-940\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-514\",\"limit\":4394,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":3259,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2815,\"orderedBy\":\"orderedBy-543\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-220\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9164,\"settlePlanA\":true,\"spotSpread1\":6335,\"spotSpread2\":3669,\"trdrRate\":5.568,\"trigPrice\":8588,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39218916355\"}"

# [559] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[559] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [560] POST /doc-inpays — Incoming Payment API
run_request "[560] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":1790,\"amount\":854508.52,\"bankClearNr\":\"bankClearNr-851\",\"bankInfo\":\"bankInfo-974\",\"bdeRecVersion\":5824,\"benefAcc\":\"benefAcc-642\",\"benefRefNr\":\"benefRefNr-651\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-737\",\"contrPeriodStart\":\"contrPeriodStart-460\",\"credAddr\":\"credAddr-938\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-687\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-312\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-102\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-607\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-745\",\"orderDate\":\"2026-03-17\",\"orderNr\":4312,\"orderedBy\":\"orderedBy-729\",\"originCountry\":{\"id\":4,\"ident\":\"FR\"},\"payerAcc\":\"payerAcc-288\",\"payerAddrTxt\":\"payerAddrTxt-434\",\"payerIban\":\"IT54660112657698927\",\"payerInfo\":\"payerInfo-653\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-864\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [561] GET /doc-inpays/{id} — Incoming Payment API
run_request "[561] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [562] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[562] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":6327,\"amount\":521380.27,\"bankClearNr\":\"bankClearNr-228\",\"bankInfo\":\"bankInfo-996\",\"bdeRecVersion\":5940,\"benefAcc\":\"benefAcc-244\",\"benefRefNr\":\"benefRefNr-254\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-484\",\"contrPeriodStart\":\"contrPeriodStart-496\",\"credAddr\":\"credAddr-405\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-211\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-517\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-292\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-695\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-781\",\"orderDate\":\"2026-03-17\",\"orderNr\":6689,\"orderedBy\":\"orderedBy-876\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payerAcc\":\"payerAcc-392\",\"payerAddrTxt\":\"payerAddrTxt-650\",\"payerIban\":\"CH88998232690468041\",\"payerInfo\":\"payerInfo-658\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-816\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [563] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[563] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [564] GET /doc-intrs/{id} — Interest API
run_request "[564] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>Capi Test Report · Part 7</title>
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
<h1>🧪 Capi Test Report <span style='color:#8b949e;font-size:14px'>Part 7 / 8</span></h1>
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