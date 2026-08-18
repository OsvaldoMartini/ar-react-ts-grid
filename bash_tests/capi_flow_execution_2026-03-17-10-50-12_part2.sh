#!/usr/bin/env bash
# =============================================================
# Capi Test Runner — FLOW Execution (Part 2/8)
# Generated: 2026-03-17T10:50:15.254Z
# Cases:     1189–856 of 1596
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-17-10-50-12_part2_report.html"
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

# ── INIT HTML REPORT ─────────────────────────────────────────
echo "Starting 200 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [1189] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[1189] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":389,\"autoFillList\":true,\"bdeRecVersion\":1820,\"benefBpText\":\"benefBpText-618\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-328\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-255\",\"destBankClr\":\"destBankClr-271\",\"destBankText\":\"destBankText-726\",\"destBenefText\":\"destBenefText-731\",\"destInfo\":\"destInfo-475\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-360\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-132\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-385\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-763\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9133,\"orderedBy\":\"orderedBy-998\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1190] POST /doc-mmkts — Money Market API
run_request "[1190] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":6159,\"bdeRecVersion\":1851,\"capt\":8707,\"dcdStrike\":8024,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-560\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-847\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-466\",\"intrRate\":6.498,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-385\",\"maturityDate\":\"2026-03-17\",\"mktRate\":3.319,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":45,\"orderedBy\":\"orderedBy-877\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5680,\"respBpA\":true,\"respObjA\":true,\"rmRate\":7.313,\"settlePlanA\":true,\"trdrRate\":6.994,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1191] GET /doc-mmkts/{id} — Money Market API
run_request "[1191] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [1192] PATCH /doc-mmkts/{id} — Money Market API
run_request "[1192] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":6482,\"bdeRecVersion\":1472,\"capt\":5787,\"dcdStrike\":8328,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-926\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-311\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-697\",\"intrRate\":2.821,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-240\",\"maturityDate\":\"2026-03-17\",\"mktRate\":1.806,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5237,\"orderedBy\":\"orderedBy-734\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9167,\"respBpA\":true,\"respObjA\":true,\"rmRate\":6.262,\"settlePlanA\":true,\"trdrRate\":6.832,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1193] POST /doc-xfermons — Money Transfer API
run_request "[1193] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":5843,\"amount\":652446.66,\"bdeRecVersion\":9844,\"bulkItemIdent\":\"bulkItemIdent-631\",\"credAdvText\":\"credAdvText-162\",\"credBookText\":\"credBookText-970\",\"debAdvText\":\"debAdvText-327\",\"debBookText\":\"debBookText-402\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-755\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-987\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-914\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-307\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1662,\"orderedBy\":\"orderedBy-340\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1194] GET /doc-xfermons/{id} — Money Transfer API
run_request "[1194] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [1195] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[1195] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":7813,\"amount\":173895.07,\"bdeRecVersion\":2770,\"bulkItemIdent\":\"bulkItemIdent-246\",\"credAdvText\":\"credAdvText-435\",\"credBookText\":\"credBookText-777\",\"debAdvText\":\"debAdvText-316\",\"debBookText\":\"debBookText-657\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-157\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-569\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-469\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-516\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":399,\"orderedBy\":\"orderedBy-757\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1196] POST /doc-oofxs — OTC FX Option API
run_request "[1196] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":2061,\"advTextCred\":\"advTextCred-682\",\"advTextDeb\":\"advTextDeb-467\",\"bdeRecVersion\":5834,\"bookTextCred\":\"bookTextCred-180\",\"bookTextDeb\":\"bookTextDeb-876\",\"callQty\":3477,\"cutOffTime\":\"cutOffTime-495\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-211\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-495\",\"gross\":\"gross-947\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-124\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-258\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":935,\"orderedBy\":\"orderedBy-802\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-688\",\"putQty\":4874,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-262\",\"spread2\":\"spread2-263\",\"strike\":3038,\"strikePict\":8598,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1197] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[1197] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [1198] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[1198] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":7802,\"advTextCred\":\"advTextCred-684\",\"advTextDeb\":\"advTextDeb-577\",\"bdeRecVersion\":6816,\"bookTextCred\":\"bookTextCred-273\",\"bookTextDeb\":\"bookTextDeb-230\",\"callQty\":6414,\"cutOffTime\":\"cutOffTime-533\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-825\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-323\",\"gross\":\"gross-320\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-959\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-976\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2847,\"orderedBy\":\"orderedBy-632\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-730\",\"putQty\":8564,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-891\",\"spread2\":\"spread2-245\",\"strike\":5395,\"strikePict\":4641,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1199] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[1199] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [1200] GET /doc-otcopts/{id} — OTC Option API
run_request "[1200] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [1201] GET /doc-othsecs/{id} — Other Security API
run_request "[1201] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [1202] POST /doc-pays — Payment API
run_request "[1202] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":9042,\"amount\":846567.16,\"bank\":\"bank-931\",\"bankAcc\":\"bankAcc-312\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-163\",\"bankCorr1\":\"bankCorr1-976\",\"bankCorr1Acc\":\"bankCorr1Acc-910\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-153\",\"bankCorr3\":\"bankCorr3-675\",\"bankCorr3Acc\":\"bankCorr3Acc-968\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-723\",\"bankCorr4\":\"bankCorr4-625\",\"bankCorr4Acc\":\"bankCorr4Acc-817\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-245\",\"bankInfo\":\"bankInfo-601\",\"bdeRecVersion\":2879,\"benef\":\"benef-705\",\"benefAcc\":\"benefAcc-918\",\"benefIban\":\"DE51894870406566705\",\"benefInfo\":\"benefInfo-960\",\"benefRefNr\":\"benefRefNr-286\",\"bookTextCred\":\"bookTextCred-484\",\"bookTextDeb\":\"bookTextDeb-397\",\"bulkItemIdent\":\"bulkItemIdent-413\",\"destCountry\":{\"id\":2,\"ident\":\"DE\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-298\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-369\",\"hasPostit\":true,\"instrAmount\":850413.14,\"intlRefNr\":\"intlRefNr-354\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE3865168230\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-447\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-484\",\"ordBankAcc\":\"ordBankAcc-623\",\"ordBankClearNr\":\"ordBankClearNr-915\",\"ordRef\":\"ordRef-913\",\"orderDate\":\"2026-03-17\",\"orderNr\":9179,\"orderedBy\":\"orderedBy-947\",\"orderedByAcc\":\"orderedByAcc-533\",\"origGrpRef\":\"origGrpRef-564\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-209\",\"stordPeriodEnd\":\"stordPeriodEnd-466\",\"stordPeriodStart\":\"stordPeriodStart-655\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41628036378\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1203] GET /doc-pays/{id} — Payment API
run_request "[1203] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [1204] PATCH /doc-pays/{id} — Payment API
run_request "[1204] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":6404,\"amount\":699069.57,\"bank\":\"bank-490\",\"bankAcc\":\"bankAcc-953\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-962\",\"bankCorr1\":\"bankCorr1-284\",\"bankCorr1Acc\":\"bankCorr1Acc-167\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-559\",\"bankCorr3\":\"bankCorr3-911\",\"bankCorr3Acc\":\"bankCorr3Acc-823\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-241\",\"bankCorr4\":\"bankCorr4-908\",\"bankCorr4Acc\":\"bankCorr4Acc-183\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-396\",\"bankInfo\":\"bankInfo-525\",\"bdeRecVersion\":6000,\"benef\":\"benef-446\",\"benefAcc\":\"benefAcc-953\",\"benefIban\":\"AT48134910449381666\",\"benefInfo\":\"benefInfo-317\",\"benefRefNr\":\"benefRefNr-627\",\"bookTextCred\":\"bookTextCred-362\",\"bookTextDeb\":\"bookTextDeb-103\",\"bulkItemIdent\":\"bulkItemIdent-802\",\"destCountry\":{\"id\":3,\"ident\":\"IT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-837\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-603\",\"hasPostit\":true,\"instrAmount\":614110.88,\"intlRefNr\":\"intlRefNr-652\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH7814430081\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-383\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-477\",\"ordBankAcc\":\"ordBankAcc-377\",\"ordBankClearNr\":\"ordBankClearNr-245\",\"ordRef\":\"ordRef-597\",\"orderDate\":\"2026-03-17\",\"orderNr\":9852,\"orderedBy\":\"orderedBy-318\",\"orderedByAcc\":\"orderedByAcc-279\",\"origGrpRef\":\"origGrpRef-236\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-542\",\"stordPeriodEnd\":\"stordPeriodEnd-413\",\"stordPeriodStart\":\"stordPeriodStart-901\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41667635501\"}"

