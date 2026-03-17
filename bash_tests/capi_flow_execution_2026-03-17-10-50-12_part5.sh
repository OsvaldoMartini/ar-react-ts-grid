#!/usr/bin/env bash
# =============================================================
# Capi Test Runner — FLOW Execution (Part 5/8)
# Generated: 2026-03-17T10:50:15.513Z
# Cases:     269–316 of 1596
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-17-10-50-12_part5_report.html"
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
ID_DOC_INVST_BDLS=""
ID_DOC_CRM_ISSUES=""
ID_DOC_LEDGERS=""
ID_DOC_LETTERS=""

# ── INIT HTML REPORT ─────────────────────────────────────────
echo "Starting 200 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [269] POST /doc-limits — Limit API
run_request "[269] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":830,\"advTextCred\":\"advTextCred-461\",\"advTextDeb\":\"advTextDeb-495\",\"amount\":570182.51,\"bdeRecVersion\":2305,\"bookTextCred\":\"bookTextCred-737\",\"bookTextDeb\":\"bookTextDeb-366\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-284\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-437\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-662\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-238\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-908\",\"nextReview\":\"nextReview-258\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":901,\"orderedBy\":\"orderedBy-292\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [270] GET /doc-limits/{id} — Limit API
run_request "[270] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [271] PATCH /doc-limits/{id} — Limit API
run_request "[271] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":3610,\"advTextCred\":\"advTextCred-173\",\"advTextDeb\":\"advTextDeb-504\",\"amount\":362434.82,\"bdeRecVersion\":6820,\"bookTextCred\":\"bookTextCred-241\",\"bookTextDeb\":\"bookTextDeb-992\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-717\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-901\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-967\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-210\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-153\",\"nextReview\":\"nextReview-923\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9867,\"orderedBy\":\"orderedBy-796\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [272] POST /doc-loans — Loan API
run_request "[272] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":7378,\"advTextCred\":\"advTextCred-524\",\"advTextDeb\":\"advTextDeb-419\",\"bdeRecVersion\":2265,\"bookTextCred\":\"bookTextCred-233\",\"bookTextDeb\":\"bookTextDeb-626\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-101\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-551\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-172\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-628\",\"intrGradManMarkup\":5073,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-130\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6976,\"orderedBy\":\"orderedBy-625\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1445,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [273] GET /doc-loans/{id} — Loan API
run_request "[273] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [274] PATCH /doc-loans/{id} — Loan API
run_request "[274] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":8676,\"advTextCred\":\"advTextCred-297\",\"advTextDeb\":\"advTextDeb-947\",\"bdeRecVersion\":6073,\"bookTextCred\":\"bookTextCred-564\",\"bookTextDeb\":\"bookTextDeb-150\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-789\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-362\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-662\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-281\",\"intrGradManMarkup\":2915,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-866\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6361,\"orderedBy\":\"orderedBy-691\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9619,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [275] POST /doc-mass-settles — Mass Settlement API
run_request "[275] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":7613,\"autoFillList\":true,\"bdeRecVersion\":443,\"benefBpText\":\"benefBpText-575\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-237\",\"destBankBic\":\"UBSWCHZH80A\",\"destBankBpText\":\"destBankBpText-150\",\"destBankClr\":\"destBankClr-196\",\"destBankText\":\"destBankText-418\",\"destBenefText\":\"destBenefText-328\",\"destInfo\":\"destInfo-122\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-362\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-798\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-886\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-829\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8443,\"orderedBy\":\"orderedBy-989\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [276] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[276] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [277] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[277] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":2775,\"autoFillList\":true,\"bdeRecVersion\":9104,\"benefBpText\":\"benefBpText-723\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-480\",\"destBankBic\":\"CRESCHZZ80A\",\"destBankBpText\":\"destBankBpText-937\",\"destBankClr\":\"destBankClr-577\",\"destBankText\":\"destBankText-100\",\"destBenefText\":\"destBenefText-654\",\"destInfo\":\"destInfo-584\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-278\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-754\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-690\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-418\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3170,\"orderedBy\":\"orderedBy-432\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [278] POST /doc-mmkts — Money Market API
run_request "[278] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":2887,\"bdeRecVersion\":2712,\"capt\":3618,\"dcdStrike\":4476,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-911\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-600\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-557\",\"intrRate\":2.105,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-905\",\"maturityDate\":\"2026-03-17\",\"mktRate\":2.026,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3913,\"orderedBy\":\"orderedBy-677\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":3133,\"respBpA\":true,\"respObjA\":true,\"rmRate\":0.147,\"settlePlanA\":true,\"trdrRate\":4.528,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [279] GET /doc-mmkts/{id} — Money Market API
run_request "[279] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [280] PATCH /doc-mmkts/{id} — Money Market API
run_request "[280] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":5852,\"bdeRecVersion\":6597,\"capt\":2485,\"dcdStrike\":7792,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-818\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-521\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-540\",\"intrRate\":5.384,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-543\",\"maturityDate\":\"2026-03-17\",\"mktRate\":6.786,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3958,\"orderedBy\":\"orderedBy-153\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1626,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.258,\"settlePlanA\":true,\"trdrRate\":5.721,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [281] POST /doc-xfermons — Money Transfer API
run_request "[281] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":8406,\"amount\":753861.81,\"bdeRecVersion\":6682,\"bulkItemIdent\":\"bulkItemIdent-536\",\"credAdvText\":\"credAdvText-931\",\"credBookText\":\"credBookText-458\",\"debAdvText\":\"debAdvText-354\",\"debBookText\":\"debBookText-470\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-219\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-795\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-868\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-745\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":590,\"orderedBy\":\"orderedBy-946\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [282] GET /doc-xfermons/{id} — Money Transfer API
run_request "[282] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [283] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[283] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":9027,\"amount\":74825.14,\"bdeRecVersion\":3636,\"bulkItemIdent\":\"bulkItemIdent-377\",\"credAdvText\":\"credAdvText-800\",\"credBookText\":\"credBookText-199\",\"debAdvText\":\"debAdvText-913\",\"debBookText\":\"debBookText-926\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-410\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-148\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-876\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-385\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1426,\"orderedBy\":\"orderedBy-517\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [284] POST /doc-oofxs — OTC FX Option API
run_request "[284] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":1798,\"advTextCred\":\"advTextCred-207\",\"advTextDeb\":\"advTextDeb-302\",\"bdeRecVersion\":9716,\"bookTextCred\":\"bookTextCred-521\",\"bookTextDeb\":\"bookTextDeb-557\",\"callQty\":2701,\"cutOffTime\":\"cutOffTime-266\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-119\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-801\",\"gross\":\"gross-777\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-574\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-447\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4189,\"orderedBy\":\"orderedBy-612\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-916\",\"putQty\":822,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-100\",\"spread2\":\"spread2-584\",\"strike\":1664,\"strikePict\":3423,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [285] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[285] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [286] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[286] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":349,\"advTextCred\":\"advTextCred-941\",\"advTextDeb\":\"advTextDeb-390\",\"bdeRecVersion\":1763,\"bookTextCred\":\"bookTextCred-793\",\"bookTextDeb\":\"bookTextDeb-857\",\"callQty\":1833,\"cutOffTime\":\"cutOffTime-835\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-162\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-884\",\"gross\":\"gross-743\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-397\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-449\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7589,\"orderedBy\":\"orderedBy-651\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-488\",\"putQty\":6692,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-884\",\"spread2\":\"spread2-789\",\"strike\":61,\"strikePict\":2750,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [287] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[287] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [288] GET /doc-otcopts/{id} — OTC Option API
run_request "[288] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [289] GET /doc-othsecs/{id} — Other Security API
run_request "[289] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [290] POST /doc-pays — Payment API
run_request "[290] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":3452,\"amount\":483068.82,\"bank\":\"bank-760\",\"bankAcc\":\"bankAcc-190\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-658\",\"bankCorr1\":\"bankCorr1-459\",\"bankCorr1Acc\":\"bankCorr1Acc-115\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-865\",\"bankCorr3\":\"bankCorr3-746\",\"bankCorr3Acc\":\"bankCorr3Acc-802\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-332\",\"bankCorr4\":\"bankCorr4-677\",\"bankCorr4Acc\":\"bankCorr4Acc-766\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-302\",\"bankInfo\":\"bankInfo-385\",\"bdeRecVersion\":4996,\"benef\":\"benef-554\",\"benefAcc\":\"benefAcc-427\",\"benefIban\":\"CH83980724583834517\",\"benefInfo\":\"benefInfo-896\",\"benefRefNr\":\"benefRefNr-335\",\"bookTextCred\":\"bookTextCred-130\",\"bookTextDeb\":\"bookTextDeb-858\",\"bulkItemIdent\":\"bulkItemIdent-436\",\"destCountry\":{\"id\":6,\"ident\":\"GB\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-191\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-822\",\"hasPostit\":true,\"instrAmount\":238487.93,\"intlRefNr\":\"intlRefNr-816\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"GB3643237925\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-638\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-773\",\"ordBankAcc\":\"ordBankAcc-789\",\"ordBankClearNr\":\"ordBankClearNr-307\",\"ordRef\":\"ordRef-668\",\"orderDate\":\"2026-03-17\",\"orderNr\":6053,\"orderedBy\":\"orderedBy-703\",\"orderedByAcc\":\"orderedByAcc-651\",\"origGrpRef\":\"origGrpRef-713\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-914\",\"stordPeriodEnd\":\"stordPeriodEnd-355\",\"stordPeriodStart\":\"stordPeriodStart-954\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49769805202\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [291] GET /doc-pays/{id} — Payment API
run_request "[291] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [292] PATCH /doc-pays/{id} — Payment API
run_request "[292] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":472,\"amount\":384475.78,\"bank\":\"bank-909\",\"bankAcc\":\"bankAcc-823\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-803\",\"bankCorr1\":\"bankCorr1-937\",\"bankCorr1Acc\":\"bankCorr1Acc-400\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-573\",\"bankCorr3\":\"bankCorr3-650\",\"bankCorr3Acc\":\"bankCorr3Acc-847\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-308\",\"bankCorr4\":\"bankCorr4-827\",\"bankCorr4Acc\":\"bankCorr4Acc-323\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-555\",\"bankInfo\":\"bankInfo-143\",\"bdeRecVersion\":2879,\"benef\":\"benef-381\",\"benefAcc\":\"benefAcc-567\",\"benefIban\":\"DE63195520603360566\",\"benefInfo\":\"benefInfo-608\",\"benefRefNr\":\"benefRefNr-755\",\"bookTextCred\":\"bookTextCred-620\",\"bookTextDeb\":\"bookTextDeb-687\",\"bulkItemIdent\":\"bulkItemIdent-269\",\"destCountry\":{\"id\":4,\"ident\":\"FR\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-360\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-329\",\"hasPostit\":true,\"instrAmount\":305257.61,\"intlRefNr\":\"intlRefNr-994\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH2907203940\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-468\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-897\",\"ordBankAcc\":\"ordBankAcc-344\",\"ordBankClearNr\":\"ordBankClearNr-461\",\"ordRef\":\"ordRef-745\",\"orderDate\":\"2026-03-17\",\"orderNr\":4949,\"orderedBy\":\"orderedBy-479\",\"orderedByAcc\":\"orderedByAcc-822\",\"origGrpRef\":\"origGrpRef-983\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-707\",\"stordPeriodEnd\":\"stordPeriodEnd-843\",\"stordPeriodStart\":\"stordPeriodStart-529\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41259601901\"}"

