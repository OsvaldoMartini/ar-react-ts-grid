#!/usr/bin/env bash
# =============================================================
# Capi Test Runner — FLOW Execution (Part 8/8)
# Generated: 2026-03-17T10:50:15.755Z
# Cases:     565–760 of 1596
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-17-10-50-12_part8_report.html"
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
ID_DOC_FXSWS=""
ID_DOC_FXTRS=""
ID_DOC_GUARCREDS=""
ID_DOC_INPAYS=""
ID_DOC_IRSS=""
ID_DOC_INTRS=""

# ── INIT HTML REPORT ─────────────────────────────────────────
echo "Starting 196 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [565] POST /doc-invst-bdls — Investment Bundler API
run_request "[565] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":7514,\"bdeRecVersion\":4764,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-729\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-154\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-693\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-121\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4538,\"orderedBy\":\"orderedBy-373\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":7901,\"remnBaccBalMin\":4605,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [566] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[566] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [567] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[567] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":9056,\"bdeRecVersion\":3169,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-248\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-473\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-318\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-224\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2675,\"orderedBy\":\"orderedBy-198\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":6699,\"remnBaccBalMin\":5571,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [568] POST /doc-crm-issues — Issue Management API
run_request "[568] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-955\",\"advNr\":4038,\"allDayEvt\":true,\"attch\":\"attch-278\",\"bdeRecVersion\":5614,\"campgnTaskSeqNr\":9925,\"descn\":\"descn-646\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-497\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-361\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-416\",\"findingKey\":\"findingKey-634\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-339\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-215\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-894\",\"location\":\"location-200\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5185,\"orderedBy\":\"orderedBy-428\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8818,\"qtyLinked\":2883,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-819\",\"subject\":\"subject-669\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-543\",\"undefBp\":\"undefBp-850\",\"val\":5241,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [569] GET /doc-crm-issues/{id} — Issue Management API
run_request "[569] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [570] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[570] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-243\",\"advNr\":2788,\"allDayEvt\":true,\"attch\":\"attch-714\",\"bdeRecVersion\":333,\"campgnTaskSeqNr\":2675,\"descn\":\"descn-429\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-331\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-592\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-920\",\"findingKey\":\"findingKey-387\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-559\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-165\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-606\",\"location\":\"location-817\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9916,\"orderedBy\":\"orderedBy-878\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8038,\"qtyLinked\":9243,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-877\",\"subject\":\"subject-610\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-263\",\"undefBp\":\"undefBp-853\",\"val\":3253,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [571] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[571] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [572] GET /doc-letters/{id} — Letter API
run_request "[572] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [573] POST /doc-limits — Limit API
run_request "[573] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":3586,\"advTextCred\":\"advTextCred-782\",\"advTextDeb\":\"advTextDeb-450\",\"amount\":883557.32,\"bdeRecVersion\":6722,\"bookTextCred\":\"bookTextCred-504\",\"bookTextDeb\":\"bookTextDeb-202\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-864\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-434\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-417\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-865\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-927\",\"nextReview\":\"nextReview-997\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8141,\"orderedBy\":\"orderedBy-595\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [574] GET /doc-limits/{id} — Limit API
run_request "[574] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [575] PATCH /doc-limits/{id} — Limit API
run_request "[575] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":7380,\"advTextCred\":\"advTextCred-628\",\"advTextDeb\":\"advTextDeb-230\",\"amount\":391112.98,\"bdeRecVersion\":9697,\"bookTextCred\":\"bookTextCred-315\",\"bookTextDeb\":\"bookTextDeb-259\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-363\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-247\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-777\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-584\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-768\",\"nextReview\":\"nextReview-482\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8608,\"orderedBy\":\"orderedBy-192\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [576] POST /doc-loans — Loan API
run_request "[576] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":4888,\"advTextCred\":\"advTextCred-557\",\"advTextDeb\":\"advTextDeb-294\",\"bdeRecVersion\":2265,\"bookTextCred\":\"bookTextCred-812\",\"bookTextDeb\":\"bookTextDeb-871\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-118\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-322\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-729\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-452\",\"intrGradManMarkup\":3571,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-316\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3990,\"orderedBy\":\"orderedBy-641\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1312,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [577] GET /doc-loans/{id} — Loan API
run_request "[577] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [578] PATCH /doc-loans/{id} — Loan API
run_request "[578] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":6757,\"advTextCred\":\"advTextCred-222\",\"advTextDeb\":\"advTextDeb-744\",\"bdeRecVersion\":5890,\"bookTextCred\":\"bookTextCred-913\",\"bookTextDeb\":\"bookTextDeb-366\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-285\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-152\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-386\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-271\",\"intrGradManMarkup\":5471,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-195\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9630,\"orderedBy\":\"orderedBy-437\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2283,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [579] POST /doc-mass-settles — Mass Settlement API
run_request "[579] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":2000,\"autoFillList\":true,\"bdeRecVersion\":3068,\"benefBpText\":\"benefBpText-831\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-940\",\"destBankBic\":\"DEUTDEDB\",\"destBankBpText\":\"destBankBpText-580\",\"destBankClr\":\"destBankClr-305\",\"destBankText\":\"destBankText-104\",\"destBenefText\":\"destBenefText-470\",\"destInfo\":\"destInfo-737\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-654\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-839\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-869\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-650\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2177,\"orderedBy\":\"orderedBy-682\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [580] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[580] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [581] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[581] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":2756,\"autoFillList\":true,\"bdeRecVersion\":5069,\"benefBpText\":\"benefBpText-524\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-628\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-656\",\"destBankClr\":\"destBankClr-608\",\"destBankText\":\"destBankText-797\",\"destBenefText\":\"destBenefText-499\",\"destInfo\":\"destInfo-395\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-182\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-128\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-187\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-812\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7624,\"orderedBy\":\"orderedBy-566\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [582] POST /doc-mmkts — Money Market API
run_request "[582] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":9718,\"bdeRecVersion\":1252,\"capt\":7385,\"dcdStrike\":8541,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-858\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-317\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-738\",\"intrRate\":6.611,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-794\",\"maturityDate\":\"2026-03-17\",\"mktRate\":0.43,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":25,\"orderedBy\":\"orderedBy-962\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1027,\"respBpA\":true,\"respObjA\":true,\"rmRate\":1.065,\"settlePlanA\":true,\"trdrRate\":2.707,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [583] GET /doc-mmkts/{id} — Money Market API
run_request "[583] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [584] PATCH /doc-mmkts/{id} — Money Market API
run_request "[584] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":4975,\"bdeRecVersion\":3149,\"capt\":8895,\"dcdStrike\":9735,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-307\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-288\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-415\",\"intrRate\":7.56,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-645\",\"maturityDate\":\"2026-03-17\",\"mktRate\":6.337,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8736,\"orderedBy\":\"orderedBy-388\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":506,\"respBpA\":true,\"respObjA\":true,\"rmRate\":7.225,\"settlePlanA\":true,\"trdrRate\":7.299,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [585] POST /doc-xfermons — Money Transfer API
run_request "[585] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":5040,\"amount\":609988.8,\"bdeRecVersion\":1446,\"bulkItemIdent\":\"bulkItemIdent-620\",\"credAdvText\":\"credAdvText-536\",\"credBookText\":\"credBookText-524\",\"debAdvText\":\"debAdvText-208\",\"debBookText\":\"debBookText-690\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-278\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-382\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-766\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-747\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3015,\"orderedBy\":\"orderedBy-723\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [586] GET /doc-xfermons/{id} — Money Transfer API
run_request "[586] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [587] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[587] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":1414,\"amount\":610497.68,\"bdeRecVersion\":6266,\"bulkItemIdent\":\"bulkItemIdent-552\",\"credAdvText\":\"credAdvText-952\",\"credBookText\":\"credBookText-905\",\"debAdvText\":\"debAdvText-207\",\"debBookText\":\"debBookText-503\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-680\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-284\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-576\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-100\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5009,\"orderedBy\":\"orderedBy-618\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [588] POST /doc-oofxs — OTC FX Option API
run_request "[588] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":2828,\"advTextCred\":\"advTextCred-627\",\"advTextDeb\":\"advTextDeb-502\",\"bdeRecVersion\":4018,\"bookTextCred\":\"bookTextCred-938\",\"bookTextDeb\":\"bookTextDeb-757\",\"callQty\":6903,\"cutOffTime\":\"cutOffTime-579\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-884\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-556\",\"gross\":\"gross-399\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-637\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-595\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":396,\"orderedBy\":\"orderedBy-521\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-576\",\"putQty\":425,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-315\",\"spread2\":\"spread2-291\",\"strike\":4044,\"strikePict\":3070,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [589] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[589] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [590] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[590] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":7139,\"advTextCred\":\"advTextCred-676\",\"advTextDeb\":\"advTextDeb-350\",\"bdeRecVersion\":7973,\"bookTextCred\":\"bookTextCred-230\",\"bookTextDeb\":\"bookTextDeb-437\",\"callQty\":5383,\"cutOffTime\":\"cutOffTime-958\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-526\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-808\",\"gross\":\"gross-461\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-893\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-853\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8313,\"orderedBy\":\"orderedBy-568\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-499\",\"putQty\":5114,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-742\",\"spread2\":\"spread2-235\",\"strike\":4362,\"strikePict\":1447,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [591] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[591] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [592] GET /doc-otcopts/{id} — OTC Option API
run_request "[592] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [593] GET /doc-othsecs/{id} — Other Security API
run_request "[593] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [594] POST /doc-pays — Payment API
run_request "[594] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":5670,\"amount\":237800.03,\"bank\":\"bank-210\",\"bankAcc\":\"bankAcc-780\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-575\",\"bankCorr1\":\"bankCorr1-943\",\"bankCorr1Acc\":\"bankCorr1Acc-159\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-809\",\"bankCorr3\":\"bankCorr3-872\",\"bankCorr3Acc\":\"bankCorr3Acc-402\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-249\",\"bankCorr4\":\"bankCorr4-274\",\"bankCorr4Acc\":\"bankCorr4Acc-191\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-649\",\"bankInfo\":\"bankInfo-744\",\"bdeRecVersion\":8400,\"benef\":\"benef-886\",\"benefAcc\":\"benefAcc-626\",\"benefIban\":\"IT34548292646850104\",\"benefInfo\":\"benefInfo-606\",\"benefRefNr\":\"benefRefNr-211\",\"bookTextCred\":\"bookTextCred-496\",\"bookTextDeb\":\"bookTextDeb-274\",\"bulkItemIdent\":\"bulkItemIdent-225\",\"destCountry\":{\"id\":7,\"ident\":\"US\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-309\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-918\",\"hasPostit\":true,\"instrAmount\":984412.93,\"intlRefNr\":\"intlRefNr-282\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"FR7175102882\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-553\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-507\",\"ordBankAcc\":\"ordBankAcc-593\",\"ordBankClearNr\":\"ordBankClearNr-971\",\"ordRef\":\"ordRef-876\",\"orderDate\":\"2026-03-17\",\"orderNr\":4547,\"orderedBy\":\"orderedBy-333\",\"orderedByAcc\":\"orderedByAcc-264\",\"origGrpRef\":\"origGrpRef-279\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-643\",\"stordPeriodEnd\":\"stordPeriodEnd-794\",\"stordPeriodStart\":\"stordPeriodStart-337\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41920553497\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [595] GET /doc-pays/{id} — Payment API
run_request "[595] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [596] PATCH /doc-pays/{id} — Payment API
run_request "[596] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":1109,\"amount\":235629.49,\"bank\":\"bank-609\",\"bankAcc\":\"bankAcc-230\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-690\",\"bankCorr1\":\"bankCorr1-564\",\"bankCorr1Acc\":\"bankCorr1Acc-450\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-855\",\"bankCorr3\":\"bankCorr3-522\",\"bankCorr3Acc\":\"bankCorr3Acc-699\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-124\",\"bankCorr4\":\"bankCorr4-744\",\"bankCorr4Acc\":\"bankCorr4Acc-237\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-841\",\"bankInfo\":\"bankInfo-598\",\"bdeRecVersion\":3808,\"benef\":\"benef-108\",\"benefAcc\":\"benefAcc-328\",\"benefIban\":\"FR86108092779216855\",\"benefInfo\":\"benefInfo-633\",\"benefRefNr\":\"benefRefNr-107\",\"bookTextCred\":\"bookTextCred-210\",\"bookTextDeb\":\"bookTextDeb-801\",\"bulkItemIdent\":\"bulkItemIdent-585\",\"destCountry\":{\"id\":2,\"ident\":\"DE\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-407\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-307\",\"hasPostit\":true,\"instrAmount\":566302.79,\"intlRefNr\":\"intlRefNr-120\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE1861896403\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-468\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-118\",\"ordBankAcc\":\"ordBankAcc-578\",\"ordBankClearNr\":\"ordBankClearNr-501\",\"ordRef\":\"ordRef-490\",\"orderDate\":\"2026-03-17\",\"orderNr\":8563,\"orderedBy\":\"orderedBy-507\",\"orderedByAcc\":\"orderedByAcc-191\",\"origGrpRef\":\"origGrpRef-362\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-899\",\"stordPeriodEnd\":\"stordPeriodEnd-527\",\"stordPeriodStart\":\"stordPeriodStart-563\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41432269491\"}"