# [1205] GET /doc-realsecs/{id} — Real Security API
run_request "[1205] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [1206] POST /doc-realtys — Realty API
run_request "[1206] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":2990,\"bdeRecVersion\":7962,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-260\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-985\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-575\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-295\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3961,\"orderedBy\":\"orderedBy-538\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1207] GET /doc-realtys/{id} — Realty API
run_request "[1207] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [1208] PATCH /doc-realtys/{id} — Realty API
run_request "[1208] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":3988,\"bdeRecVersion\":2550,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-130\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-183\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-678\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-482\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6007,\"orderedBy\":\"orderedBy-475\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1209] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[1209] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":323,\"bdeRecVersion\":8120,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-293\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-767\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-153\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-661\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9382,\"orderedBy\":\"orderedBy-982\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1210] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1210] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [1211] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1211] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":3262,\"bdeRecVersion\":5953,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-396\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-146\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-586\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-156\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7055,\"orderedBy\":\"orderedBy-574\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1212] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[1212] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [1213] POST /doc-rebalss — Rebalancer Order API
run_request "[1213] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":3409,\"bdeRecVersion\":9468,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-846\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-704\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-822\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-957\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":466,\"orderedBy\":\"orderedBy-953\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1214] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[1214] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [1215] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[1215] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":7822,\"bdeRecVersion\":3883,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-379\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-409\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-738\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-120\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7763,\"orderedBy\":\"orderedBy-682\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1216] GET /doc-repocs/{id} — Repo Contract API
run_request "[1216] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [1217] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[1217] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [1218] POST /doc-ctact2s — Contact Management (V2) API
run_request "[1218] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":5012,\"attch\":\"attch-967\",\"attchA\":true,\"bdeRecVersion\":2380,\"campgnCltReaction\":\"campgnCltReaction-822\",\"campgnRespKey\":\"campgnRespKey-262\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-578\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-662\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-993\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-320\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-606\",\"linkDocListA\":true,\"loc\":\"loc-401\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2441,\"orderedBy\":\"orderedBy-561\",\"particListA\":true,\"questrSeqNr\":4597,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":9257,\"reactComment\":\"reactComment-679\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-873\",\"reactNrPartic\":9014,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-448\",\"subjA\":true,\"syncSeqNr\":8761,\"totExpndTimeM\":1284,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1219] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1219] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [1220] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1220] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":2176,\"attch\":\"attch-128\",\"attchA\":true,\"bdeRecVersion\":7764,\"campgnCltReaction\":\"campgnCltReaction-235\",\"campgnRespKey\":\"campgnRespKey-731\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-418\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-973\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-517\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-956\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-513\",\"linkDocListA\":true,\"loc\":\"loc-919\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7495,\"orderedBy\":\"orderedBy-795\",\"particListA\":true,\"questrSeqNr\":4266,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":764,\"reactComment\":\"reactComment-168\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-537\",\"reactNrPartic\":4920,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-394\",\"subjA\":true,\"syncSeqNr\":3976,\"totExpndTimeM\":1126,\"trxDate\":\"2026-03-17\"}"

# [1221] GET /doc-cmgs/{id} — Cashier Management API
run_request "[1221] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [1222] GET /doc-cops/{id} — Cashier Operations API
run_request "[1222] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [1223] POST /doc-clts — Client Opening API
run_request "[1223] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1224] GET /doc-clts/{id} — Client Opening API
run_request "[1224] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [1225] PATCH /doc-clts/{id} — Client Opening API
run_request "[1225] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [1226] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[1226] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [1227] GET /doc-cltms/{id} — Collateral Movement API
run_request "[1227] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [1228] GET /doc-cords/{id} — Collective Order API
run_request "[1228] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [1229] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[1229] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [1230] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[1230] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [1231] POST /doc-xioms — External Investment Order Manager API
run_request "[1231] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":6071,\"bdeRecVersion\":529,\"bpLevelRep\":true,\"descn\":\"descn-455\",\"extlRefNr\":\"extlRefNr-743\",\"extlRepLang\":\"extlRepLang-797\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-548\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-332\",\"linkGrp\":518,\"orderDate\":\"2026-03-17\",\"orderNr\":5344,\"orderedBy\":\"orderedBy-607\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1232] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[1232] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [1233] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[1233] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":9876,\"bdeRecVersion\":5986,\"bpLevelRep\":true,\"descn\":\"descn-980\",\"extlRefNr\":\"extlRefNr-200\",\"extlRepLang\":\"extlRepLang-223\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-302\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-570\",\"linkGrp\":6651,\"orderDate\":\"2026-03-17\",\"orderNr\":6603,\"orderedBy\":\"orderedBy-283\",\"sendRepToEbank\":true}"

# [1234] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[1234] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [1235] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[1235] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [1236] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[1236] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [1237] POST /doc-fxsws — FX Swap API
run_request "[1237] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-202\",\"bdeRecVersion\":2646,\"buyBookText1\":\"buyBookText1-803\",\"buyBookText2\":\"buyBookText2-702\",\"buyQty1\":988,\"buyQty2\":3703,\"cfi\":\"cfi-888\",\"dealFwdRate1\":6.724,\"dealFwdRate2\":4.495,\"dealSpotRate1\":5.108,\"dealSpotRate2\":4.89,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR9569269120\",\"lastTrans\":\"lastTrans-514\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-999\",\"period1\":\"period1-415\",\"period2\":\"period2-444\",\"sellBookText1\":\"sellBookText1-444\",\"sellBookText2\":\"sellBookText2-438\",\"sellQty1\":48,\"sellQty2\":6119,\"spotDate\":\"2026-03-17\",\"trdrRate1\":3.437,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1238] GET /doc-fxsws/{id} — FX Swap API
run_request "[1238] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [1239] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[1239] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-465\",\"bdeRecVersion\":3491,\"buyBookText1\":\"buyBookText1-728\",\"buyBookText2\":\"buyBookText2-434\",\"buyQty1\":699,\"buyQty2\":8876,\"cfi\":\"cfi-726\",\"dealFwdRate1\":4.179,\"dealFwdRate2\":5.003,\"dealSpotRate1\":0.597,\"dealSpotRate2\":4.814,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB2022165000\",\"lastTrans\":\"lastTrans-556\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-433\",\"period1\":\"period1-368\",\"period2\":\"period2-767\",\"sellBookText1\":\"sellBookText1-848\",\"sellBookText2\":\"sellBookText2-375\",\"sellQty1\":5354,\"sellQty2\":3586,\"spotDate\":\"2026-03-17\",\"trdrRate1\":5.636,\"trxDate\":\"2026-03-17\"}"