# [293] GET /doc-realsecs/{id} — Real Security API
run_request "[293] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [294] POST /doc-realtys — Realty API
run_request "[294] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":5043,\"bdeRecVersion\":7834,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-793\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-819\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-296\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-206\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6679,\"orderedBy\":\"orderedBy-181\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [295] GET /doc-realtys/{id} — Realty API
run_request "[295] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [296] PATCH /doc-realtys/{id} — Realty API
run_request "[296] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":3889,\"bdeRecVersion\":9798,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-953\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-454\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-976\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-851\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8867,\"orderedBy\":\"orderedBy-281\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [297] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[297] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":3998,\"bdeRecVersion\":2328,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-993\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-423\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-843\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-183\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5894,\"orderedBy\":\"orderedBy-174\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [298] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[298] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [299] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[299] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":3450,\"bdeRecVersion\":308,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-194\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-854\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-465\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-132\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6441,\"orderedBy\":\"orderedBy-503\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [300] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[300] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [301] POST /doc-rebalss — Rebalancer Order API
run_request "[301] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":252,\"bdeRecVersion\":147,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-327\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-825\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-770\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-806\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6874,\"orderedBy\":\"orderedBy-171\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [302] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[302] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [303] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[303] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":6389,\"bdeRecVersion\":1181,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-198\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-901\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-235\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-675\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":583,\"orderedBy\":\"orderedBy-738\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [304] GET /doc-repocs/{id} — Repo Contract API
run_request "[304] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [989] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[989] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [990] POST /doc-ctact2s — Contact Management (V2) API
run_request "[990] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":2108,\"attch\":\"attch-116\",\"attchA\":true,\"bdeRecVersion\":5892,\"campgnCltReaction\":\"campgnCltReaction-717\",\"campgnRespKey\":\"campgnRespKey-420\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-114\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-190\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-969\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-762\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-265\",\"linkDocListA\":true,\"loc\":\"loc-736\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6062,\"orderedBy\":\"orderedBy-239\",\"particListA\":true,\"questrSeqNr\":8343,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":6149,\"reactComment\":\"reactComment-321\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-243\",\"reactNrPartic\":2298,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-581\",\"subjA\":true,\"syncSeqNr\":4253,\"totExpndTimeM\":8462,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [991] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[991] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [992] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[992] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":6657,\"attch\":\"attch-403\",\"attchA\":true,\"bdeRecVersion\":9728,\"campgnCltReaction\":\"campgnCltReaction-704\",\"campgnRespKey\":\"campgnRespKey-214\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-923\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-688\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-779\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-441\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-150\",\"linkDocListA\":true,\"loc\":\"loc-683\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2779,\"orderedBy\":\"orderedBy-656\",\"particListA\":true,\"questrSeqNr\":7038,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":9414,\"reactComment\":\"reactComment-493\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-832\",\"reactNrPartic\":6193,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-727\",\"subjA\":true,\"syncSeqNr\":1893,\"totExpndTimeM\":5855,\"trxDate\":\"2026-03-17\"}"