# [597] GET /doc-realsecs/{id} — Real Security API
run_request "[597] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [598] POST /doc-realtys — Realty API
run_request "[598] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":6409,\"bdeRecVersion\":1027,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-117\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-315\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-690\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-337\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3411,\"orderedBy\":\"orderedBy-108\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [599] GET /doc-realtys/{id} — Realty API
run_request "[599] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [600] PATCH /doc-realtys/{id} — Realty API
run_request "[600] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":6936,\"bdeRecVersion\":9452,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-363\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-981\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-803\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-654\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5573,\"orderedBy\":\"orderedBy-395\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [601] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[601] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":6711,\"bdeRecVersion\":7301,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-462\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-207\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-111\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-268\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8747,\"orderedBy\":\"orderedBy-833\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [602] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[602] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [603] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[603] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":7549,\"bdeRecVersion\":4467,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-709\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-970\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-107\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-679\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6803,\"orderedBy\":\"orderedBy-127\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [604] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[604] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [605] POST /doc-rebalss — Rebalancer Order API
run_request "[605] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":8668,\"bdeRecVersion\":6995,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-998\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-451\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-968\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-233\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7371,\"orderedBy\":\"orderedBy-987\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [606] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[606] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [607] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[607] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":8792,\"bdeRecVersion\":4310,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-132\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-967\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-455\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-120\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":659,\"orderedBy\":\"orderedBy-350\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [608] GET /doc-repocs/{id} — Repo Contract API
run_request "[608] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [609] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[609] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [610] POST /doc-ctact2s — Contact Management (V2) API
run_request "[610] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":5791,\"attch\":\"attch-266\",\"attchA\":true,\"bdeRecVersion\":2193,\"campgnCltReaction\":\"campgnCltReaction-719\",\"campgnRespKey\":\"campgnRespKey-488\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-419\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-501\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-539\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-182\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-838\",\"linkDocListA\":true,\"loc\":\"loc-396\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5506,\"orderedBy\":\"orderedBy-923\",\"particListA\":true,\"questrSeqNr\":7649,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":4900,\"reactComment\":\"reactComment-854\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-483\",\"reactNrPartic\":5247,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-289\",\"subjA\":true,\"syncSeqNr\":1957,\"totExpndTimeM\":3843,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [611] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[611] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [612] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[612] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":2356,\"attch\":\"attch-702\",\"attchA\":true,\"bdeRecVersion\":7438,\"campgnCltReaction\":\"campgnCltReaction-581\",\"campgnRespKey\":\"campgnRespKey-801\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-927\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-191\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-679\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-480\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-472\",\"linkDocListA\":true,\"loc\":\"loc-676\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3322,\"orderedBy\":\"orderedBy-346\",\"particListA\":true,\"questrSeqNr\":2371,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":2680,\"reactComment\":\"reactComment-251\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-891\",\"reactNrPartic\":9201,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-634\",\"subjA\":true,\"syncSeqNr\":2621,\"totExpndTimeM\":4288,\"trxDate\":\"2026-03-17\"}"