# [1240] POST /doc-fxtrs — FXTR API
run_request "[1240] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5516,\"advText\":\"advText-476\",\"bdeRecVersion\":4541,\"buyQty\":6531,\"dealFwdRate\":3.929,\"dealSpotRate\":0.239,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-410\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-430\",\"fwdSpread\":8529,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-852\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-465\",\"limit\":4953,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":2044,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2044,\"orderedBy\":\"orderedBy-553\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-466\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8560,\"settlePlanA\":true,\"spotSpread1\":4308,\"spotSpread2\":7216,\"trdrRate\":0.26,\"trigPrice\":3960,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44854718327\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1241] GET /doc-fxtrs/{id} — FXTR API
run_request "[1241] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [1242] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[1242] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":7000,\"advText\":\"advText-362\",\"bdeRecVersion\":7828,\"buyQty\":3371,\"dealFwdRate\":7.808,\"dealSpotRate\":0.436,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-663\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-558\",\"fwdSpread\":134,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-553\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-314\",\"limit\":6701,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":9308,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9164,\"orderedBy\":\"orderedBy-884\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-267\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":82,\"settlePlanA\":true,\"spotSpread1\":7295,\"spotSpread2\":4345,\"trdrRate\":5.277,\"trigPrice\":4278,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+33986627465\"}"