# [993] GET /doc-cmgs/{id} — Cashier Management API
run_request "[993] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [994] GET /doc-cops/{id} — Cashier Operations API
run_request "[994] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [995] POST /doc-clts — Client Opening API
run_request "[995] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [996] GET /doc-clts/{id} — Client Opening API
run_request "[996] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [997] PATCH /doc-clts/{id} — Client Opening API
run_request "[997] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [998] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[998] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [999] GET /doc-cltms/{id} — Collateral Movement API
run_request "[999] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [1000] GET /doc-cords/{id} — Collective Order API
run_request "[1000] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [1001] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[1001] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [1002] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[1002] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [1003] POST /doc-xioms — External Investment Order Manager API
run_request "[1003] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":2867,\"bdeRecVersion\":8338,\"bpLevelRep\":true,\"descn\":\"descn-100\",\"extlRefNr\":\"extlRefNr-643\",\"extlRepLang\":\"extlRepLang-646\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-354\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-510\",\"linkGrp\":6009,\"orderDate\":\"2026-03-17\",\"orderNr\":6354,\"orderedBy\":\"orderedBy-631\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1004] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[1004] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [1005] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[1005] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":5053,\"bdeRecVersion\":2837,\"bpLevelRep\":true,\"descn\":\"descn-776\",\"extlRefNr\":\"extlRefNr-816\",\"extlRepLang\":\"extlRepLang-440\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-912\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-370\",\"linkGrp\":8975,\"orderDate\":\"2026-03-17\",\"orderNr\":6097,\"orderedBy\":\"orderedBy-417\",\"sendRepToEbank\":true}"

# [1006] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[1006] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [1007] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[1007] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [1008] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[1008] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [1009] POST /doc-fxsws — FX Swap API
run_request "[1009] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-102\",\"bdeRecVersion\":9013,\"buyBookText1\":\"buyBookText1-932\",\"buyBookText2\":\"buyBookText2-901\",\"buyQty1\":5627,\"buyQty2\":2123,\"cfi\":\"cfi-284\",\"dealFwdRate1\":7.874,\"dealFwdRate2\":8.44,\"dealSpotRate1\":1.386,\"dealSpotRate2\":7.151,\"foDomiCountry\":{\"id\":6,\"ident\":\"GB\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB4145452649\",\"lastTrans\":\"lastTrans-520\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-701\",\"period1\":\"period1-380\",\"period2\":\"period2-767\",\"sellBookText1\":\"sellBookText1-976\",\"sellBookText2\":\"sellBookText2-171\",\"sellQty1\":9676,\"sellQty2\":3412,\"spotDate\":\"2026-03-17\",\"trdrRate1\":7.778,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1010] GET /doc-fxsws/{id} — FX Swap API
run_request "[1010] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [1011] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[1011] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-615\",\"bdeRecVersion\":5353,\"buyBookText1\":\"buyBookText1-183\",\"buyBookText2\":\"buyBookText2-624\",\"buyQty1\":7979,\"buyQty2\":3117,\"cfi\":\"cfi-687\",\"dealFwdRate1\":7.449,\"dealFwdRate2\":0.606,\"dealSpotRate1\":5.06,\"dealSpotRate2\":3.862,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH3289388885\",\"lastTrans\":\"lastTrans-496\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-886\",\"period1\":\"period1-827\",\"period2\":\"period2-922\",\"sellBookText1\":\"sellBookText1-416\",\"sellBookText2\":\"sellBookText2-535\",\"sellQty1\":8140,\"sellQty2\":6347,\"spotDate\":\"2026-03-17\",\"trdrRate1\":1.337,\"trxDate\":\"2026-03-17\"}"

# [1012] POST /doc-fxtrs — FXTR API
run_request "[1012] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5895,\"advText\":\"advText-512\",\"bdeRecVersion\":4325,\"buyQty\":1098,\"dealFwdRate\":1.328,\"dealSpotRate\":5.687,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-101\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-435\",\"fwdSpread\":3315,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-624\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-788\",\"limit\":3721,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":5611,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9197,\"orderedBy\":\"orderedBy-669\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-627\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4452,\"settlePlanA\":true,\"spotSpread1\":4281,\"spotSpread2\":3493,\"trdrRate\":0.77,\"trigPrice\":185,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39484878470\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1013] GET /doc-fxtrs/{id} — FXTR API
run_request "[1013] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [1014] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[1014] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":8780,\"advText\":\"advText-576\",\"bdeRecVersion\":1186,\"buyQty\":4806,\"dealFwdRate\":0.13,\"dealSpotRate\":3.255,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-901\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-808\",\"fwdSpread\":2333,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-586\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-919\",\"limit\":5927,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":9227,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4048,\"orderedBy\":\"orderedBy-514\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-511\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4008,\"settlePlanA\":true,\"spotSpread1\":6564,\"spotSpread2\":2291,\"trdrRate\":5.878,\"trigPrice\":3869,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+33257169519\"}"