# [613] GET /doc-cmgs/{id} — Cashier Management API
run_request "[613] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [614] GET /doc-cops/{id} — Cashier Operations API
run_request "[614] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [615] POST /doc-clts — Client Opening API
run_request "[615] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [616] GET /doc-clts/{id} — Client Opening API
run_request "[616] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [617] PATCH /doc-clts/{id} — Client Opening API
run_request "[617] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [618] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[618] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [619] GET /doc-cltms/{id} — Collateral Movement API
run_request "[619] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [620] GET /doc-cords/{id} — Collective Order API
run_request "[620] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [621] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[621] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [622] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[622] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [623] POST /doc-xioms — External Investment Order Manager API
run_request "[623] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":9655,\"bdeRecVersion\":3487,\"bpLevelRep\":true,\"descn\":\"descn-670\",\"extlRefNr\":\"extlRefNr-416\",\"extlRepLang\":\"extlRepLang-695\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-827\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-856\",\"linkGrp\":1806,\"orderDate\":\"2026-03-17\",\"orderNr\":667,\"orderedBy\":\"orderedBy-549\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [624] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[624] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [625] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[625] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":2311,\"bdeRecVersion\":3921,\"bpLevelRep\":true,\"descn\":\"descn-942\",\"extlRefNr\":\"extlRefNr-947\",\"extlRepLang\":\"extlRepLang-437\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-423\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-196\",\"linkGrp\":857,\"orderDate\":\"2026-03-17\",\"orderNr\":8708,\"orderedBy\":\"orderedBy-891\",\"sendRepToEbank\":true}"

# [626] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[626] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [627] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[627] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [628] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[628] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [629] POST /doc-fxsws — FX Swap API
run_request "[629] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-118\",\"bdeRecVersion\":8657,\"buyBookText1\":\"buyBookText1-747\",\"buyBookText2\":\"buyBookText2-743\",\"buyQty1\":9880,\"buyQty2\":1022,\"cfi\":\"cfi-981\",\"dealFwdRate1\":1.23,\"dealFwdRate2\":3.138,\"dealSpotRate1\":6.96,\"dealSpotRate2\":1.656,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US5580483072\",\"lastTrans\":\"lastTrans-831\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-300\",\"period1\":\"period1-528\",\"period2\":\"period2-148\",\"sellBookText1\":\"sellBookText1-452\",\"sellBookText2\":\"sellBookText2-666\",\"sellQty1\":8215,\"sellQty2\":10,\"spotDate\":\"2026-03-17\",\"trdrRate1\":0.756,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [630] GET /doc-fxsws/{id} — FX Swap API
run_request "[630] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [631] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[631] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-427\",\"bdeRecVersion\":7215,\"buyBookText1\":\"buyBookText1-683\",\"buyBookText2\":\"buyBookText2-798\",\"buyQty1\":4146,\"buyQty2\":8758,\"cfi\":\"cfi-511\",\"dealFwdRate1\":1.809,\"dealFwdRate2\":6.125,\"dealSpotRate1\":3.074,\"dealSpotRate2\":2.049,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR5653697662\",\"lastTrans\":\"lastTrans-721\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-652\",\"period1\":\"period1-924\",\"period2\":\"period2-318\",\"sellBookText1\":\"sellBookText1-308\",\"sellBookText2\":\"sellBookText2-910\",\"sellQty1\":4100,\"sellQty2\":9117,\"spotDate\":\"2026-03-17\",\"trdrRate1\":7.704,\"trxDate\":\"2026-03-17\"}"

# [632] POST /doc-fxtrs — FXTR API
run_request "[632] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3393,\"advText\":\"advText-962\",\"bdeRecVersion\":8617,\"buyQty\":9152,\"dealFwdRate\":4.69,\"dealSpotRate\":2.636,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-445\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-105\",\"fwdSpread\":9598,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-324\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-665\",\"limit\":2836,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":9693,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1459,\"orderedBy\":\"orderedBy-268\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-971\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":2284,\"settlePlanA\":true,\"spotSpread1\":9829,\"spotSpread2\":1954,\"trdrRate\":3.567,\"trigPrice\":6197,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+41717650911\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [633] GET /doc-fxtrs/{id} — FXTR API
run_request "[633] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [634] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[634] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":8855,\"advText\":\"advText-201\",\"bdeRecVersion\":5417,\"buyQty\":415,\"dealFwdRate\":6.51,\"dealSpotRate\":3.794,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-206\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-242\",\"fwdSpread\":493,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-268\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-954\",\"limit\":7228,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":2952,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5442,\"orderedBy\":\"orderedBy-997\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-984\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9352,\"settlePlanA\":true,\"spotSpread1\":5626,\"spotSpread2\":9404,\"trdrRate\":4.691,\"trigPrice\":6453,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44569044788\"}"