# [1243] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[1243] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [1244] POST /doc-inpays — Incoming Payment API
run_request "[1244] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":8167,\"amount\":446559.77,\"bankClearNr\":\"bankClearNr-760\",\"bankInfo\":\"bankInfo-289\",\"bdeRecVersion\":3753,\"benefAcc\":\"benefAcc-672\",\"benefRefNr\":\"benefRefNr-658\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-942\",\"contrPeriodStart\":\"contrPeriodStart-853\",\"credAddr\":\"credAddr-873\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-361\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-823\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-385\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-175\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-515\",\"orderDate\":\"2026-03-17\",\"orderNr\":3489,\"orderedBy\":\"orderedBy-130\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payerAcc\":\"payerAcc-355\",\"payerAddrTxt\":\"payerAddrTxt-756\",\"payerIban\":\"FR89779372629135434\",\"payerInfo\":\"payerInfo-144\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-826\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1245] GET /doc-inpays/{id} — Incoming Payment API
run_request "[1245] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [1246] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[1246] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":6457,\"amount\":649166.57,\"bankClearNr\":\"bankClearNr-241\",\"bankInfo\":\"bankInfo-597\",\"bdeRecVersion\":6340,\"benefAcc\":\"benefAcc-138\",\"benefRefNr\":\"benefRefNr-948\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-148\",\"contrPeriodStart\":\"contrPeriodStart-630\",\"credAddr\":\"credAddr-203\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-498\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-288\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-136\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-128\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-316\",\"orderDate\":\"2026-03-17\",\"orderNr\":4352,\"orderedBy\":\"orderedBy-778\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-331\",\"payerAddrTxt\":\"payerAddrTxt-951\",\"payerIban\":\"FR36611259987300278\",\"payerInfo\":\"payerInfo-517\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-150\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1247] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[1247] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [1248] GET /doc-intrs/{id} — Interest API
run_request "[1248] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [1249] POST /doc-invst-bdls — Investment Bundler API
run_request "[1249] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":250,\"bdeRecVersion\":58,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-760\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-844\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-444\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-818\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7216,\"orderedBy\":\"orderedBy-272\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":686,\"remnBaccBalMin\":7118,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1250] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1250] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [1251] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1251] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":9099,\"bdeRecVersion\":1443,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-862\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-768\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-842\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-214\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1483,\"orderedBy\":\"orderedBy-205\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":2007,\"remnBaccBalMin\":6927,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1252] POST /doc-crm-issues — Issue Management API
run_request "[1252] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-229\",\"advNr\":7521,\"allDayEvt\":true,\"attch\":\"attch-746\",\"bdeRecVersion\":387,\"campgnTaskSeqNr\":2167,\"descn\":\"descn-211\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-661\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-140\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-746\",\"findingKey\":\"findingKey-731\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-563\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-515\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-842\",\"location\":\"location-596\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6371,\"orderedBy\":\"orderedBy-866\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":697,\"qtyLinked\":3501,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-884\",\"subject\":\"subject-501\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-789\",\"undefBp\":\"undefBp-437\",\"val\":8333,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1253] GET /doc-crm-issues/{id} — Issue Management API
run_request "[1253] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [1254] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[1254] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-408\",\"advNr\":9314,\"allDayEvt\":true,\"attch\":\"attch-630\",\"bdeRecVersion\":1912,\"campgnTaskSeqNr\":8790,\"descn\":\"descn-150\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-950\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-158\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-488\",\"findingKey\":\"findingKey-194\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-639\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-587\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-661\",\"location\":\"location-990\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2808,\"orderedBy\":\"orderedBy-699\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1667,\"qtyLinked\":8745,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-281\",\"subject\":\"subject-747\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-747\",\"undefBp\":\"undefBp-912\",\"val\":5286,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1255] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[1255] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [1256] GET /doc-letters/{id} — Letter API
run_request "[1256] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [1257] POST /doc-limits — Limit API
run_request "[1257] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":3856,\"advTextCred\":\"advTextCred-651\",\"advTextDeb\":\"advTextDeb-100\",\"amount\":54439.81,\"bdeRecVersion\":1675,\"bookTextCred\":\"bookTextCred-679\",\"bookTextDeb\":\"bookTextDeb-626\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-676\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-895\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-409\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-930\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-461\",\"nextReview\":\"nextReview-683\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":4627,\"orderedBy\":\"orderedBy-652\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1258] GET /doc-limits/{id} — Limit API
run_request "[1258] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [1259] PATCH /doc-limits/{id} — Limit API
run_request "[1259] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":1744,\"advTextCred\":\"advTextCred-447\",\"advTextDeb\":\"advTextDeb-765\",\"amount\":823084.22,\"bdeRecVersion\":196,\"bookTextCred\":\"bookTextCred-758\",\"bookTextDeb\":\"bookTextDeb-300\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-306\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-371\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-913\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-178\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-995\",\"nextReview\":\"nextReview-474\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":904,\"orderedBy\":\"orderedBy-921\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1260] POST /doc-loans — Loan API
run_request "[1260] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":4039,\"advTextCred\":\"advTextCred-203\",\"advTextDeb\":\"advTextDeb-323\",\"bdeRecVersion\":2806,\"bookTextCred\":\"bookTextCred-311\",\"bookTextDeb\":\"bookTextDeb-219\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-684\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-804\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-869\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-795\",\"intrGradManMarkup\":6435,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-186\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1953,\"orderedBy\":\"orderedBy-838\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1036,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1261] GET /doc-loans/{id} — Loan API
run_request "[1261] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [1262] PATCH /doc-loans/{id} — Loan API
run_request "[1262] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":3987,\"advTextCred\":\"advTextCred-405\",\"advTextDeb\":\"advTextDeb-352\",\"bdeRecVersion\":4031,\"bookTextCred\":\"bookTextCred-938\",\"bookTextDeb\":\"bookTextDeb-876\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-904\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-901\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-291\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-125\",\"intrGradManMarkup\":6704,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-492\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6519,\"orderedBy\":\"orderedBy-295\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1226,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1263] POST /doc-mass-settles — Mass Settlement API
run_request "[1263] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":3047,\"autoFillList\":true,\"bdeRecVersion\":8817,\"benefBpText\":\"benefBpText-157\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-730\",\"destBankBic\":\"CRESCHZZ80A\",\"destBankBpText\":\"destBankBpText-591\",\"destBankClr\":\"destBankClr-366\",\"destBankText\":\"destBankText-921\",\"destBenefText\":\"destBenefText-865\",\"destInfo\":\"destInfo-303\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-791\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-933\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-127\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-676\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9929,\"orderedBy\":\"orderedBy-571\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1264] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[1264] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [1265] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[1265] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":5585,\"autoFillList\":true,\"bdeRecVersion\":7751,\"benefBpText\":\"benefBpText-295\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-170\",\"destBankBic\":\"DEUTDEDB\",\"destBankBpText\":\"destBankBpText-638\",\"destBankClr\":\"destBankClr-783\",\"destBankText\":\"destBankText-247\",\"destBenefText\":\"destBenefText-941\",\"destInfo\":\"destInfo-519\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-592\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-879\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-632\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-140\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":175,\"orderedBy\":\"orderedBy-151\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1266] POST /doc-mmkts — Money Market API
run_request "[1266] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":4464,\"bdeRecVersion\":2001,\"capt\":5460,\"dcdStrike\":4633,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-654\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-980\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-234\",\"intrRate\":7.771,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-451\",\"maturityDate\":\"2026-03-17\",\"mktRate\":2.923,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3725,\"orderedBy\":\"orderedBy-340\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5899,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.505,\"settlePlanA\":true,\"trdrRate\":7.105,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1267] GET /doc-mmkts/{id} — Money Market API
run_request "[1267] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [1268] PATCH /doc-mmkts/{id} — Money Market API
run_request "[1268] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":3812,\"bdeRecVersion\":4253,\"capt\":578,\"dcdStrike\":4054,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-871\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-612\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-886\",\"intrRate\":1.883,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-554\",\"maturityDate\":\"2026-03-17\",\"mktRate\":3.859,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5159,\"orderedBy\":\"orderedBy-338\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8130,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.732,\"settlePlanA\":true,\"trdrRate\":4.044,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1269] POST /doc-xfermons — Money Transfer API
run_request "[1269] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":6127,\"amount\":300428.56,\"bdeRecVersion\":2621,\"bulkItemIdent\":\"bulkItemIdent-705\",\"credAdvText\":\"credAdvText-686\",\"credBookText\":\"credBookText-390\",\"debAdvText\":\"debAdvText-792\",\"debBookText\":\"debBookText-579\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-960\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-338\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-631\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-194\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4382,\"orderedBy\":\"orderedBy-613\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1270] GET /doc-xfermons/{id} — Money Transfer API
run_request "[1270] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [1271] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[1271] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":5143,\"amount\":162433.13,\"bdeRecVersion\":7220,\"bulkItemIdent\":\"bulkItemIdent-791\",\"credAdvText\":\"credAdvText-180\",\"credBookText\":\"credBookText-310\",\"debAdvText\":\"debAdvText-344\",\"debBookText\":\"debBookText-109\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-207\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-600\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-862\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-262\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4025,\"orderedBy\":\"orderedBy-473\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1272] POST /doc-oofxs — OTC FX Option API
run_request "[1272] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":3630,\"advTextCred\":\"advTextCred-615\",\"advTextDeb\":\"advTextDeb-411\",\"bdeRecVersion\":8071,\"bookTextCred\":\"bookTextCred-355\",\"bookTextDeb\":\"bookTextDeb-785\",\"callQty\":4974,\"cutOffTime\":\"cutOffTime-457\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-252\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-592\",\"gross\":\"gross-163\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-993\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-227\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5494,\"orderedBy\":\"orderedBy-886\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-834\",\"putQty\":5085,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-765\",\"spread2\":\"spread2-786\",\"strike\":9088,\"strikePict\":3675,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1273] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[1273] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [1274] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[1274] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":9818,\"advTextCred\":\"advTextCred-428\",\"advTextDeb\":\"advTextDeb-402\",\"bdeRecVersion\":6469,\"bookTextCred\":\"bookTextCred-497\",\"bookTextDeb\":\"bookTextDeb-333\",\"callQty\":9396,\"cutOffTime\":\"cutOffTime-867\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-798\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-268\",\"gross\":\"gross-732\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-744\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-542\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6602,\"orderedBy\":\"orderedBy-166\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-479\",\"putQty\":9693,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-873\",\"spread2\":\"spread2-437\",\"strike\":4651,\"strikePict\":7967,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1275] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[1275] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [1276] GET /doc-otcopts/{id} — OTC Option API
run_request "[1276] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [1277] GET /doc-othsecs/{id} — Other Security API
run_request "[1277] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [1278] POST /doc-pays — Payment API
run_request "[1278] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":786,\"amount\":293389.37,\"bank\":\"bank-791\",\"bankAcc\":\"bankAcc-954\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-442\",\"bankCorr1\":\"bankCorr1-840\",\"bankCorr1Acc\":\"bankCorr1Acc-279\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-405\",\"bankCorr3\":\"bankCorr3-622\",\"bankCorr3Acc\":\"bankCorr3Acc-611\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-348\",\"bankCorr4\":\"bankCorr4-273\",\"bankCorr4Acc\":\"bankCorr4Acc-525\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-399\",\"bankInfo\":\"bankInfo-753\",\"bdeRecVersion\":2081,\"benef\":\"benef-504\",\"benefAcc\":\"benefAcc-639\",\"benefIban\":\"DE26955619151776695\",\"benefInfo\":\"benefInfo-739\",\"benefRefNr\":\"benefRefNr-229\",\"bookTextCred\":\"bookTextCred-939\",\"bookTextDeb\":\"bookTextDeb-436\",\"bulkItemIdent\":\"bulkItemIdent-920\",\"destCountry\":{\"id\":1,\"ident\":\"CH\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-485\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-462\",\"hasPostit\":true,\"instrAmount\":4041.94,\"intlRefNr\":\"intlRefNr-939\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"GB7885445181\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-101\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-936\",\"ordBankAcc\":\"ordBankAcc-777\",\"ordBankClearNr\":\"ordBankClearNr-419\",\"ordRef\":\"ordRef-739\",\"orderDate\":\"2026-03-17\",\"orderNr\":6288,\"orderedBy\":\"orderedBy-576\",\"orderedByAcc\":\"orderedByAcc-508\",\"origGrpRef\":\"origGrpRef-223\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-367\",\"stordPeriodEnd\":\"stordPeriodEnd-598\",\"stordPeriodStart\":\"stordPeriodStart-642\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41808482686\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1279] GET /doc-pays/{id} — Payment API
run_request "[1279] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [1280] PATCH /doc-pays/{id} — Payment API
run_request "[1280] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":9682,\"amount\":157674.22,\"bank\":\"bank-350\",\"bankAcc\":\"bankAcc-237\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-967\",\"bankCorr1\":\"bankCorr1-921\",\"bankCorr1Acc\":\"bankCorr1Acc-854\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-352\",\"bankCorr3\":\"bankCorr3-649\",\"bankCorr3Acc\":\"bankCorr3Acc-612\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-903\",\"bankCorr4\":\"bankCorr4-522\",\"bankCorr4Acc\":\"bankCorr4Acc-213\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-413\",\"bankInfo\":\"bankInfo-412\",\"bdeRecVersion\":1384,\"benef\":\"benef-892\",\"benefAcc\":\"benefAcc-689\",\"benefIban\":\"CH39855143507669640\",\"benefInfo\":\"benefInfo-497\",\"benefRefNr\":\"benefRefNr-260\",\"bookTextCred\":\"bookTextCred-456\",\"bookTextDeb\":\"bookTextDeb-139\",\"bulkItemIdent\":\"bulkItemIdent-811\",\"destCountry\":{\"id\":2,\"ident\":\"DE\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-223\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-543\",\"hasPostit\":true,\"instrAmount\":134036.24,\"intlRefNr\":\"intlRefNr-213\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH3603208934\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-723\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-160\",\"ordBankAcc\":\"ordBankAcc-930\",\"ordBankClearNr\":\"ordBankClearNr-439\",\"ordRef\":\"ordRef-303\",\"orderDate\":\"2026-03-17\",\"orderNr\":4941,\"orderedBy\":\"orderedBy-332\",\"orderedByAcc\":\"orderedByAcc-493\",\"origGrpRef\":\"origGrpRef-707\",\"originCountry\":{\"id\":4,\"ident\":\"FR\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-453\",\"stordPeriodEnd\":\"stordPeriodEnd-234\",\"stordPeriodStart\":\"stordPeriodStart-505\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49729991097\"}"