# [1015] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[1015] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [1016] POST /doc-inpays — Incoming Payment API
run_request "[1016] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":1717,\"amount\":393678.99,\"bankClearNr\":\"bankClearNr-683\",\"bankInfo\":\"bankInfo-653\",\"bdeRecVersion\":1658,\"benefAcc\":\"benefAcc-708\",\"benefRefNr\":\"benefRefNr-309\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-777\",\"contrPeriodStart\":\"contrPeriodStart-475\",\"credAddr\":\"credAddr-251\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-516\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-976\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-632\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-142\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-795\",\"orderDate\":\"2026-03-17\",\"orderNr\":2393,\"orderedBy\":\"orderedBy-528\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payerAcc\":\"payerAcc-386\",\"payerAddrTxt\":\"payerAddrTxt-962\",\"payerIban\":\"DE33672579920876531\",\"payerInfo\":\"payerInfo-992\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-708\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1017] GET /doc-inpays/{id} — Incoming Payment API
run_request "[1017] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [1018] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[1018] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":8879,\"amount\":477810.27,\"bankClearNr\":\"bankClearNr-349\",\"bankInfo\":\"bankInfo-507\",\"bdeRecVersion\":8949,\"benefAcc\":\"benefAcc-724\",\"benefRefNr\":\"benefRefNr-426\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-121\",\"contrPeriodStart\":\"contrPeriodStart-217\",\"credAddr\":\"credAddr-228\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-971\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-783\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-449\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-757\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-294\",\"orderDate\":\"2026-03-17\",\"orderNr\":3464,\"orderedBy\":\"orderedBy-656\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-289\",\"payerAddrTxt\":\"payerAddrTxt-359\",\"payerIban\":\"AT82160921867136580\",\"payerInfo\":\"payerInfo-215\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-293\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1019] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[1019] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [1020] GET /doc-intrs/{id} — Interest API
run_request "[1020] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [1021] POST /doc-invst-bdls — Investment Bundler API
run_request "[1021] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":376,\"bdeRecVersion\":8455,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-507\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-117\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-886\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-496\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1976,\"orderedBy\":\"orderedBy-352\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":1640,\"remnBaccBalMin\":3333,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1022] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1022] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [1023] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1023] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":3820,\"bdeRecVersion\":8184,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-925\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-925\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-578\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-319\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3226,\"orderedBy\":\"orderedBy-587\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":5159,\"remnBaccBalMin\":6693,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1024] POST /doc-crm-issues — Issue Management API
run_request "[1024] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-163\",\"advNr\":6331,\"allDayEvt\":true,\"attch\":\"attch-924\",\"bdeRecVersion\":9704,\"campgnTaskSeqNr\":2792,\"descn\":\"descn-355\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-494\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-758\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-965\",\"findingKey\":\"findingKey-875\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-597\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-416\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-172\",\"location\":\"location-713\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3382,\"orderedBy\":\"orderedBy-993\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":3077,\"qtyLinked\":3035,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-164\",\"subject\":\"subject-798\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-123\",\"undefBp\":\"undefBp-873\",\"val\":169,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1025] GET /doc-crm-issues/{id} — Issue Management API
run_request "[1025] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [1026] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[1026] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-160\",\"advNr\":4710,\"allDayEvt\":true,\"attch\":\"attch-597\",\"bdeRecVersion\":9394,\"campgnTaskSeqNr\":6847,\"descn\":\"descn-134\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-266\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-146\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-805\",\"findingKey\":\"findingKey-761\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-194\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-243\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-814\",\"location\":\"location-701\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5982,\"orderedBy\":\"orderedBy-788\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":1926,\"qtyLinked\":978,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-272\",\"subject\":\"subject-404\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-375\",\"undefBp\":\"undefBp-777\",\"val\":9880,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1027] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[1027] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [1028] GET /doc-letters/{id} — Letter API
run_request "[1028] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [1029] POST /doc-limits — Limit API
run_request "[1029] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":194,\"advTextCred\":\"advTextCred-237\",\"advTextDeb\":\"advTextDeb-549\",\"amount\":501820.57,\"bdeRecVersion\":9632,\"bookTextCred\":\"bookTextCred-515\",\"bookTextDeb\":\"bookTextDeb-206\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-856\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-725\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-309\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-506\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-499\",\"nextReview\":\"nextReview-500\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":6980,\"orderedBy\":\"orderedBy-346\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1030] GET /doc-limits/{id} — Limit API
run_request "[1030] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [1031] PATCH /doc-limits/{id} — Limit API
run_request "[1031] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":4754,\"advTextCred\":\"advTextCred-777\",\"advTextDeb\":\"advTextDeb-852\",\"amount\":569751.53,\"bdeRecVersion\":1068,\"bookTextCred\":\"bookTextCred-922\",\"bookTextDeb\":\"bookTextDeb-554\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-375\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-921\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-354\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-876\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-260\",\"nextReview\":\"nextReview-630\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8589,\"orderedBy\":\"orderedBy-165\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1032] POST /doc-loans — Loan API
run_request "[1032] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":8798,\"advTextCred\":\"advTextCred-618\",\"advTextDeb\":\"advTextDeb-972\",\"bdeRecVersion\":8147,\"bookTextCred\":\"bookTextCred-635\",\"bookTextDeb\":\"bookTextDeb-197\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-648\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-656\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-951\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-850\",\"intrGradManMarkup\":1447,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-853\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8388,\"orderedBy\":\"orderedBy-213\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6261,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1033] GET /doc-loans/{id} — Loan API
run_request "[1033] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [1034] PATCH /doc-loans/{id} — Loan API
run_request "[1034] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":2212,\"advTextCred\":\"advTextCred-324\",\"advTextDeb\":\"advTextDeb-746\",\"bdeRecVersion\":1377,\"bookTextCred\":\"bookTextCred-848\",\"bookTextDeb\":\"bookTextDeb-491\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-549\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-143\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-596\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-588\",\"intrGradManMarkup\":5930,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-499\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2481,\"orderedBy\":\"orderedBy-723\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2317,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1035] POST /doc-mass-settles — Mass Settlement API
run_request "[1035] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":1010,\"autoFillList\":true,\"bdeRecVersion\":4157,\"benefBpText\":\"benefBpText-193\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-842\",\"destBankBic\":\"BFGEIT3F\",\"destBankBpText\":\"destBankBpText-433\",\"destBankClr\":\"destBankClr-393\",\"destBankText\":\"destBankText-943\",\"destBenefText\":\"destBenefText-528\",\"destInfo\":\"destInfo-213\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-856\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-251\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-736\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-885\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":953,\"orderedBy\":\"orderedBy-282\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1036] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[1036] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [1037] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[1037] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":1654,\"autoFillList\":true,\"bdeRecVersion\":8224,\"benefBpText\":\"benefBpText-229\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-283\",\"destBankBic\":\"DEUTDEDB\",\"destBankBpText\":\"destBankBpText-424\",\"destBankClr\":\"destBankClr-284\",\"destBankText\":\"destBankText-682\",\"destBenefText\":\"destBenefText-524\",\"destInfo\":\"destInfo-204\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-564\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-832\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-143\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-568\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8523,\"orderedBy\":\"orderedBy-241\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1038] POST /doc-mmkts — Money Market API
run_request "[1038] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":1378,\"bdeRecVersion\":8234,\"capt\":3674,\"dcdStrike\":5515,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-252\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-616\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-771\",\"intrRate\":5.197,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-882\",\"maturityDate\":\"2026-03-17\",\"mktRate\":6.682,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3866,\"orderedBy\":\"orderedBy-549\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5219,\"respBpA\":true,\"respObjA\":true,\"rmRate\":8.341,\"settlePlanA\":true,\"trdrRate\":0.98,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1039] GET /doc-mmkts/{id} — Money Market API
run_request "[1039] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [1040] PATCH /doc-mmkts/{id} — Money Market API
run_request "[1040] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":1506,\"bdeRecVersion\":2396,\"capt\":240,\"dcdStrike\":8474,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-308\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-613\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-923\",\"intrRate\":6.964,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-733\",\"maturityDate\":\"2026-03-17\",\"mktRate\":3.006,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5967,\"orderedBy\":\"orderedBy-451\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9360,\"respBpA\":true,\"respObjA\":true,\"rmRate\":2.901,\"settlePlanA\":true,\"trdrRate\":3.596,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1041] POST /doc-xfermons — Money Transfer API
run_request "[1041] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":35,\"amount\":651533.13,\"bdeRecVersion\":3782,\"bulkItemIdent\":\"bulkItemIdent-976\",\"credAdvText\":\"credAdvText-900\",\"credBookText\":\"credBookText-905\",\"debAdvText\":\"debAdvText-560\",\"debBookText\":\"debBookText-307\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-772\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-505\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-280\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-297\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9331,\"orderedBy\":\"orderedBy-450\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1042] GET /doc-xfermons/{id} — Money Transfer API
run_request "[1042] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [1043] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[1043] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":7828,\"amount\":986505.47,\"bdeRecVersion\":3978,\"bulkItemIdent\":\"bulkItemIdent-499\",\"credAdvText\":\"credAdvText-725\",\"credBookText\":\"credBookText-831\",\"debAdvText\":\"debAdvText-400\",\"debBookText\":\"debBookText-980\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-999\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-744\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-229\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-498\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6598,\"orderedBy\":\"orderedBy-183\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1044] POST /doc-oofxs — OTC FX Option API
run_request "[1044] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":6102,\"advTextCred\":\"advTextCred-315\",\"advTextDeb\":\"advTextDeb-392\",\"bdeRecVersion\":9503,\"bookTextCred\":\"bookTextCred-956\",\"bookTextDeb\":\"bookTextDeb-148\",\"callQty\":6958,\"cutOffTime\":\"cutOffTime-603\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-603\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-757\",\"gross\":\"gross-992\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-483\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-199\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6647,\"orderedBy\":\"orderedBy-759\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-520\",\"putQty\":9640,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-313\",\"spread2\":\"spread2-351\",\"strike\":9628,\"strikePict\":4275,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1045] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[1045] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [1046] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[1046] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":5252,\"advTextCred\":\"advTextCred-985\",\"advTextDeb\":\"advTextDeb-378\",\"bdeRecVersion\":2857,\"bookTextCred\":\"bookTextCred-640\",\"bookTextDeb\":\"bookTextDeb-592\",\"callQty\":7811,\"cutOffTime\":\"cutOffTime-800\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-185\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-395\",\"gross\":\"gross-629\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-688\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-477\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8926,\"orderedBy\":\"orderedBy-246\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-194\",\"putQty\":2853,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-138\",\"spread2\":\"spread2-421\",\"strike\":2099,\"strikePict\":9222,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1047] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[1047] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [1048] GET /doc-otcopts/{id} — OTC Option API
run_request "[1048] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [1049] GET /doc-othsecs/{id} — Other Security API
run_request "[1049] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [1050] POST /doc-pays — Payment API
run_request "[1050] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":7026,\"amount\":283811.85,\"bank\":\"bank-784\",\"bankAcc\":\"bankAcc-450\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-307\",\"bankCorr1\":\"bankCorr1-170\",\"bankCorr1Acc\":\"bankCorr1Acc-388\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-170\",\"bankCorr3\":\"bankCorr3-946\",\"bankCorr3Acc\":\"bankCorr3Acc-135\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-552\",\"bankCorr4\":\"bankCorr4-886\",\"bankCorr4Acc\":\"bankCorr4Acc-277\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-745\",\"bankInfo\":\"bankInfo-383\",\"bdeRecVersion\":2928,\"benef\":\"benef-559\",\"benefAcc\":\"benefAcc-686\",\"benefIban\":\"CH43212738968502619\",\"benefInfo\":\"benefInfo-706\",\"benefRefNr\":\"benefRefNr-951\",\"bookTextCred\":\"bookTextCred-319\",\"bookTextDeb\":\"bookTextDeb-561\",\"bulkItemIdent\":\"bulkItemIdent-849\",\"destCountry\":{\"id\":3,\"ident\":\"IT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-615\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-214\",\"hasPostit\":true,\"instrAmount\":646824.03,\"intlRefNr\":\"intlRefNr-244\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE2130673382\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-233\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-512\",\"ordBankAcc\":\"ordBankAcc-908\",\"ordBankClearNr\":\"ordBankClearNr-191\",\"ordRef\":\"ordRef-796\",\"orderDate\":\"2026-03-17\",\"orderNr\":8869,\"orderedBy\":\"orderedBy-127\",\"orderedByAcc\":\"orderedByAcc-481\",\"origGrpRef\":\"origGrpRef-970\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-355\",\"stordPeriodEnd\":\"stordPeriodEnd-973\",\"stordPeriodStart\":\"stordPeriodStart-269\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39554489719\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1051] GET /doc-pays/{id} — Payment API
run_request "[1051] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [1052] PATCH /doc-pays/{id} — Payment API
run_request "[1052] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":6732,\"amount\":826710.08,\"bank\":\"bank-980\",\"bankAcc\":\"bankAcc-684\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-681\",\"bankCorr1\":\"bankCorr1-861\",\"bankCorr1Acc\":\"bankCorr1Acc-421\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-852\",\"bankCorr3\":\"bankCorr3-971\",\"bankCorr3Acc\":\"bankCorr3Acc-268\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-114\",\"bankCorr4\":\"bankCorr4-223\",\"bankCorr4Acc\":\"bankCorr4Acc-642\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-755\",\"bankInfo\":\"bankInfo-118\",\"bdeRecVersion\":7547,\"benef\":\"benef-448\",\"benefAcc\":\"benefAcc-352\",\"benefIban\":\"FR45594354713799075\",\"benefInfo\":\"benefInfo-818\",\"benefRefNr\":\"benefRefNr-271\",\"bookTextCred\":\"bookTextCred-164\",\"bookTextDeb\":\"bookTextDeb-417\",\"bulkItemIdent\":\"bulkItemIdent-169\",\"destCountry\":{\"id\":7,\"ident\":\"US\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-178\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-776\",\"hasPostit\":true,\"instrAmount\":158747.5,\"intlRefNr\":\"intlRefNr-473\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE1680422216\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-868\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-313\",\"ordBankAcc\":\"ordBankAcc-580\",\"ordBankClearNr\":\"ordBankClearNr-818\",\"ordRef\":\"ordRef-837\",\"orderDate\":\"2026-03-17\",\"orderNr\":3169,\"orderedBy\":\"orderedBy-657\",\"orderedByAcc\":\"orderedByAcc-622\",\"origGrpRef\":\"origGrpRef-198\",\"originCountry\":{\"id\":4,\"ident\":\"FR\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-545\",\"stordPeriodEnd\":\"stordPeriodEnd-119\",\"stordPeriodStart\":\"stordPeriodStart-239\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39367596729\"}"