# [635] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[635] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [636] POST /doc-inpays — Incoming Payment API
run_request "[636] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":7897,\"amount\":92982.39,\"bankClearNr\":\"bankClearNr-518\",\"bankInfo\":\"bankInfo-864\",\"bdeRecVersion\":6157,\"benefAcc\":\"benefAcc-777\",\"benefRefNr\":\"benefRefNr-160\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-736\",\"contrPeriodStart\":\"contrPeriodStart-547\",\"credAddr\":\"credAddr-250\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-114\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-585\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-781\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-338\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-101\",\"orderDate\":\"2026-03-17\",\"orderNr\":2518,\"orderedBy\":\"orderedBy-284\",\"originCountry\":{\"id\":2,\"ident\":\"DE\"},\"payerAcc\":\"payerAcc-950\",\"payerAddrTxt\":\"payerAddrTxt-346\",\"payerIban\":\"IT12831140096679354\",\"payerInfo\":\"payerInfo-267\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-162\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [637] GET /doc-inpays/{id} — Incoming Payment API
run_request "[637] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [638] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[638] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":4860,\"amount\":122941.24,\"bankClearNr\":\"bankClearNr-586\",\"bankInfo\":\"bankInfo-805\",\"bdeRecVersion\":8261,\"benefAcc\":\"benefAcc-194\",\"benefRefNr\":\"benefRefNr-163\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-387\",\"contrPeriodStart\":\"contrPeriodStart-329\",\"credAddr\":\"credAddr-159\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-545\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-800\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-442\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-812\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-151\",\"orderDate\":\"2026-03-17\",\"orderNr\":6945,\"orderedBy\":\"orderedBy-379\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payerAcc\":\"payerAcc-845\",\"payerAddrTxt\":\"payerAddrTxt-192\",\"payerIban\":\"DE94740536278517101\",\"payerInfo\":\"payerInfo-152\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-836\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [639] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[639] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [640] GET /doc-intrs/{id} — Interest API
run_request "[640] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [641] POST /doc-invst-bdls — Investment Bundler API
run_request "[641] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":992,\"bdeRecVersion\":3755,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-279\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-444\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-726\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-717\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6126,\"orderedBy\":\"orderedBy-260\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":6988,\"remnBaccBalMin\":5380,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [642] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[642] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [643] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[643] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":3195,\"bdeRecVersion\":9456,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-231\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-131\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-892\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-806\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9013,\"orderedBy\":\"orderedBy-128\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":1420,\"remnBaccBalMin\":295,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [644] POST /doc-crm-issues — Issue Management API
run_request "[644] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-625\",\"advNr\":5746,\"allDayEvt\":true,\"attch\":\"attch-114\",\"bdeRecVersion\":1736,\"campgnTaskSeqNr\":7389,\"descn\":\"descn-233\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-455\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-527\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-789\",\"findingKey\":\"findingKey-861\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-376\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-677\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-475\",\"location\":\"location-804\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6039,\"orderedBy\":\"orderedBy-147\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":664,\"qtyLinked\":7143,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-536\",\"subject\":\"subject-165\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-748\",\"undefBp\":\"undefBp-714\",\"val\":7513,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [645] GET /doc-crm-issues/{id} — Issue Management API
run_request "[645] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [646] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[646] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-319\",\"advNr\":4645,\"allDayEvt\":true,\"attch\":\"attch-890\",\"bdeRecVersion\":2008,\"campgnTaskSeqNr\":319,\"descn\":\"descn-961\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-859\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-983\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-585\",\"findingKey\":\"findingKey-749\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-549\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-904\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-190\",\"location\":\"location-571\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9548,\"orderedBy\":\"orderedBy-936\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":3968,\"qtyLinked\":5254,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-301\",\"subject\":\"subject-856\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-425\",\"undefBp\":\"undefBp-531\",\"val\":3135,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [647] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[647] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [648] GET /doc-letters/{id} — Letter API
run_request "[648] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [649] POST /doc-limits — Limit API
run_request "[649] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":5336,\"advTextCred\":\"advTextCred-994\",\"advTextDeb\":\"advTextDeb-732\",\"amount\":489654.56,\"bdeRecVersion\":2887,\"bookTextCred\":\"bookTextCred-421\",\"bookTextDeb\":\"bookTextDeb-410\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-648\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-708\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-833\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-257\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-795\",\"nextReview\":\"nextReview-574\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1965,\"orderedBy\":\"orderedBy-211\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [650] GET /doc-limits/{id} — Limit API
run_request "[650] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [651] PATCH /doc-limits/{id} — Limit API
run_request "[651] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":5075,\"advTextCred\":\"advTextCred-692\",\"advTextDeb\":\"advTextDeb-867\",\"amount\":904439.52,\"bdeRecVersion\":33,\"bookTextCred\":\"bookTextCred-542\",\"bookTextDeb\":\"bookTextDeb-933\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-423\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-403\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-815\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-311\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-939\",\"nextReview\":\"nextReview-255\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8372,\"orderedBy\":\"orderedBy-347\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [652] POST /doc-loans — Loan API
run_request "[652] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":3879,\"advTextCred\":\"advTextCred-755\",\"advTextDeb\":\"advTextDeb-358\",\"bdeRecVersion\":7906,\"bookTextCred\":\"bookTextCred-441\",\"bookTextDeb\":\"bookTextDeb-538\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-309\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-213\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-702\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-691\",\"intrGradManMarkup\":9125,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-753\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2255,\"orderedBy\":\"orderedBy-228\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6987,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [653] GET /doc-loans/{id} — Loan API
run_request "[653] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [654] PATCH /doc-loans/{id} — Loan API
run_request "[654] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":985,\"advTextCred\":\"advTextCred-820\",\"advTextDeb\":\"advTextDeb-956\",\"bdeRecVersion\":9590,\"bookTextCred\":\"bookTextCred-294\",\"bookTextDeb\":\"bookTextDeb-263\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-615\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-849\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-734\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-547\",\"intrGradManMarkup\":2619,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-822\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":4233,\"orderedBy\":\"orderedBy-613\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9975,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [655] POST /doc-mass-settles — Mass Settlement API
run_request "[655] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":8917,\"autoFillList\":true,\"bdeRecVersion\":3592,\"benefBpText\":\"benefBpText-627\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-946\",\"destBankBic\":\"UBSWCHZH80A\",\"destBankBpText\":\"destBankBpText-366\",\"destBankClr\":\"destBankClr-966\",\"destBankText\":\"destBankText-703\",\"destBenefText\":\"destBenefText-851\",\"destInfo\":\"destInfo-987\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-143\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-589\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-656\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-523\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":337,\"orderedBy\":\"orderedBy-821\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [656] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[656] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [657] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[657] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":4843,\"autoFillList\":true,\"bdeRecVersion\":9261,\"benefBpText\":\"benefBpText-901\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-975\",\"destBankBic\":\"BNPAFRPP\",\"destBankBpText\":\"destBankBpText-247\",\"destBankClr\":\"destBankClr-445\",\"destBankText\":\"destBankText-268\",\"destBenefText\":\"destBenefText-946\",\"destInfo\":\"destInfo-273\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-390\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-107\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-219\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-529\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":714,\"orderedBy\":\"orderedBy-310\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [658] POST /doc-mmkts — Money Market API
run_request "[658] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":4817,\"bdeRecVersion\":4245,\"capt\":4790,\"dcdStrike\":7526,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-568\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-120\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-651\",\"intrRate\":3.218,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-731\",\"maturityDate\":\"2026-03-17\",\"mktRate\":7.561,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6356,\"orderedBy\":\"orderedBy-371\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1099,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.681,\"settlePlanA\":true,\"trdrRate\":1.46,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [659] GET /doc-mmkts/{id} — Money Market API
run_request "[659] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [660] PATCH /doc-mmkts/{id} — Money Market API
run_request "[660] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":7683,\"bdeRecVersion\":9929,\"capt\":3130,\"dcdStrike\":9020,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-286\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-149\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-355\",\"intrRate\":6.83,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-673\",\"maturityDate\":\"2026-03-17\",\"mktRate\":1.526,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7839,\"orderedBy\":\"orderedBy-775\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":3772,\"respBpA\":true,\"respObjA\":true,\"rmRate\":4.171,\"settlePlanA\":true,\"trdrRate\":4.935,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [661] POST /doc-xfermons — Money Transfer API
run_request "[661] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":3541,\"amount\":935544.36,\"bdeRecVersion\":1576,\"bulkItemIdent\":\"bulkItemIdent-747\",\"credAdvText\":\"credAdvText-356\",\"credBookText\":\"credBookText-237\",\"debAdvText\":\"debAdvText-497\",\"debBookText\":\"debBookText-660\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-786\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-543\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-839\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-202\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7738,\"orderedBy\":\"orderedBy-942\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [662] GET /doc-xfermons/{id} — Money Transfer API
run_request "[662] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [663] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[663] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":2394,\"amount\":291975.06,\"bdeRecVersion\":1087,\"bulkItemIdent\":\"bulkItemIdent-476\",\"credAdvText\":\"credAdvText-731\",\"credBookText\":\"credBookText-176\",\"debAdvText\":\"debAdvText-103\",\"debBookText\":\"debBookText-598\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-811\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-381\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-417\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-516\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9333,\"orderedBy\":\"orderedBy-482\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [664] POST /doc-oofxs — OTC FX Option API
run_request "[664] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":2611,\"advTextCred\":\"advTextCred-406\",\"advTextDeb\":\"advTextDeb-316\",\"bdeRecVersion\":8576,\"bookTextCred\":\"bookTextCred-349\",\"bookTextDeb\":\"bookTextDeb-111\",\"callQty\":2147,\"cutOffTime\":\"cutOffTime-818\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-373\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-974\",\"gross\":\"gross-577\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-402\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-350\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5570,\"orderedBy\":\"orderedBy-921\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-809\",\"putQty\":9685,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-835\",\"spread2\":\"spread2-450\",\"strike\":8446,\"strikePict\":7407,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [665] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[665] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [666] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[666] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":948,\"advTextCred\":\"advTextCred-907\",\"advTextDeb\":\"advTextDeb-232\",\"bdeRecVersion\":3719,\"bookTextCred\":\"bookTextCred-616\",\"bookTextDeb\":\"bookTextDeb-748\",\"callQty\":6356,\"cutOffTime\":\"cutOffTime-375\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-157\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-589\",\"gross\":\"gross-508\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-485\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-263\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7016,\"orderedBy\":\"orderedBy-427\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-153\",\"putQty\":274,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-997\",\"spread2\":\"spread2-411\",\"strike\":2069,\"strikePict\":234,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [667] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[667] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [668] GET /doc-otcopts/{id} — OTC Option API
run_request "[668] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [669] GET /doc-othsecs/{id} — Other Security API
run_request "[669] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [670] POST /doc-pays — Payment API
run_request "[670] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":7962,\"amount\":432374.76,\"bank\":\"bank-248\",\"bankAcc\":\"bankAcc-520\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-575\",\"bankCorr1\":\"bankCorr1-499\",\"bankCorr1Acc\":\"bankCorr1Acc-233\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-492\",\"bankCorr3\":\"bankCorr3-719\",\"bankCorr3Acc\":\"bankCorr3Acc-806\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-855\",\"bankCorr4\":\"bankCorr4-168\",\"bankCorr4Acc\":\"bankCorr4Acc-532\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-839\",\"bankInfo\":\"bankInfo-494\",\"bdeRecVersion\":8086,\"benef\":\"benef-789\",\"benefAcc\":\"benefAcc-582\",\"benefIban\":\"CH73783675715720861\",\"benefInfo\":\"benefInfo-736\",\"benefRefNr\":\"benefRefNr-710\",\"bookTextCred\":\"bookTextCred-679\",\"bookTextDeb\":\"bookTextDeb-519\",\"bulkItemIdent\":\"bulkItemIdent-402\",\"destCountry\":{\"id\":1,\"ident\":\"CH\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-852\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-831\",\"hasPostit\":true,\"instrAmount\":978763.86,\"intlRefNr\":\"intlRefNr-506\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH7503939356\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-282\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-245\",\"ordBankAcc\":\"ordBankAcc-222\",\"ordBankClearNr\":\"ordBankClearNr-456\",\"ordRef\":\"ordRef-959\",\"orderDate\":\"2026-03-17\",\"orderNr\":8034,\"orderedBy\":\"orderedBy-609\",\"orderedByAcc\":\"orderedByAcc-695\",\"origGrpRef\":\"origGrpRef-539\",\"originCountry\":{\"id\":2,\"ident\":\"DE\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-225\",\"stordPeriodEnd\":\"stordPeriodEnd-168\",\"stordPeriodStart\":\"stordPeriodStart-891\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49233670506\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [671] GET /doc-pays/{id} — Payment API
run_request "[671] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [672] PATCH /doc-pays/{id} — Payment API
run_request "[672] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":3053,\"amount\":672810.11,\"bank\":\"bank-990\",\"bankAcc\":\"bankAcc-389\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-991\",\"bankCorr1\":\"bankCorr1-797\",\"bankCorr1Acc\":\"bankCorr1Acc-897\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-141\",\"bankCorr3\":\"bankCorr3-953\",\"bankCorr3Acc\":\"bankCorr3Acc-286\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-976\",\"bankCorr4\":\"bankCorr4-786\",\"bankCorr4Acc\":\"bankCorr4Acc-502\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-815\",\"bankInfo\":\"bankInfo-196\",\"bdeRecVersion\":3050,\"benef\":\"benef-412\",\"benefAcc\":\"benefAcc-171\",\"benefIban\":\"DE85654383257458363\",\"benefInfo\":\"benefInfo-522\",\"benefRefNr\":\"benefRefNr-340\",\"bookTextCred\":\"bookTextCred-901\",\"bookTextDeb\":\"bookTextDeb-477\",\"bulkItemIdent\":\"bulkItemIdent-945\",\"destCountry\":{\"id\":4,\"ident\":\"FR\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-708\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-707\",\"hasPostit\":true,\"instrAmount\":24727.74,\"intlRefNr\":\"intlRefNr-885\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE8109557854\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-388\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-586\",\"ordBankAcc\":\"ordBankAcc-150\",\"ordBankClearNr\":\"ordBankClearNr-366\",\"ordRef\":\"ordRef-789\",\"orderDate\":\"2026-03-17\",\"orderNr\":8367,\"orderedBy\":\"orderedBy-342\",\"orderedByAcc\":\"orderedByAcc-576\",\"origGrpRef\":\"origGrpRef-646\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-546\",\"stordPeriodEnd\":\"stordPeriodEnd-338\",\"stordPeriodStart\":\"stordPeriodStart-261\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49897045276\"}"