# [1281] GET /doc-realsecs/{id} — Real Security API
run_request "[1281] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [1282] POST /doc-realtys — Realty API
run_request "[1282] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":5022,\"bdeRecVersion\":6748,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-114\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-291\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-509\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-168\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7226,\"orderedBy\":\"orderedBy-461\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1283] GET /doc-realtys/{id} — Realty API
run_request "[1283] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [1284] PATCH /doc-realtys/{id} — Realty API
run_request "[1284] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":2219,\"bdeRecVersion\":1465,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-313\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-703\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-867\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-720\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6871,\"orderedBy\":\"orderedBy-849\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1285] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[1285] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":2507,\"bdeRecVersion\":3915,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-923\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-618\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-637\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-405\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6499,\"orderedBy\":\"orderedBy-120\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1286] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1286] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [1287] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1287] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":37,\"bdeRecVersion\":3754,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-392\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-383\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-388\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-517\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4187,\"orderedBy\":\"orderedBy-908\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1288] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[1288] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [1289] POST /doc-rebalss — Rebalancer Order API
run_request "[1289] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":7607,\"bdeRecVersion\":6993,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-426\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-864\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-593\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-307\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3436,\"orderedBy\":\"orderedBy-962\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1290] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[1290] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [1291] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[1291] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":4411,\"bdeRecVersion\":2383,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-224\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-630\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-813\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-473\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2619,\"orderedBy\":\"orderedBy-518\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1292] GET /doc-repocs/{id} — Repo Contract API
run_request "[1292] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [77] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[77] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [78] POST /doc-ctact2s — Contact Management (V2) API
run_request "[78] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":9349,\"attch\":\"attch-170\",\"attchA\":true,\"bdeRecVersion\":782,\"campgnCltReaction\":\"campgnCltReaction-129\",\"campgnRespKey\":\"campgnRespKey-199\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-294\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-247\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-810\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-450\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-378\",\"linkDocListA\":true,\"loc\":\"loc-961\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2145,\"orderedBy\":\"orderedBy-252\",\"particListA\":true,\"questrSeqNr\":4941,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":6142,\"reactComment\":\"reactComment-242\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-996\",\"reactNrPartic\":8745,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-780\",\"subjA\":true,\"syncSeqNr\":8453,\"totExpndTimeM\":1139,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [79] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[79] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [80] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[80] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":4405,\"attch\":\"attch-920\",\"attchA\":true,\"bdeRecVersion\":8214,\"campgnCltReaction\":\"campgnCltReaction-129\",\"campgnRespKey\":\"campgnRespKey-439\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-100\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-291\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-384\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-548\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-235\",\"linkDocListA\":true,\"loc\":\"loc-533\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2839,\"orderedBy\":\"orderedBy-306\",\"particListA\":true,\"questrSeqNr\":1095,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":9842,\"reactComment\":\"reactComment-648\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-452\",\"reactNrPartic\":8720,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-475\",\"subjA\":true,\"syncSeqNr\":6453,\"totExpndTimeM\":4009,\"trxDate\":\"2026-03-17\"}"

# [81] GET /doc-cmgs/{id} — Cashier Management API
run_request "[81] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [82] GET /doc-cops/{id} — Cashier Operations API
run_request "[82] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [83] POST /doc-clts — Client Opening API
run_request "[83] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [84] GET /doc-clts/{id} — Client Opening API
run_request "[84] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [85] PATCH /doc-clts/{id} — Client Opening API
run_request "[85] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [86] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[86] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [87] GET /doc-cltms/{id} — Collateral Movement API
run_request "[87] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [88] GET /doc-cords/{id} — Collective Order API
run_request "[88] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [89] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[89] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [90] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[90] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [91] POST /doc-xioms — External Investment Order Manager API
run_request "[91] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":5375,\"bdeRecVersion\":42,\"bpLevelRep\":true,\"descn\":\"descn-406\",\"extlRefNr\":\"extlRefNr-393\",\"extlRepLang\":\"extlRepLang-255\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-889\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-878\",\"linkGrp\":7141,\"orderDate\":\"2026-03-17\",\"orderNr\":1273,\"orderedBy\":\"orderedBy-819\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [92] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[92] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [93] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[93] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":4645,\"bdeRecVersion\":336,\"bpLevelRep\":true,\"descn\":\"descn-480\",\"extlRefNr\":\"extlRefNr-340\",\"extlRepLang\":\"extlRepLang-893\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-920\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-705\",\"linkGrp\":7914,\"orderDate\":\"2026-03-17\",\"orderNr\":8987,\"orderedBy\":\"orderedBy-779\",\"sendRepToEbank\":true}"