# [1053] GET /doc-realsecs/{id} — Real Security API
run_request "[1053] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [1054] POST /doc-realtys — Realty API
run_request "[1054] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":8973,\"bdeRecVersion\":2476,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-672\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-287\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-420\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-250\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1521,\"orderedBy\":\"orderedBy-159\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1055] GET /doc-realtys/{id} — Realty API
run_request "[1055] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [1056] PATCH /doc-realtys/{id} — Realty API
run_request "[1056] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":8517,\"bdeRecVersion\":5854,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-198\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-311\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-822\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-319\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3595,\"orderedBy\":\"orderedBy-962\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1057] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[1057] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":6733,\"bdeRecVersion\":5501,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-912\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-940\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-793\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-268\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9447,\"orderedBy\":\"orderedBy-430\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1058] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1058] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [1059] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1059] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":6738,\"bdeRecVersion\":635,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-786\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-944\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-844\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-553\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8963,\"orderedBy\":\"orderedBy-334\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1060] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[1060] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [1061] POST /doc-rebalss — Rebalancer Order API
run_request "[1061] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":9883,\"bdeRecVersion\":2244,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-431\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-670\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-132\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-649\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":213,\"orderedBy\":\"orderedBy-982\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1062] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[1062] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [1063] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[1063] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":8335,\"bdeRecVersion\":5902,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-274\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-375\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-671\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-767\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8025,\"orderedBy\":\"orderedBy-768\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1064] GET /doc-repocs/{id} — Repo Contract API
run_request "[1064] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [1445] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[1445] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [1446] POST /doc-ctact2s — Contact Management (V2) API
run_request "[1446] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":1733,\"attch\":\"attch-778\",\"attchA\":true,\"bdeRecVersion\":2391,\"campgnCltReaction\":\"campgnCltReaction-494\",\"campgnRespKey\":\"campgnRespKey-233\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-207\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-832\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-848\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-631\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-508\",\"linkDocListA\":true,\"loc\":\"loc-972\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9199,\"orderedBy\":\"orderedBy-837\",\"particListA\":true,\"questrSeqNr\":9013,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":7873,\"reactComment\":\"reactComment-447\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-200\",\"reactNrPartic\":3570,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-210\",\"subjA\":true,\"syncSeqNr\":1304,\"totExpndTimeM\":1043,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1447] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1447] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [1448] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1448] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":7504,\"attch\":\"attch-136\",\"attchA\":true,\"bdeRecVersion\":736,\"campgnCltReaction\":\"campgnCltReaction-628\",\"campgnRespKey\":\"campgnRespKey-607\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-598\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-264\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-622\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-271\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-728\",\"linkDocListA\":true,\"loc\":\"loc-409\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4177,\"orderedBy\":\"orderedBy-474\",\"particListA\":true,\"questrSeqNr\":8362,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":1377,\"reactComment\":\"reactComment-588\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-786\",\"reactNrPartic\":9254,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-324\",\"subjA\":true,\"syncSeqNr\":4057,\"totExpndTimeM\":6293,\"trxDate\":\"2026-03-17\"}"

# [1449] GET /doc-cmgs/{id} — Cashier Management API
run_request "[1449] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [1450] GET /doc-cops/{id} — Cashier Operations API
run_request "[1450] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [1451] POST /doc-clts — Client Opening API
run_request "[1451] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1452] GET /doc-clts/{id} — Client Opening API
run_request "[1452] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [1453] PATCH /doc-clts/{id} — Client Opening API
run_request "[1453] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [1454] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[1454] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [1455] GET /doc-cltms/{id} — Collateral Movement API
run_request "[1455] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [1456] GET /doc-cords/{id} — Collective Order API
run_request "[1456] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [1457] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[1457] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [1458] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[1458] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [1459] POST /doc-xioms — External Investment Order Manager API
run_request "[1459] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":208,\"bdeRecVersion\":6668,\"bpLevelRep\":true,\"descn\":\"descn-506\",\"extlRefNr\":\"extlRefNr-137\",\"extlRepLang\":\"extlRepLang-417\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-344\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-393\",\"linkGrp\":383,\"orderDate\":\"2026-03-17\",\"orderNr\":2907,\"orderedBy\":\"orderedBy-111\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1460] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[1460] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [1461] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[1461] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":6562,\"bdeRecVersion\":7632,\"bpLevelRep\":true,\"descn\":\"descn-579\",\"extlRefNr\":\"extlRefNr-386\",\"extlRepLang\":\"extlRepLang-893\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-970\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-392\",\"linkGrp\":821,\"orderDate\":\"2026-03-17\",\"orderNr\":836,\"orderedBy\":\"orderedBy-645\",\"sendRepToEbank\":true}"