# [673] GET /doc-realsecs/{id} — Real Security API
run_request "[673] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [674] POST /doc-realtys — Realty API
run_request "[674] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":6562,\"bdeRecVersion\":3757,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-420\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-694\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-696\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-746\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9219,\"orderedBy\":\"orderedBy-588\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [675] GET /doc-realtys/{id} — Realty API
run_request "[675] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [676] PATCH /doc-realtys/{id} — Realty API
run_request "[676] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":1088,\"bdeRecVersion\":1605,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-703\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-602\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-466\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-573\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":864,\"orderedBy\":\"orderedBy-523\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [677] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[677] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":1068,\"bdeRecVersion\":6628,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-500\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-202\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-164\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-859\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7622,\"orderedBy\":\"orderedBy-663\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [678] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[678] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [679] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[679] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":173,\"bdeRecVersion\":6627,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-632\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-789\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-754\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-990\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8556,\"orderedBy\":\"orderedBy-347\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [680] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[680] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [681] POST /doc-rebalss — Rebalancer Order API
run_request "[681] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":4064,\"bdeRecVersion\":4692,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-100\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-428\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-565\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-917\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5904,\"orderedBy\":\"orderedBy-720\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [682] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[682] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [683] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[683] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":6588,\"bdeRecVersion\":5952,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-120\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-827\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-659\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-130\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8868,\"orderedBy\":\"orderedBy-373\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [684] GET /doc-repocs/{id} — Repo Contract API
run_request "[684] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [685] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[685] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [686] POST /doc-ctact2s — Contact Management (V2) API
run_request "[686] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":1372,\"attch\":\"attch-844\",\"attchA\":true,\"bdeRecVersion\":907,\"campgnCltReaction\":\"campgnCltReaction-919\",\"campgnRespKey\":\"campgnRespKey-667\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-674\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-968\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-139\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-449\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-787\",\"linkDocListA\":true,\"loc\":\"loc-545\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2889,\"orderedBy\":\"orderedBy-728\",\"particListA\":true,\"questrSeqNr\":9148,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":1638,\"reactComment\":\"reactComment-818\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-810\",\"reactNrPartic\":3546,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-411\",\"subjA\":true,\"syncSeqNr\":3814,\"totExpndTimeM\":1818,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [687] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[687] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [688] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[688] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":9356,\"attch\":\"attch-327\",\"attchA\":true,\"bdeRecVersion\":665,\"campgnCltReaction\":\"campgnCltReaction-432\",\"campgnRespKey\":\"campgnRespKey-658\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-877\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-234\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-663\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-751\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-346\",\"linkDocListA\":true,\"loc\":\"loc-359\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":223,\"orderedBy\":\"orderedBy-648\",\"particListA\":true,\"questrSeqNr\":9320,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":9291,\"reactComment\":\"reactComment-603\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-608\",\"reactNrPartic\":7619,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-406\",\"subjA\":true,\"syncSeqNr\":217,\"totExpndTimeM\":3027,\"trxDate\":\"2026-03-17\"}"