# [94] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[94] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [95] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[95] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [96] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[96] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [97] POST /doc-fxsws — FX Swap API
run_request "[97] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-478\",\"bdeRecVersion\":4222,\"buyBookText1\":\"buyBookText1-734\",\"buyBookText2\":\"buyBookText2-157\",\"buyQty1\":7166,\"buyQty2\":1187,\"cfi\":\"cfi-544\",\"dealFwdRate1\":2.058,\"dealFwdRate2\":6.552,\"dealSpotRate1\":1.692,\"dealSpotRate2\":0.596,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE1160847664\",\"lastTrans\":\"lastTrans-368\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-550\",\"period1\":\"period1-696\",\"period2\":\"period2-373\",\"sellBookText1\":\"sellBookText1-465\",\"sellBookText2\":\"sellBookText2-608\",\"sellQty1\":357,\"sellQty2\":5638,\"spotDate\":\"2026-03-17\",\"trdrRate1\":7.649,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [98] GET /doc-fxsws/{id} — FX Swap API
run_request "[98] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [99] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[99] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-964\",\"bdeRecVersion\":7465,\"buyBookText1\":\"buyBookText1-277\",\"buyBookText2\":\"buyBookText2-859\",\"buyQty1\":5283,\"buyQty2\":5620,\"cfi\":\"cfi-197\",\"dealFwdRate1\":4.169,\"dealFwdRate2\":5.345,\"dealSpotRate1\":4.208,\"dealSpotRate2\":3.289,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE7999392808\",\"lastTrans\":\"lastTrans-224\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-219\",\"period1\":\"period1-719\",\"period2\":\"period2-738\",\"sellBookText1\":\"sellBookText1-948\",\"sellBookText2\":\"sellBookText2-780\",\"sellQty1\":3679,\"sellQty2\":1957,\"spotDate\":\"2026-03-17\",\"trdrRate1\":0.246,\"trxDate\":\"2026-03-17\"}"

# [100] POST /doc-fxtrs — FXTR API
run_request "[100] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":7883,\"advText\":\"advText-234\",\"bdeRecVersion\":3099,\"buyQty\":6683,\"dealFwdRate\":1.548,\"dealSpotRate\":2.621,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-972\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-111\",\"fwdSpread\":662,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-111\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-672\",\"limit\":2666,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":5270,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5611,\"orderedBy\":\"orderedBy-192\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-883\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9625,\"settlePlanA\":true,\"spotSpread1\":1493,\"spotSpread2\":8446,\"trdrRate\":2.287,\"trigPrice\":4219,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44471978091\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [101] GET /doc-fxtrs/{id} — FXTR API
run_request "[101] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [102] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[102] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":1518,\"advText\":\"advText-432\",\"bdeRecVersion\":5482,\"buyQty\":8905,\"dealFwdRate\":5.793,\"dealSpotRate\":5.8,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-198\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-953\",\"fwdSpread\":225,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-368\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-413\",\"limit\":3034,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":3338,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2186,\"orderedBy\":\"orderedBy-343\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-244\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6330,\"settlePlanA\":true,\"spotSpread1\":7217,\"spotSpread2\":7393,\"trdrRate\":0.521,\"trigPrice\":5717,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+49290244009\"}"