# [1462] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[1462] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [1463] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[1463] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [1464] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[1464] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [1465] POST /doc-fxsws — FX Swap API
run_request "[1465] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-991\",\"bdeRecVersion\":6571,\"buyBookText1\":\"buyBookText1-857\",\"buyBookText2\":\"buyBookText2-282\",\"buyQty1\":8799,\"buyQty2\":1026,\"cfi\":\"cfi-727\",\"dealFwdRate1\":2.818,\"dealFwdRate2\":4.578,\"dealSpotRate1\":0.452,\"dealSpotRate2\":2.201,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"FR7332055102\",\"lastTrans\":\"lastTrans-642\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-465\",\"period1\":\"period1-997\",\"period2\":\"period2-952\",\"sellBookText1\":\"sellBookText1-974\",\"sellBookText2\":\"sellBookText2-164\",\"sellQty1\":945,\"sellQty2\":7990,\"spotDate\":\"2026-03-17\",\"trdrRate1\":1.535,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1466] GET /doc-fxsws/{id} — FX Swap API
run_request "[1466] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [1467] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[1467] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-103\",\"bdeRecVersion\":2496,\"buyBookText1\":\"buyBookText1-881\",\"buyBookText2\":\"buyBookText2-571\",\"buyQty1\":9845,\"buyQty2\":8988,\"cfi\":\"cfi-701\",\"dealFwdRate1\":2.354,\"dealFwdRate2\":2.754,\"dealSpotRate1\":4.775,\"dealSpotRate2\":6.154,\"foDomiCountry\":{\"id\":3,\"ident\":\"IT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB2484432916\",\"lastTrans\":\"lastTrans-996\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-431\",\"period1\":\"period1-685\",\"period2\":\"period2-897\",\"sellBookText1\":\"sellBookText1-612\",\"sellBookText2\":\"sellBookText2-937\",\"sellQty1\":1988,\"sellQty2\":1922,\"spotDate\":\"2026-03-17\",\"trdrRate1\":5.974,\"trxDate\":\"2026-03-17\"}"

# [1468] POST /doc-fxtrs — FXTR API
run_request "[1468] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":5552,\"advText\":\"advText-700\",\"bdeRecVersion\":2926,\"buyQty\":8417,\"dealFwdRate\":2.672,\"dealSpotRate\":6.432,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-488\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-159\",\"fwdSpread\":4515,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-464\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-121\",\"limit\":9744,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4192,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5510,\"orderedBy\":\"orderedBy-518\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-974\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":1178,\"settlePlanA\":true,\"spotSpread1\":8291,\"spotSpread2\":9899,\"trdrRate\":3.298,\"trigPrice\":4656,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39758178147\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1469] GET /doc-fxtrs/{id} — FXTR API
run_request "[1469] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [1470] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[1470] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":4173,\"advText\":\"advText-660\",\"bdeRecVersion\":266,\"buyQty\":2673,\"dealFwdRate\":5.322,\"dealSpotRate\":1.817,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-614\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-508\",\"fwdSpread\":5248,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-858\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-456\",\"limit\":7692,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":7612,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7271,\"orderedBy\":\"orderedBy-176\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-641\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7473,\"settlePlanA\":true,\"spotSpread1\":4792,\"spotSpread2\":7755,\"trdrRate\":7.146,\"trigPrice\":3564,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+33536558496\"}"