# [689] GET /doc-cmgs/{id} — Cashier Management API
run_request "[689] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [690] GET /doc-cops/{id} — Cashier Operations API
run_request "[690] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [691] POST /doc-clts — Client Opening API
run_request "[691] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [692] GET /doc-clts/{id} — Client Opening API
run_request "[692] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [693] PATCH /doc-clts/{id} — Client Opening API
run_request "[693] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [694] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[694] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [695] GET /doc-cltms/{id} — Collateral Movement API
run_request "[695] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [696] GET /doc-cords/{id} — Collective Order API
run_request "[696] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [697] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[697] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [698] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[698] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [699] POST /doc-xioms — External Investment Order Manager API
run_request "[699] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":2088,\"bdeRecVersion\":9856,\"bpLevelRep\":true,\"descn\":\"descn-653\",\"extlRefNr\":\"extlRefNr-604\",\"extlRepLang\":\"extlRepLang-453\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-254\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-106\",\"linkGrp\":3729,\"orderDate\":\"2026-03-17\",\"orderNr\":4449,\"orderedBy\":\"orderedBy-676\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [700] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[700] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [701] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[701] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":6411,\"bdeRecVersion\":3469,\"bpLevelRep\":true,\"descn\":\"descn-866\",\"extlRefNr\":\"extlRefNr-334\",\"extlRepLang\":\"extlRepLang-265\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-559\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-806\",\"linkGrp\":8949,\"orderDate\":\"2026-03-17\",\"orderNr\":9198,\"orderedBy\":\"orderedBy-821\",\"sendRepToEbank\":true}"

# [702] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[702] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [703] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[703] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [704] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[704] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [705] POST /doc-fxsws — FX Swap API
run_request "[705] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-860\",\"bdeRecVersion\":2021,\"buyBookText1\":\"buyBookText1-530\",\"buyBookText2\":\"buyBookText2-508\",\"buyQty1\":1243,\"buyQty2\":5316,\"cfi\":\"cfi-426\",\"dealFwdRate1\":3.454,\"dealFwdRate2\":5.929,\"dealSpotRate1\":6.99,\"dealSpotRate2\":3.301,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH7096832024\",\"lastTrans\":\"lastTrans-662\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-624\",\"period1\":\"period1-536\",\"period2\":\"period2-733\",\"sellBookText1\":\"sellBookText1-200\",\"sellBookText2\":\"sellBookText2-806\",\"sellQty1\":7190,\"sellQty2\":1075,\"spotDate\":\"2026-03-17\",\"trdrRate1\":0.515,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [706] GET /doc-fxsws/{id} — FX Swap API
run_request "[706] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [707] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[707] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-797\",\"bdeRecVersion\":389,\"buyBookText1\":\"buyBookText1-186\",\"buyBookText2\":\"buyBookText2-592\",\"buyQty1\":9237,\"buyQty2\":192,\"cfi\":\"cfi-257\",\"dealFwdRate1\":0.492,\"dealFwdRate2\":0.265,\"dealSpotRate1\":0.837,\"dealSpotRate2\":3.194,\"foDomiCountry\":{\"id\":4,\"ident\":\"FR\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH5035957655\",\"lastTrans\":\"lastTrans-835\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-963\",\"period1\":\"period1-401\",\"period2\":\"period2-565\",\"sellBookText1\":\"sellBookText1-814\",\"sellBookText2\":\"sellBookText2-528\",\"sellQty1\":5931,\"sellQty2\":8908,\"spotDate\":\"2026-03-17\",\"trdrRate1\":7.861,\"trxDate\":\"2026-03-17\"}"

# [708] POST /doc-fxtrs — FXTR API
run_request "[708] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":824,\"advText\":\"advText-995\",\"bdeRecVersion\":9249,\"buyQty\":5422,\"dealFwdRate\":3.212,\"dealSpotRate\":7.076,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-501\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-187\",\"fwdSpread\":103,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-869\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-131\",\"limit\":7846,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":7146,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5650,\"orderedBy\":\"orderedBy-825\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-918\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":8280,\"settlePlanA\":true,\"spotSpread1\":3234,\"spotSpread2\":9140,\"trdrRate\":1.7,\"trigPrice\":1401,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+41195714640\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [709] GET /doc-fxtrs/{id} — FXTR API
run_request "[709] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [710] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[710] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":733,\"advText\":\"advText-484\",\"bdeRecVersion\":6920,\"buyQty\":7374,\"dealFwdRate\":6.005,\"dealSpotRate\":3.526,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-234\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-858\",\"fwdSpread\":5117,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-318\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-791\",\"limit\":1861,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4840,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2761,\"orderedBy\":\"orderedBy-629\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-517\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3499,\"settlePlanA\":true,\"spotSpread1\":9218,\"spotSpread2\":1729,\"trdrRate\":8.193,\"trigPrice\":577,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39570585436\"}"