# [103] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[103] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [104] POST /doc-inpays — Incoming Payment API
run_request "[104] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":322,\"amount\":984263.28,\"bankClearNr\":\"bankClearNr-248\",\"bankInfo\":\"bankInfo-992\",\"bdeRecVersion\":8981,\"benefAcc\":\"benefAcc-103\",\"benefRefNr\":\"benefRefNr-567\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-106\",\"contrPeriodStart\":\"contrPeriodStart-316\",\"credAddr\":\"credAddr-667\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-578\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-842\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-911\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-777\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-301\",\"orderDate\":\"2026-03-17\",\"orderNr\":2771,\"orderedBy\":\"orderedBy-903\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payerAcc\":\"payerAcc-817\",\"payerAddrTxt\":\"payerAddrTxt-693\",\"payerIban\":\"IT34449023274476475\",\"payerInfo\":\"payerInfo-631\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-557\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [105] GET /doc-inpays/{id} — Incoming Payment API
run_request "[105] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [106] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[106] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":8253,\"amount\":166908.78,\"bankClearNr\":\"bankClearNr-757\",\"bankInfo\":\"bankInfo-574\",\"bdeRecVersion\":7886,\"benefAcc\":\"benefAcc-272\",\"benefRefNr\":\"benefRefNr-200\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-327\",\"contrPeriodStart\":\"contrPeriodStart-123\",\"credAddr\":\"credAddr-674\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-928\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-620\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-792\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-743\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-587\",\"orderDate\":\"2026-03-17\",\"orderNr\":2635,\"orderedBy\":\"orderedBy-686\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-684\",\"payerAddrTxt\":\"payerAddrTxt-618\",\"payerIban\":\"CH64801224646525403\",\"payerInfo\":\"payerInfo-420\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-362\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [107] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[107] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [108] GET /doc-intrs/{id} — Interest API
run_request "[108] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [109] POST /doc-invst-bdls — Investment Bundler API
run_request "[109] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":8885,\"bdeRecVersion\":9393,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-956\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-961\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-403\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-345\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":606,\"orderedBy\":\"orderedBy-372\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":7623,\"remnBaccBalMin\":2363,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [110] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[110] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [111] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[111] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":9479,\"bdeRecVersion\":5747,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-646\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-440\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-286\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-647\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3240,\"orderedBy\":\"orderedBy-941\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":4338,\"remnBaccBalMin\":755,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [112] POST /doc-crm-issues — Issue Management API
run_request "[112] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-802\",\"advNr\":6281,\"allDayEvt\":true,\"attch\":\"attch-360\",\"bdeRecVersion\":9042,\"campgnTaskSeqNr\":2894,\"descn\":\"descn-455\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-653\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-652\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-767\",\"findingKey\":\"findingKey-644\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-208\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-367\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-760\",\"location\":\"location-481\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8991,\"orderedBy\":\"orderedBy-454\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4175,\"qtyLinked\":8389,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-868\",\"subject\":\"subject-464\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-793\",\"undefBp\":\"undefBp-744\",\"val\":114,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [113] GET /doc-crm-issues/{id} — Issue Management API
run_request "[113] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [114] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[114] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-502\",\"advNr\":3476,\"allDayEvt\":true,\"attch\":\"attch-913\",\"bdeRecVersion\":9069,\"campgnTaskSeqNr\":6255,\"descn\":\"descn-853\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-427\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-255\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-793\",\"findingKey\":\"findingKey-950\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-167\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-951\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-820\",\"location\":\"location-896\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6554,\"orderedBy\":\"orderedBy-332\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9125,\"qtyLinked\":3123,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-905\",\"subject\":\"subject-190\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-377\",\"undefBp\":\"undefBp-585\",\"val\":5452,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [115] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[115] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [116] GET /doc-letters/{id} — Letter API
run_request "[116] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [117] POST /doc-limits — Limit API
run_request "[117] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":1574,\"advTextCred\":\"advTextCred-858\",\"advTextDeb\":\"advTextDeb-928\",\"amount\":573578.86,\"bdeRecVersion\":1801,\"bookTextCred\":\"bookTextCred-446\",\"bookTextDeb\":\"bookTextDeb-186\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-474\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-811\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-645\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-947\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-587\",\"nextReview\":\"nextReview-226\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9964,\"orderedBy\":\"orderedBy-475\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [118] GET /doc-limits/{id} — Limit API
run_request "[118] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [119] PATCH /doc-limits/{id} — Limit API
run_request "[119] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":2698,\"advTextCred\":\"advTextCred-814\",\"advTextDeb\":\"advTextDeb-883\",\"amount\":593808.57,\"bdeRecVersion\":6490,\"bookTextCred\":\"bookTextCred-272\",\"bookTextDeb\":\"bookTextDeb-635\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-227\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-993\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-270\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-524\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-731\",\"nextReview\":\"nextReview-722\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2198,\"orderedBy\":\"orderedBy-663\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [120] POST /doc-loans — Loan API
run_request "[120] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":8660,\"advTextCred\":\"advTextCred-501\",\"advTextDeb\":\"advTextDeb-763\",\"bdeRecVersion\":5170,\"bookTextCred\":\"bookTextCred-113\",\"bookTextDeb\":\"bookTextDeb-639\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-578\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-818\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-163\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-363\",\"intrGradManMarkup\":3603,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-324\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9527,\"orderedBy\":\"orderedBy-628\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5817,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [121] GET /doc-loans/{id} — Loan API
run_request "[121] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [122] PATCH /doc-loans/{id} — Loan API
run_request "[122] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":366,\"advTextCred\":\"advTextCred-767\",\"advTextDeb\":\"advTextDeb-814\",\"bdeRecVersion\":6167,\"bookTextCred\":\"bookTextCred-149\",\"bookTextDeb\":\"bookTextDeb-514\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-338\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-776\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-384\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-993\",\"intrGradManMarkup\":9690,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-136\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8152,\"orderedBy\":\"orderedBy-897\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8482,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [123] POST /doc-mass-settles — Mass Settlement API
run_request "[123] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":9518,\"autoFillList\":true,\"bdeRecVersion\":8250,\"benefBpText\":\"benefBpText-109\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-308\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-615\",\"destBankClr\":\"destBankClr-927\",\"destBankText\":\"destBankText-988\",\"destBenefText\":\"destBenefText-484\",\"destInfo\":\"destInfo-196\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-638\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-517\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-687\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-676\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9207,\"orderedBy\":\"orderedBy-561\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [124] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[124] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [125] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[125] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":9786,\"autoFillList\":true,\"bdeRecVersion\":2542,\"benefBpText\":\"benefBpText-594\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-821\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-280\",\"destBankClr\":\"destBankClr-827\",\"destBankText\":\"destBankText-177\",\"destBenefText\":\"destBenefText-255\",\"destInfo\":\"destInfo-386\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-804\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-146\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-343\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-188\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1125,\"orderedBy\":\"orderedBy-683\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [126] POST /doc-mmkts — Money Market API
run_request "[126] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":9422,\"bdeRecVersion\":7391,\"capt\":6514,\"dcdStrike\":8050,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-330\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-293\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-585\",\"intrRate\":1.435,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-925\",\"maturityDate\":\"2026-03-17\",\"mktRate\":6.31,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7717,\"orderedBy\":\"orderedBy-467\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6724,\"respBpA\":true,\"respObjA\":true,\"rmRate\":0.509,\"settlePlanA\":true,\"trdrRate\":6.714,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [127] GET /doc-mmkts/{id} — Money Market API
run_request "[127] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [128] PATCH /doc-mmkts/{id} — Money Market API
run_request "[128] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":4531,\"bdeRecVersion\":362,\"capt\":4857,\"dcdStrike\":5567,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-983\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-619\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-429\",\"intrRate\":0.866,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-277\",\"maturityDate\":\"2026-03-17\",\"mktRate\":4.708,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1938,\"orderedBy\":\"orderedBy-399\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":3759,\"respBpA\":true,\"respObjA\":true,\"rmRate\":3.488,\"settlePlanA\":true,\"trdrRate\":4.436,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [129] POST /doc-xfermons — Money Transfer API
run_request "[129] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":4051,\"amount\":618429.16,\"bdeRecVersion\":3467,\"bulkItemIdent\":\"bulkItemIdent-660\",\"credAdvText\":\"credAdvText-195\",\"credBookText\":\"credBookText-354\",\"debAdvText\":\"debAdvText-314\",\"debBookText\":\"debBookText-744\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-206\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-307\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-823\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-352\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4714,\"orderedBy\":\"orderedBy-192\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [130] GET /doc-xfermons/{id} — Money Transfer API
run_request "[130] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [131] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[131] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":5665,\"amount\":768607.33,\"bdeRecVersion\":1331,\"bulkItemIdent\":\"bulkItemIdent-632\",\"credAdvText\":\"credAdvText-757\",\"credBookText\":\"credBookText-860\",\"debAdvText\":\"debAdvText-566\",\"debBookText\":\"debBookText-887\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-182\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-104\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-634\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-780\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3134,\"orderedBy\":\"orderedBy-440\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [132] POST /doc-oofxs — OTC FX Option API
run_request "[132] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":4722,\"advTextCred\":\"advTextCred-837\",\"advTextDeb\":\"advTextDeb-281\",\"bdeRecVersion\":5400,\"bookTextCred\":\"bookTextCred-735\",\"bookTextDeb\":\"bookTextDeb-573\",\"callQty\":7578,\"cutOffTime\":\"cutOffTime-392\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-891\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-858\",\"gross\":\"gross-149\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-651\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-781\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1486,\"orderedBy\":\"orderedBy-277\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-178\",\"putQty\":5632,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-394\",\"spread2\":\"spread2-958\",\"strike\":4232,\"strikePict\":323,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [133] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[133] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [134] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[134] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":2769,\"advTextCred\":\"advTextCred-852\",\"advTextDeb\":\"advTextDeb-227\",\"bdeRecVersion\":1975,\"bookTextCred\":\"bookTextCred-427\",\"bookTextDeb\":\"bookTextDeb-251\",\"callQty\":1542,\"cutOffTime\":\"cutOffTime-255\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-281\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-849\",\"gross\":\"gross-885\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-529\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-253\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9924,\"orderedBy\":\"orderedBy-715\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-639\",\"putQty\":2183,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-545\",\"spread2\":\"spread2-525\",\"strike\":8137,\"strikePict\":5834,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [135] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[135] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [136] GET /doc-otcopts/{id} — OTC Option API
run_request "[136] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [137] GET /doc-othsecs/{id} — Other Security API
run_request "[137] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [138] POST /doc-pays — Payment API
run_request "[138] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":9164,\"amount\":808767,\"bank\":\"bank-511\",\"bankAcc\":\"bankAcc-455\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-719\",\"bankCorr1\":\"bankCorr1-364\",\"bankCorr1Acc\":\"bankCorr1Acc-826\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-557\",\"bankCorr3\":\"bankCorr3-259\",\"bankCorr3Acc\":\"bankCorr3Acc-559\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-686\",\"bankCorr4\":\"bankCorr4-501\",\"bankCorr4Acc\":\"bankCorr4Acc-176\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-338\",\"bankInfo\":\"bankInfo-212\",\"bdeRecVersion\":8553,\"benef\":\"benef-840\",\"benefAcc\":\"benefAcc-231\",\"benefIban\":\"DE34248929643267357\",\"benefInfo\":\"benefInfo-427\",\"benefRefNr\":\"benefRefNr-820\",\"bookTextCred\":\"bookTextCred-425\",\"bookTextDeb\":\"bookTextDeb-435\",\"bulkItemIdent\":\"bulkItemIdent-536\",\"destCountry\":{\"id\":2,\"ident\":\"DE\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-954\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-986\",\"hasPostit\":true,\"instrAmount\":962436.14,\"intlRefNr\":\"intlRefNr-125\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"US7651867558\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-315\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-432\",\"ordBankAcc\":\"ordBankAcc-325\",\"ordBankClearNr\":\"ordBankClearNr-372\",\"ordRef\":\"ordRef-700\",\"orderDate\":\"2026-03-17\",\"orderNr\":9028,\"orderedBy\":\"orderedBy-877\",\"orderedByAcc\":\"orderedByAcc-400\",\"origGrpRef\":\"origGrpRef-897\",\"originCountry\":{\"id\":4,\"ident\":\"FR\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-609\",\"stordPeriodEnd\":\"stordPeriodEnd-203\",\"stordPeriodStart\":\"stordPeriodStart-851\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41537142966\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [139] GET /doc-pays/{id} — Payment API
run_request "[139] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [140] PATCH /doc-pays/{id} — Payment API
run_request "[140] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":6525,\"amount\":176758.14,\"bank\":\"bank-260\",\"bankAcc\":\"bankAcc-218\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-955\",\"bankCorr1\":\"bankCorr1-179\",\"bankCorr1Acc\":\"bankCorr1Acc-503\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-809\",\"bankCorr3\":\"bankCorr3-139\",\"bankCorr3Acc\":\"bankCorr3Acc-125\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-247\",\"bankCorr4\":\"bankCorr4-208\",\"bankCorr4Acc\":\"bankCorr4Acc-456\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-172\",\"bankInfo\":\"bankInfo-667\",\"bdeRecVersion\":2481,\"benef\":\"benef-154\",\"benefAcc\":\"benefAcc-554\",\"benefIban\":\"CH23197430881228887\",\"benefInfo\":\"benefInfo-468\",\"benefRefNr\":\"benefRefNr-843\",\"bookTextCred\":\"bookTextCred-789\",\"bookTextDeb\":\"bookTextDeb-194\",\"bulkItemIdent\":\"bulkItemIdent-379\",\"destCountry\":{\"id\":1,\"ident\":\"CH\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-581\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-594\",\"hasPostit\":true,\"instrAmount\":901483.7,\"intlRefNr\":\"intlRefNr-209\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH4213867326\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-280\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-644\",\"ordBankAcc\":\"ordBankAcc-566\",\"ordBankClearNr\":\"ordBankClearNr-962\",\"ordRef\":\"ordRef-148\",\"orderDate\":\"2026-03-17\",\"orderNr\":1369,\"orderedBy\":\"orderedBy-832\",\"orderedByAcc\":\"orderedByAcc-719\",\"origGrpRef\":\"origGrpRef-332\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-867\",\"stordPeriodEnd\":\"stordPeriodEnd-261\",\"stordPeriodStart\":\"stordPeriodStart-995\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+44516271063\"}"