# [1471] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[1471] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [1472] POST /doc-inpays — Incoming Payment API
run_request "[1472] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":5432,\"amount\":597164.89,\"bankClearNr\":\"bankClearNr-109\",\"bankInfo\":\"bankInfo-774\",\"bdeRecVersion\":6916,\"benefAcc\":\"benefAcc-683\",\"benefRefNr\":\"benefRefNr-546\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-482\",\"contrPeriodStart\":\"contrPeriodStart-161\",\"credAddr\":\"credAddr-113\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-963\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-690\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-941\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-227\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-132\",\"orderDate\":\"2026-03-17\",\"orderNr\":4824,\"orderedBy\":\"orderedBy-721\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payerAcc\":\"payerAcc-387\",\"payerAddrTxt\":\"payerAddrTxt-801\",\"payerIban\":\"FR41615962035271201\",\"payerInfo\":\"payerInfo-295\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-613\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1473] GET /doc-inpays/{id} — Incoming Payment API
run_request "[1473] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [1474] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[1474] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":8662,\"amount\":893384.06,\"bankClearNr\":\"bankClearNr-477\",\"bankInfo\":\"bankInfo-236\",\"bdeRecVersion\":7440,\"benefAcc\":\"benefAcc-990\",\"benefRefNr\":\"benefRefNr-885\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-977\",\"contrPeriodStart\":\"contrPeriodStart-390\",\"credAddr\":\"credAddr-928\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-758\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-913\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-145\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-993\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-558\",\"orderDate\":\"2026-03-17\",\"orderNr\":894,\"orderedBy\":\"orderedBy-781\",\"originCountry\":{\"id\":2,\"ident\":\"DE\"},\"payerAcc\":\"payerAcc-656\",\"payerAddrTxt\":\"payerAddrTxt-716\",\"payerIban\":\"IT34109717957740293\",\"payerInfo\":\"payerInfo-398\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-783\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1475] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[1475] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [1476] GET /doc-intrs/{id} — Interest API
run_request "[1476] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [1477] POST /doc-invst-bdls — Investment Bundler API
run_request "[1477] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":9823,\"bdeRecVersion\":6620,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-247\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-861\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-133\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-441\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4392,\"orderedBy\":\"orderedBy-547\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":9090,\"remnBaccBalMin\":9002,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1478] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1478] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [1479] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1479] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":4954,\"bdeRecVersion\":9841,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-619\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-552\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-442\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-750\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4694,\"orderedBy\":\"orderedBy-132\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":4675,\"remnBaccBalMin\":5072,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1480] POST /doc-crm-issues — Issue Management API
run_request "[1480] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-664\",\"advNr\":9511,\"allDayEvt\":true,\"attch\":\"attch-952\",\"bdeRecVersion\":554,\"campgnTaskSeqNr\":6017,\"descn\":\"descn-422\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-434\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-577\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-223\",\"findingKey\":\"findingKey-276\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-176\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-649\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-899\",\"location\":\"location-618\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5538,\"orderedBy\":\"orderedBy-155\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":9252,\"qtyLinked\":7247,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-373\",\"subject\":\"subject-675\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-649\",\"undefBp\":\"undefBp-622\",\"val\":8460,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1481] GET /doc-crm-issues/{id} — Issue Management API
run_request "[1481] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [1482] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[1482] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-770\",\"advNr\":4433,\"allDayEvt\":true,\"attch\":\"attch-425\",\"bdeRecVersion\":4377,\"campgnTaskSeqNr\":2570,\"descn\":\"descn-813\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-396\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-154\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-954\",\"findingKey\":\"findingKey-724\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-115\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-100\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-170\",\"location\":\"location-466\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3314,\"orderedBy\":\"orderedBy-899\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6852,\"qtyLinked\":7042,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-645\",\"subject\":\"subject-406\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-409\",\"undefBp\":\"undefBp-219\",\"val\":5895,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1483] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[1483] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [1484] GET /doc-letters/{id} — Letter API
run_request "[1484] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [1485] POST /doc-limits — Limit API
run_request "[1485] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":7117,\"advTextCred\":\"advTextCred-565\",\"advTextDeb\":\"advTextDeb-790\",\"amount\":222069.07,\"bdeRecVersion\":6997,\"bookTextCred\":\"bookTextCred-286\",\"bookTextDeb\":\"bookTextDeb-474\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-775\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-505\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-226\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-702\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-202\",\"nextReview\":\"nextReview-922\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5587,\"orderedBy\":\"orderedBy-109\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1486] GET /doc-limits/{id} — Limit API
run_request "[1486] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [1487] PATCH /doc-limits/{id} — Limit API
run_request "[1487] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":5378,\"advTextCred\":\"advTextCred-131\",\"advTextDeb\":\"advTextDeb-829\",\"amount\":891429.73,\"bdeRecVersion\":8441,\"bookTextCred\":\"bookTextCred-437\",\"bookTextDeb\":\"bookTextDeb-669\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-927\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-316\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-814\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-396\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-981\",\"nextReview\":\"nextReview-314\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7180,\"orderedBy\":\"orderedBy-427\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1488] POST /doc-loans — Loan API
run_request "[1488] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":3316,\"advTextCred\":\"advTextCred-774\",\"advTextDeb\":\"advTextDeb-600\",\"bdeRecVersion\":8360,\"bookTextCred\":\"bookTextCred-638\",\"bookTextDeb\":\"bookTextDeb-389\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-130\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-463\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-117\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-898\",\"intrGradManMarkup\":3715,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-174\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9115,\"orderedBy\":\"orderedBy-465\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8249,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1489] GET /doc-loans/{id} — Loan API
run_request "[1489] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [1490] PATCH /doc-loans/{id} — Loan API
run_request "[1490] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":8703,\"advTextCred\":\"advTextCred-605\",\"advTextDeb\":\"advTextDeb-732\",\"bdeRecVersion\":9399,\"bookTextCred\":\"bookTextCred-409\",\"bookTextDeb\":\"bookTextDeb-242\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-451\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-942\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-977\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-284\",\"intrGradManMarkup\":2013,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-705\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5314,\"orderedBy\":\"orderedBy-248\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2486,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1491] POST /doc-mass-settles — Mass Settlement API
run_request "[1491] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":6274,\"autoFillList\":true,\"bdeRecVersion\":2664,\"benefBpText\":\"benefBpText-983\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-116\",\"destBankBic\":\"DEUTDEDB\",\"destBankBpText\":\"destBankBpText-830\",\"destBankClr\":\"destBankClr-602\",\"destBankText\":\"destBankText-429\",\"destBenefText\":\"destBenefText-483\",\"destInfo\":\"destInfo-518\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-185\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-455\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-373\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-305\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":310,\"orderedBy\":\"orderedBy-309\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1492] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[1492] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [1493] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[1493] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":5777,\"autoFillList\":true,\"bdeRecVersion\":1686,\"benefBpText\":\"benefBpText-840\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-433\",\"destBankBic\":\"UBSWCHZH80A\",\"destBankBpText\":\"destBankBpText-622\",\"destBankClr\":\"destBankClr-372\",\"destBankText\":\"destBankText-651\",\"destBenefText\":\"destBenefText-978\",\"destInfo\":\"destInfo-941\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-422\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-737\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-864\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-896\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9693,\"orderedBy\":\"orderedBy-353\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1494] POST /doc-mmkts — Money Market API
run_request "[1494] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":334,\"bdeRecVersion\":2318,\"capt\":498,\"dcdStrike\":5508,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-123\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-705\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-450\",\"intrRate\":3.231,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-546\",\"maturityDate\":\"2026-03-17\",\"mktRate\":5.486,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8545,\"orderedBy\":\"orderedBy-141\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4924,\"respBpA\":true,\"respObjA\":true,\"rmRate\":1.147,\"settlePlanA\":true,\"trdrRate\":8.341,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1495] GET /doc-mmkts/{id} — Money Market API
run_request "[1495] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [1496] PATCH /doc-mmkts/{id} — Money Market API
run_request "[1496] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":2068,\"bdeRecVersion\":6373,\"capt\":2676,\"dcdStrike\":8995,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-833\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-532\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-212\",\"intrRate\":2.517,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-839\",\"maturityDate\":\"2026-03-17\",\"mktRate\":7.744,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5370,\"orderedBy\":\"orderedBy-618\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4038,\"respBpA\":true,\"respObjA\":true,\"rmRate\":8.035,\"settlePlanA\":true,\"trdrRate\":1.694,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1497] POST /doc-xfermons — Money Transfer API
run_request "[1497] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":844,\"amount\":644645.11,\"bdeRecVersion\":5851,\"bulkItemIdent\":\"bulkItemIdent-325\",\"credAdvText\":\"credAdvText-810\",\"credBookText\":\"credBookText-888\",\"debAdvText\":\"debAdvText-351\",\"debBookText\":\"debBookText-879\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-735\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-595\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-187\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-222\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3359,\"orderedBy\":\"orderedBy-888\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1498] GET /doc-xfermons/{id} — Money Transfer API
run_request "[1498] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [1499] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[1499] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":3922,\"amount\":898357.29,\"bdeRecVersion\":9758,\"bulkItemIdent\":\"bulkItemIdent-265\",\"credAdvText\":\"credAdvText-644\",\"credBookText\":\"credBookText-381\",\"debAdvText\":\"debAdvText-366\",\"debBookText\":\"debBookText-635\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-784\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-174\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-800\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-696\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5539,\"orderedBy\":\"orderedBy-857\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1500] POST /doc-oofxs — OTC FX Option API
run_request "[1500] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":9673,\"advTextCred\":\"advTextCred-569\",\"advTextDeb\":\"advTextDeb-185\",\"bdeRecVersion\":4506,\"bookTextCred\":\"bookTextCred-583\",\"bookTextDeb\":\"bookTextDeb-784\",\"callQty\":7107,\"cutOffTime\":\"cutOffTime-593\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-924\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-143\",\"gross\":\"gross-963\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-832\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-793\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2546,\"orderedBy\":\"orderedBy-505\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-523\",\"putQty\":3230,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-555\",\"spread2\":\"spread2-335\",\"strike\":269,\"strikePict\":215,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1501] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[1501] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [1502] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[1502] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":7505,\"advTextCred\":\"advTextCred-262\",\"advTextDeb\":\"advTextDeb-877\",\"bdeRecVersion\":8236,\"bookTextCred\":\"bookTextCred-147\",\"bookTextDeb\":\"bookTextDeb-583\",\"callQty\":2903,\"cutOffTime\":\"cutOffTime-899\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-830\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-911\",\"gross\":\"gross-202\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-646\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-935\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3296,\"orderedBy\":\"orderedBy-915\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-196\",\"putQty\":421,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-731\",\"spread2\":\"spread2-436\",\"strike\":627,\"strikePict\":3314,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1503] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[1503] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [1504] GET /doc-otcopts/{id} — OTC Option API
run_request "[1504] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [1505] GET /doc-othsecs/{id} — Other Security API
run_request "[1505] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [1506] POST /doc-pays — Payment API
run_request "[1506] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":6505,\"amount\":928688.81,\"bank\":\"bank-213\",\"bankAcc\":\"bankAcc-747\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-987\",\"bankCorr1\":\"bankCorr1-493\",\"bankCorr1Acc\":\"bankCorr1Acc-995\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-340\",\"bankCorr3\":\"bankCorr3-718\",\"bankCorr3Acc\":\"bankCorr3Acc-397\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-167\",\"bankCorr4\":\"bankCorr4-366\",\"bankCorr4Acc\":\"bankCorr4Acc-790\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-143\",\"bankInfo\":\"bankInfo-709\",\"bdeRecVersion\":3694,\"benef\":\"benef-707\",\"benefAcc\":\"benefAcc-226\",\"benefIban\":\"CH19159193901345464\",\"benefInfo\":\"benefInfo-806\",\"benefRefNr\":\"benefRefNr-688\",\"bookTextCred\":\"bookTextCred-992\",\"bookTextDeb\":\"bookTextDeb-704\",\"bulkItemIdent\":\"bulkItemIdent-117\",\"destCountry\":{\"id\":7,\"ident\":\"US\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-410\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-703\",\"hasPostit\":true,\"instrAmount\":188748.34,\"intlRefNr\":\"intlRefNr-744\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"GB6411653785\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-182\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-849\",\"ordBankAcc\":\"ordBankAcc-890\",\"ordBankClearNr\":\"ordBankClearNr-490\",\"ordRef\":\"ordRef-393\",\"orderDate\":\"2026-03-17\",\"orderNr\":4177,\"orderedBy\":\"orderedBy-242\",\"orderedByAcc\":\"orderedByAcc-813\",\"origGrpRef\":\"origGrpRef-794\",\"originCountry\":{\"id\":4,\"ident\":\"FR\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-180\",\"stordPeriodEnd\":\"stordPeriodEnd-435\",\"stordPeriodStart\":\"stordPeriodStart-454\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41738564009\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1507] GET /doc-pays/{id} — Payment API
run_request "[1507] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [1508] PATCH /doc-pays/{id} — Payment API
run_request "[1508] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":9137,\"amount\":544965.45,\"bank\":\"bank-266\",\"bankAcc\":\"bankAcc-526\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-135\",\"bankCorr1\":\"bankCorr1-383\",\"bankCorr1Acc\":\"bankCorr1Acc-920\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-811\",\"bankCorr3\":\"bankCorr3-197\",\"bankCorr3Acc\":\"bankCorr3Acc-672\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-119\",\"bankCorr4\":\"bankCorr4-426\",\"bankCorr4Acc\":\"bankCorr4Acc-558\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-468\",\"bankInfo\":\"bankInfo-404\",\"bdeRecVersion\":6074,\"benef\":\"benef-785\",\"benefAcc\":\"benefAcc-482\",\"benefIban\":\"IT71231931025430956\",\"benefInfo\":\"benefInfo-160\",\"benefRefNr\":\"benefRefNr-432\",\"bookTextCred\":\"bookTextCred-823\",\"bookTextDeb\":\"bookTextDeb-594\",\"bulkItemIdent\":\"bulkItemIdent-655\",\"destCountry\":{\"id\":7,\"ident\":\"US\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-159\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-554\",\"hasPostit\":true,\"instrAmount\":153877.4,\"intlRefNr\":\"intlRefNr-944\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"FR1237359536\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-725\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-365\",\"ordBankAcc\":\"ordBankAcc-496\",\"ordBankClearNr\":\"ordBankClearNr-281\",\"ordRef\":\"ordRef-210\",\"orderDate\":\"2026-03-17\",\"orderNr\":6949,\"orderedBy\":\"orderedBy-857\",\"orderedByAcc\":\"orderedByAcc-676\",\"origGrpRef\":\"origGrpRef-726\",\"originCountry\":{\"id\":7,\"ident\":\"US\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-896\",\"stordPeriodEnd\":\"stordPeriodEnd-992\",\"stordPeriodStart\":\"stordPeriodStart-708\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41611026759\"}"