# [711] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[711] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [712] POST /doc-inpays — Incoming Payment API
run_request "[712] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":7455,\"amount\":616450.52,\"bankClearNr\":\"bankClearNr-309\",\"bankInfo\":\"bankInfo-971\",\"bdeRecVersion\":990,\"benefAcc\":\"benefAcc-444\",\"benefRefNr\":\"benefRefNr-440\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-810\",\"contrPeriodStart\":\"contrPeriodStart-176\",\"credAddr\":\"credAddr-144\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-450\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-165\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-688\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-966\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-124\",\"orderDate\":\"2026-03-17\",\"orderNr\":4945,\"orderedBy\":\"orderedBy-231\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payerAcc\":\"payerAcc-830\",\"payerAddrTxt\":\"payerAddrTxt-443\",\"payerIban\":\"CH65183558932638500\",\"payerInfo\":\"payerInfo-210\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-543\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [713] GET /doc-inpays/{id} — Incoming Payment API
run_request "[713] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [714] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[714] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":7541,\"amount\":829609.36,\"bankClearNr\":\"bankClearNr-753\",\"bankInfo\":\"bankInfo-565\",\"bdeRecVersion\":6744,\"benefAcc\":\"benefAcc-676\",\"benefRefNr\":\"benefRefNr-890\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-255\",\"contrPeriodStart\":\"contrPeriodStart-394\",\"credAddr\":\"credAddr-402\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-244\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-886\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-982\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-774\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-895\",\"orderDate\":\"2026-03-17\",\"orderNr\":7471,\"orderedBy\":\"orderedBy-559\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payerAcc\":\"payerAcc-753\",\"payerAddrTxt\":\"payerAddrTxt-258\",\"payerIban\":\"IT10588191516856606\",\"payerInfo\":\"payerInfo-505\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-528\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [715] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[715] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [716] GET /doc-intrs/{id} — Interest API
run_request "[716] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [717] POST /doc-invst-bdls — Investment Bundler API
run_request "[717] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":5277,\"bdeRecVersion\":9245,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-158\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-783\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-945\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-179\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":786,\"orderedBy\":\"orderedBy-707\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":5993,\"remnBaccBalMin\":7727,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [718] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[718] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [719] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[719] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":9749,\"bdeRecVersion\":3900,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-564\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-948\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-946\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-129\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9555,\"orderedBy\":\"orderedBy-471\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":3378,\"remnBaccBalMin\":2128,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [720] POST /doc-crm-issues — Issue Management API
run_request "[720] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-277\",\"advNr\":7708,\"allDayEvt\":true,\"attch\":\"attch-781\",\"bdeRecVersion\":3511,\"campgnTaskSeqNr\":1100,\"descn\":\"descn-268\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-118\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-180\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-446\",\"findingKey\":\"findingKey-491\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-435\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-237\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-714\",\"location\":\"location-694\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6797,\"orderedBy\":\"orderedBy-315\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2252,\"qtyLinked\":7621,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-594\",\"subject\":\"subject-690\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-562\",\"undefBp\":\"undefBp-738\",\"val\":8483,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [721] GET /doc-crm-issues/{id} — Issue Management API
run_request "[721] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [722] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[722] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-210\",\"advNr\":8685,\"allDayEvt\":true,\"attch\":\"attch-961\",\"bdeRecVersion\":9999,\"campgnTaskSeqNr\":8598,\"descn\":\"descn-820\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-384\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-332\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-113\",\"findingKey\":\"findingKey-877\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-789\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-681\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-619\",\"location\":\"location-458\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5214,\"orderedBy\":\"orderedBy-904\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1048,\"qtyLinked\":5952,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-403\",\"subject\":\"subject-330\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-635\",\"undefBp\":\"undefBp-262\",\"val\":9063,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [723] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[723] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [724] GET /doc-letters/{id} — Letter API
run_request "[724] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [725] POST /doc-limits — Limit API
run_request "[725] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":1981,\"advTextCred\":\"advTextCred-898\",\"advTextDeb\":\"advTextDeb-860\",\"amount\":11805.68,\"bdeRecVersion\":5355,\"bookTextCred\":\"bookTextCred-295\",\"bookTextDeb\":\"bookTextDeb-699\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-817\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-171\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-521\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-637\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-242\",\"nextReview\":\"nextReview-202\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5360,\"orderedBy\":\"orderedBy-757\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [726] GET /doc-limits/{id} — Limit API
run_request "[726] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [727] PATCH /doc-limits/{id} — Limit API
run_request "[727] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":8287,\"advTextCred\":\"advTextCred-183\",\"advTextDeb\":\"advTextDeb-619\",\"amount\":43386.13,\"bdeRecVersion\":7866,\"bookTextCred\":\"bookTextCred-150\",\"bookTextDeb\":\"bookTextDeb-983\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-243\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-618\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-634\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-332\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-843\",\"nextReview\":\"nextReview-360\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":4424,\"orderedBy\":\"orderedBy-465\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [728] POST /doc-loans — Loan API
run_request "[728] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":2274,\"advTextCred\":\"advTextCred-579\",\"advTextDeb\":\"advTextDeb-222\",\"bdeRecVersion\":3015,\"bookTextCred\":\"bookTextCred-840\",\"bookTextDeb\":\"bookTextDeb-268\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-751\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-908\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-352\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-116\",\"intrGradManMarkup\":7538,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-941\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":4535,\"orderedBy\":\"orderedBy-695\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6651,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [729] GET /doc-loans/{id} — Loan API
run_request "[729] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [730] PATCH /doc-loans/{id} — Loan API
run_request "[730] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":5312,\"advTextCred\":\"advTextCred-276\",\"advTextDeb\":\"advTextDeb-338\",\"bdeRecVersion\":4768,\"bookTextCred\":\"bookTextCred-315\",\"bookTextDeb\":\"bookTextDeb-175\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-519\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-458\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-811\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-175\",\"intrGradManMarkup\":5001,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-802\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3605,\"orderedBy\":\"orderedBy-235\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1288,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [731] POST /doc-mass-settles — Mass Settlement API
run_request "[731] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":9504,\"autoFillList\":true,\"bdeRecVersion\":5968,\"benefBpText\":\"benefBpText-944\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-198\",\"destBankBic\":\"CRESCHZZ80A\",\"destBankBpText\":\"destBankBpText-681\",\"destBankClr\":\"destBankClr-972\",\"destBankText\":\"destBankText-151\",\"destBenefText\":\"destBenefText-157\",\"destInfo\":\"destInfo-238\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-551\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-434\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-617\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-550\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1156,\"orderedBy\":\"orderedBy-508\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [732] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[732] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [733] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[733] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":8625,\"autoFillList\":true,\"bdeRecVersion\":8863,\"benefBpText\":\"benefBpText-693\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-590\",\"destBankBic\":\"UBSWCHZH80A\",\"destBankBpText\":\"destBankBpText-301\",\"destBankClr\":\"destBankClr-128\",\"destBankText\":\"destBankText-684\",\"destBenefText\":\"destBenefText-854\",\"destInfo\":\"destInfo-207\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-358\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-900\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-961\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-593\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4258,\"orderedBy\":\"orderedBy-477\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [734] POST /doc-mmkts — Money Market API
run_request "[734] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":4786,\"bdeRecVersion\":4277,\"capt\":151,\"dcdStrike\":9651,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-710\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-776\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-404\",\"intrRate\":0.899,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-624\",\"maturityDate\":\"2026-03-17\",\"mktRate\":3.267,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8402,\"orderedBy\":\"orderedBy-971\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4558,\"respBpA\":true,\"respObjA\":true,\"rmRate\":0.875,\"settlePlanA\":true,\"trdrRate\":3.666,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [735] GET /doc-mmkts/{id} — Money Market API
run_request "[735] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [736] PATCH /doc-mmkts/{id} — Money Market API
run_request "[736] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":1238,\"bdeRecVersion\":5313,\"capt\":7676,\"dcdStrike\":3822,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-708\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-784\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-394\",\"intrRate\":5.98,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-546\",\"maturityDate\":\"2026-03-17\",\"mktRate\":5.164,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":78,\"orderedBy\":\"orderedBy-233\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":3658,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.425,\"settlePlanA\":true,\"trdrRate\":4.486,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [737] POST /doc-xfermons — Money Transfer API
run_request "[737] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":8987,\"amount\":195327.85,\"bdeRecVersion\":9016,\"bulkItemIdent\":\"bulkItemIdent-104\",\"credAdvText\":\"credAdvText-838\",\"credBookText\":\"credBookText-104\",\"debAdvText\":\"debAdvText-567\",\"debBookText\":\"debBookText-436\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-508\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-419\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-107\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-718\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9215,\"orderedBy\":\"orderedBy-985\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [738] GET /doc-xfermons/{id} — Money Transfer API
run_request "[738] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [739] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[739] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":6425,\"amount\":153025.45,\"bdeRecVersion\":9610,\"bulkItemIdent\":\"bulkItemIdent-398\",\"credAdvText\":\"credAdvText-885\",\"credBookText\":\"credBookText-211\",\"debAdvText\":\"debAdvText-688\",\"debBookText\":\"debBookText-819\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-454\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-527\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-640\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-487\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8787,\"orderedBy\":\"orderedBy-781\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [740] POST /doc-oofxs — OTC FX Option API
run_request "[740] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":6488,\"advTextCred\":\"advTextCred-808\",\"advTextDeb\":\"advTextDeb-798\",\"bdeRecVersion\":5847,\"bookTextCred\":\"bookTextCred-537\",\"bookTextDeb\":\"bookTextDeb-977\",\"callQty\":7887,\"cutOffTime\":\"cutOffTime-876\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-625\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-797\",\"gross\":\"gross-551\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-111\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-258\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5403,\"orderedBy\":\"orderedBy-157\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-416\",\"putQty\":2879,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-924\",\"spread2\":\"spread2-623\",\"strike\":2963,\"strikePict\":1390,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [741] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[741] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [742] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[742] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":8290,\"advTextCred\":\"advTextCred-422\",\"advTextDeb\":\"advTextDeb-988\",\"bdeRecVersion\":410,\"bookTextCred\":\"bookTextCred-613\",\"bookTextDeb\":\"bookTextDeb-927\",\"callQty\":7682,\"cutOffTime\":\"cutOffTime-794\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-176\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-306\",\"gross\":\"gross-358\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-510\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-590\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3861,\"orderedBy\":\"orderedBy-499\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-619\",\"putQty\":8886,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-491\",\"spread2\":\"spread2-888\",\"strike\":6300,\"strikePict\":8645,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [743] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[743] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [744] GET /doc-otcopts/{id} — OTC Option API
run_request "[744] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [745] GET /doc-othsecs/{id} — Other Security API
run_request "[745] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [746] POST /doc-pays — Payment API
run_request "[746] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":6347,\"amount\":197389.14,\"bank\":\"bank-323\",\"bankAcc\":\"bankAcc-974\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-274\",\"bankCorr1\":\"bankCorr1-859\",\"bankCorr1Acc\":\"bankCorr1Acc-825\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-187\",\"bankCorr3\":\"bankCorr3-875\",\"bankCorr3Acc\":\"bankCorr3Acc-227\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-971\",\"bankCorr4\":\"bankCorr4-361\",\"bankCorr4Acc\":\"bankCorr4Acc-230\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-747\",\"bankInfo\":\"bankInfo-331\",\"bdeRecVersion\":340,\"benef\":\"benef-515\",\"benefAcc\":\"benefAcc-777\",\"benefIban\":\"DE51800522112344425\",\"benefInfo\":\"benefInfo-753\",\"benefRefNr\":\"benefRefNr-597\",\"bookTextCred\":\"bookTextCred-756\",\"bookTextDeb\":\"bookTextDeb-784\",\"bulkItemIdent\":\"bulkItemIdent-613\",\"destCountry\":{\"id\":3,\"ident\":\"IT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-197\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-586\",\"hasPostit\":true,\"instrAmount\":362535.44,\"intlRefNr\":\"intlRefNr-582\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"US4714013575\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-308\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-420\",\"ordBankAcc\":\"ordBankAcc-585\",\"ordBankClearNr\":\"ordBankClearNr-480\",\"ordRef\":\"ordRef-430\",\"orderDate\":\"2026-03-17\",\"orderNr\":8068,\"orderedBy\":\"orderedBy-434\",\"orderedByAcc\":\"orderedByAcc-569\",\"origGrpRef\":\"origGrpRef-208\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-323\",\"stordPeriodEnd\":\"stordPeriodEnd-275\",\"stordPeriodStart\":\"stordPeriodStart-612\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49704021716\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [747] GET /doc-pays/{id} — Payment API
run_request "[747] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [748] PATCH /doc-pays/{id} — Payment API
run_request "[748] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":9670,\"amount\":676197.72,\"bank\":\"bank-521\",\"bankAcc\":\"bankAcc-413\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-500\",\"bankCorr1\":\"bankCorr1-942\",\"bankCorr1Acc\":\"bankCorr1Acc-943\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-428\",\"bankCorr3\":\"bankCorr3-118\",\"bankCorr3Acc\":\"bankCorr3Acc-614\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-742\",\"bankCorr4\":\"bankCorr4-943\",\"bankCorr4Acc\":\"bankCorr4Acc-125\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-313\",\"bankInfo\":\"bankInfo-124\",\"bdeRecVersion\":9903,\"benef\":\"benef-299\",\"benefAcc\":\"benefAcc-664\",\"benefIban\":\"DE75562129298441721\",\"benefInfo\":\"benefInfo-158\",\"benefRefNr\":\"benefRefNr-406\",\"bookTextCred\":\"bookTextCred-768\",\"bookTextDeb\":\"bookTextDeb-966\",\"bulkItemIdent\":\"bulkItemIdent-486\",\"destCountry\":{\"id\":5,\"ident\":\"AT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-790\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-448\",\"hasPostit\":true,\"instrAmount\":781492.7,\"intlRefNr\":\"intlRefNr-168\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE2361451289\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-626\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-161\",\"ordBankAcc\":\"ordBankAcc-555\",\"ordBankClearNr\":\"ordBankClearNr-952\",\"ordRef\":\"ordRef-548\",\"orderDate\":\"2026-03-17\",\"orderNr\":4099,\"orderedBy\":\"orderedBy-734\",\"orderedByAcc\":\"orderedByAcc-577\",\"origGrpRef\":\"origGrpRef-585\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-347\",\"stordPeriodEnd\":\"stordPeriodEnd-798\",\"stordPeriodStart\":\"stordPeriodStart-647\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39815602440\"}"