# [141] GET /doc-realsecs/{id} — Real Security API
run_request "[141] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [142] POST /doc-realtys — Realty API
run_request "[142] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":931,\"bdeRecVersion\":7007,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-219\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-899\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-238\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-589\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6023,\"orderedBy\":\"orderedBy-840\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [143] GET /doc-realtys/{id} — Realty API
run_request "[143] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [144] PATCH /doc-realtys/{id} — Realty API
run_request "[144] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":193,\"bdeRecVersion\":6079,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-384\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-758\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-904\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-431\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8596,\"orderedBy\":\"orderedBy-449\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [145] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[145] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":2363,\"bdeRecVersion\":8376,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-712\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-747\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-410\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-859\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7666,\"orderedBy\":\"orderedBy-415\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [146] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[146] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [147] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[147] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":9323,\"bdeRecVersion\":1487,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-323\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-415\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-106\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-815\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2957,\"orderedBy\":\"orderedBy-612\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [148] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[148] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [149] POST /doc-rebalss — Rebalancer Order API
run_request "[149] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":5943,\"bdeRecVersion\":5887,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-887\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-247\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-537\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-182\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3179,\"orderedBy\":\"orderedBy-766\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [150] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[150] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [151] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[151] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":5094,\"bdeRecVersion\":3835,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-939\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-281\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-956\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-638\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6830,\"orderedBy\":\"orderedBy-261\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [152] GET /doc-repocs/{id} — Repo Contract API
run_request "[152] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [837] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[837] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [838] POST /doc-ctact2s — Contact Management (V2) API
run_request "[838] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":478,\"attch\":\"attch-264\",\"attchA\":true,\"bdeRecVersion\":2618,\"campgnCltReaction\":\"campgnCltReaction-948\",\"campgnRespKey\":\"campgnRespKey-480\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-821\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-311\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-994\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-324\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-373\",\"linkDocListA\":true,\"loc\":\"loc-593\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8736,\"orderedBy\":\"orderedBy-933\",\"particListA\":true,\"questrSeqNr\":8269,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":9241,\"reactComment\":\"reactComment-571\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-871\",\"reactNrPartic\":7030,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-849\",\"subjA\":true,\"syncSeqNr\":8912,\"totExpndTimeM\":5258,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [839] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[839] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [840] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[840] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":7377,\"attch\":\"attch-931\",\"attchA\":true,\"bdeRecVersion\":3653,\"campgnCltReaction\":\"campgnCltReaction-350\",\"campgnRespKey\":\"campgnRespKey-423\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-220\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-882\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-113\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-557\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-422\",\"linkDocListA\":true,\"loc\":\"loc-594\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7655,\"orderedBy\":\"orderedBy-825\",\"particListA\":true,\"questrSeqNr\":9010,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":6355,\"reactComment\":\"reactComment-842\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-358\",\"reactNrPartic\":6498,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-814\",\"subjA\":true,\"syncSeqNr\":8944,\"totExpndTimeM\":5915,\"trxDate\":\"2026-03-17\"}"

# [841] GET /doc-cmgs/{id} — Cashier Management API
run_request "[841] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [842] GET /doc-cops/{id} — Cashier Operations API
run_request "[842] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [843] POST /doc-clts — Client Opening API
run_request "[843] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [844] GET /doc-clts/{id} — Client Opening API
run_request "[844] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [845] PATCH /doc-clts/{id} — Client Opening API
run_request "[845] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [846] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[846] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [847] GET /doc-cltms/{id} — Collateral Movement API
run_request "[847] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [848] GET /doc-cords/{id} — Collective Order API
run_request "[848] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [849] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[849] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [850] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[850] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [851] POST /doc-xioms — External Investment Order Manager API
run_request "[851] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":9902,\"bdeRecVersion\":269,\"bpLevelRep\":true,\"descn\":\"descn-372\",\"extlRefNr\":\"extlRefNr-489\",\"extlRepLang\":\"extlRepLang-257\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-854\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-354\",\"linkGrp\":8562,\"orderDate\":\"2026-03-17\",\"orderNr\":684,\"orderedBy\":\"orderedBy-342\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [852] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[852] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [853] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[853] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":5638,\"bdeRecVersion\":6879,\"bpLevelRep\":true,\"descn\":\"descn-873\",\"extlRefNr\":\"extlRefNr-318\",\"extlRepLang\":\"extlRepLang-353\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-825\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-856\",\"linkGrp\":2052,\"orderDate\":\"2026-03-17\",\"orderNr\":9376,\"orderedBy\":\"orderedBy-510\",\"sendRepToEbank\":true}"

# [854] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[854] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [855] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[855] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [856] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[856] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>Capi Test Report · Part 2</title>
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
<h1>🧪 Capi Test Report <span style='color:#8b949e;font-size:14px'>Part 2 / 8</span></h1>
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