# [1509] GET /doc-realsecs/{id} — Real Security API
run_request "[1509] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [1510] POST /doc-realtys — Realty API
run_request "[1510] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":8480,\"bdeRecVersion\":9963,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-594\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-736\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-514\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-609\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":722,\"orderedBy\":\"orderedBy-405\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1511] GET /doc-realtys/{id} — Realty API
run_request "[1511] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [1512] PATCH /doc-realtys/{id} — Realty API
run_request "[1512] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":3259,\"bdeRecVersion\":5415,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-963\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-956\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-427\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-635\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4079,\"orderedBy\":\"orderedBy-793\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1513] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[1513] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":8963,\"bdeRecVersion\":213,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-961\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-223\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-708\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-412\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1063,\"orderedBy\":\"orderedBy-398\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1514] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1514] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [1515] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1515] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":2882,\"bdeRecVersion\":7390,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-202\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-574\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-585\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-137\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":648,\"orderedBy\":\"orderedBy-239\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1516] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[1516] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [1517] POST /doc-rebalss — Rebalancer Order API
run_request "[1517] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":7138,\"bdeRecVersion\":7616,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-224\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-683\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-658\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-957\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9962,\"orderedBy\":\"orderedBy-534\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1518] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[1518] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [1519] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[1519] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":7384,\"bdeRecVersion\":9015,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-584\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-995\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-807\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-601\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5395,\"orderedBy\":\"orderedBy-690\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1520] GET /doc-repocs/{id} — Repo Contract API
run_request "[1520] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [305] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[305] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [306] POST /doc-ctact2s — Contact Management (V2) API
run_request "[306] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":4728,\"attch\":\"attch-700\",\"attchA\":true,\"bdeRecVersion\":3915,\"campgnCltReaction\":\"campgnCltReaction-413\",\"campgnRespKey\":\"campgnRespKey-473\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-828\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-807\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-837\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-578\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-268\",\"linkDocListA\":true,\"loc\":\"loc-143\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6209,\"orderedBy\":\"orderedBy-222\",\"particListA\":true,\"questrSeqNr\":9776,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":3850,\"reactComment\":\"reactComment-816\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-687\",\"reactNrPartic\":7434,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-611\",\"subjA\":true,\"syncSeqNr\":1298,\"totExpndTimeM\":7044,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [307] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[307] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [308] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[308] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":4033,\"attch\":\"attch-159\",\"attchA\":true,\"bdeRecVersion\":9305,\"campgnCltReaction\":\"campgnCltReaction-630\",\"campgnRespKey\":\"campgnRespKey-187\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-624\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-736\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-649\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-100\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-582\",\"linkDocListA\":true,\"loc\":\"loc-101\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1117,\"orderedBy\":\"orderedBy-594\",\"particListA\":true,\"questrSeqNr\":1859,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":2655,\"reactComment\":\"reactComment-310\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-663\",\"reactNrPartic\":2655,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-227\",\"subjA\":true,\"syncSeqNr\":2912,\"totExpndTimeM\":6984,\"trxDate\":\"2026-03-17\"}"

# [309] GET /doc-cmgs/{id} — Cashier Management API
run_request "[309] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [310] GET /doc-cops/{id} — Cashier Operations API
run_request "[310] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [311] POST /doc-clts — Client Opening API
run_request "[311] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [312] GET /doc-clts/{id} — Client Opening API
run_request "[312] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [313] PATCH /doc-clts/{id} — Client Opening API
run_request "[313] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [314] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[314] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [315] GET /doc-cltms/{id} — Collateral Movement API
run_request "[315] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [316] GET /doc-cords/{id} — Collective Order API
run_request "[316] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>Capi Test Report · Part 5</title>
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
<h1>🧪 Capi Test Report <span style='color:#8b949e;font-size:14px'>Part 5 / 8</span></h1>
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