# [749] GET /doc-realsecs/{id} — Real Security API
run_request "[749] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [750] POST /doc-realtys — Realty API
run_request "[750] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":6517,\"bdeRecVersion\":1030,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-844\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-897\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-997\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-752\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1125,\"orderedBy\":\"orderedBy-347\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [751] GET /doc-realtys/{id} — Realty API
run_request "[751] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [752] PATCH /doc-realtys/{id} — Realty API
run_request "[752] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":2609,\"bdeRecVersion\":2752,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-326\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-226\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-758\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-904\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9775,\"orderedBy\":\"orderedBy-882\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [753] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[753] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":8312,\"bdeRecVersion\":9364,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-871\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-801\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-593\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-472\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2324,\"orderedBy\":\"orderedBy-756\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [754] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[754] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [755] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[755] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":9066,\"bdeRecVersion\":9749,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-858\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-831\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-847\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-594\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2704,\"orderedBy\":\"orderedBy-261\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [756] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[756] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [757] POST /doc-rebalss — Rebalancer Order API
run_request "[757] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":6161,\"bdeRecVersion\":9232,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-995\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-941\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-467\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-444\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3845,\"orderedBy\":\"orderedBy-285\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [758] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[758] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [759] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[759] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":9180,\"bdeRecVersion\":8510,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-810\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-550\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-200\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-889\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8145,\"orderedBy\":\"orderedBy-290\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [760] GET /doc-repocs/{id} — Repo Contract API
run_request "[760] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>Capi Test Report · Part 8</title>
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
<h1>🧪 Capi Test Report <span style='color:#8b949e;font-size:14px'>Part 8 / 8</span></h1>
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