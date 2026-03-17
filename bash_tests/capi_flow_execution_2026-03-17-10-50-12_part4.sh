#!/usr/bin/env bash
# =============================================================
# Capi Test Runner — FLOW Execution (Part 4/8)
# Generated: 2026-03-17T10:50:15.432Z
# Cases:     221–268 of 1596
# Timeout:   15s per request
# =============================================================

# ── CONFIGURE ──────────────────────────────────────────────
BASE_URL="http://localhost:8855"   # Mock Server :8855
TIMEOUT=15             # Per-request timeout in seconds
REPORT_FILE="capi_flow_execution_2026-03-17-10-50-12_part4_report.html"
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
ID_DOC_OTHSECS=""
ID_DOC_PAYS=""
ID_DOC_REALSECS=""
ID_DOC_REALTYS=""

# ── INIT HTML REPORT ─────────────────────────────────────────
echo "Starting 200 test(s)..."

# ── TEST CASES ───────────────────────────────────────────────
# [221] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[221] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":1099,\"bdeRecVersion\":3226,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-878\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-966\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-597\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-988\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6305,\"orderedBy\":\"orderedBy-527\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [222] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[222] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [223] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[223] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":3892,\"bdeRecVersion\":5525,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-705\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-919\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-669\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-421\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9953,\"orderedBy\":\"orderedBy-529\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [224] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[224] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [225] POST /doc-rebalss — Rebalancer Order API
run_request "[225] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":6161,\"bdeRecVersion\":777,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-497\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-819\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-622\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-195\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3206,\"orderedBy\":\"orderedBy-264\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [226] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[226] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [227] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[227] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":4067,\"bdeRecVersion\":8242,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-735\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-112\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-379\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-746\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":741,\"orderedBy\":\"orderedBy-567\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [228] GET /doc-repocs/{id} — Repo Contract API
run_request "[228] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [913] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[913] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [914] POST /doc-ctact2s — Contact Management (V2) API
run_request "[914] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":1650,\"attch\":\"attch-790\",\"attchA\":true,\"bdeRecVersion\":5130,\"campgnCltReaction\":\"campgnCltReaction-994\",\"campgnRespKey\":\"campgnRespKey-366\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-394\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-968\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-188\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-166\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-347\",\"linkDocListA\":true,\"loc\":\"loc-730\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4247,\"orderedBy\":\"orderedBy-541\",\"particListA\":true,\"questrSeqNr\":5247,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":7450,\"reactComment\":\"reactComment-579\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-100\",\"reactNrPartic\":756,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-193\",\"subjA\":true,\"syncSeqNr\":6741,\"totExpndTimeM\":6617,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [915] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[915] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [916] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[916] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":5643,\"attch\":\"attch-943\",\"attchA\":true,\"bdeRecVersion\":7288,\"campgnCltReaction\":\"campgnCltReaction-387\",\"campgnRespKey\":\"campgnRespKey-983\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-669\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-479\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-256\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-295\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-215\",\"linkDocListA\":true,\"loc\":\"loc-534\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4617,\"orderedBy\":\"orderedBy-191\",\"particListA\":true,\"questrSeqNr\":8837,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":3737,\"reactComment\":\"reactComment-262\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-487\",\"reactNrPartic\":5174,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-879\",\"subjA\":true,\"syncSeqNr\":3893,\"totExpndTimeM\":7742,\"trxDate\":\"2026-03-17\"}"

# [917] GET /doc-cmgs/{id} — Cashier Management API
run_request "[917] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [918] GET /doc-cops/{id} — Cashier Operations API
run_request "[918] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [919] POST /doc-clts — Client Opening API
run_request "[919] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [920] GET /doc-clts/{id} — Client Opening API
run_request "[920] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [921] PATCH /doc-clts/{id} — Client Opening API
run_request "[921] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [922] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[922] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [923] GET /doc-cltms/{id} — Collateral Movement API
run_request "[923] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [924] GET /doc-cords/{id} — Collective Order API
run_request "[924] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [925] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[925] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [926] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[926] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [927] POST /doc-xioms — External Investment Order Manager API
run_request "[927] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":3166,\"bdeRecVersion\":2640,\"bpLevelRep\":true,\"descn\":\"descn-828\",\"extlRefNr\":\"extlRefNr-783\",\"extlRepLang\":\"extlRepLang-947\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-903\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-778\",\"linkGrp\":9720,\"orderDate\":\"2026-03-17\",\"orderNr\":3274,\"orderedBy\":\"orderedBy-683\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [928] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[928] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [929] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[929] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":8738,\"bdeRecVersion\":8932,\"bpLevelRep\":true,\"descn\":\"descn-313\",\"extlRefNr\":\"extlRefNr-312\",\"extlRepLang\":\"extlRepLang-115\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-847\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-294\",\"linkGrp\":7922,\"orderDate\":\"2026-03-17\",\"orderNr\":9776,\"orderedBy\":\"orderedBy-569\",\"sendRepToEbank\":true}"

# [930] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[930] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [931] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[931] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [932] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[932] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [933] POST /doc-fxsws — FX Swap API
run_request "[933] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-153\",\"bdeRecVersion\":6564,\"buyBookText1\":\"buyBookText1-564\",\"buyBookText2\":\"buyBookText2-666\",\"buyQty1\":9563,\"buyQty2\":3963,\"cfi\":\"cfi-615\",\"dealFwdRate1\":6.573,\"dealFwdRate2\":5.995,\"dealSpotRate1\":0.63,\"dealSpotRate2\":6.731,\"foDomiCountry\":{\"id\":1,\"ident\":\"CH\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH5717716508\",\"lastTrans\":\"lastTrans-484\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-694\",\"period1\":\"period1-438\",\"period2\":\"period2-239\",\"sellBookText1\":\"sellBookText1-336\",\"sellBookText2\":\"sellBookText2-959\",\"sellQty1\":8972,\"sellQty2\":2757,\"spotDate\":\"2026-03-17\",\"trdrRate1\":1.792,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [934] GET /doc-fxsws/{id} — FX Swap API
run_request "[934] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [935] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[935] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-706\",\"bdeRecVersion\":5098,\"buyBookText1\":\"buyBookText1-230\",\"buyBookText2\":\"buyBookText2-277\",\"buyQty1\":1681,\"buyQty2\":6246,\"cfi\":\"cfi-644\",\"dealFwdRate1\":6.342,\"dealFwdRate2\":3.418,\"dealSpotRate1\":3.978,\"dealSpotRate2\":6.702,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB3924051467\",\"lastTrans\":\"lastTrans-641\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-355\",\"period1\":\"period1-906\",\"period2\":\"period2-344\",\"sellBookText1\":\"sellBookText1-416\",\"sellBookText2\":\"sellBookText2-261\",\"sellQty1\":6139,\"sellQty2\":7919,\"spotDate\":\"2026-03-17\",\"trdrRate1\":2.893,\"trxDate\":\"2026-03-17\"}"

# [936] POST /doc-fxtrs — FXTR API
run_request "[936] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":6834,\"advText\":\"advText-579\",\"bdeRecVersion\":4007,\"buyQty\":8869,\"dealFwdRate\":6.173,\"dealSpotRate\":3.642,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-503\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-505\",\"fwdSpread\":6143,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-426\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-598\",\"limit\":1081,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":3054,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2295,\"orderedBy\":\"orderedBy-763\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-169\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7956,\"settlePlanA\":true,\"spotSpread1\":8710,\"spotSpread2\":3302,\"trdrRate\":3.408,\"trigPrice\":3322,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+33672040740\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [937] GET /doc-fxtrs/{id} — FXTR API
run_request "[937] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [938] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[938] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":8038,\"advText\":\"advText-214\",\"bdeRecVersion\":6965,\"buyQty\":5787,\"dealFwdRate\":6.483,\"dealSpotRate\":0.466,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-155\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-218\",\"fwdSpread\":3868,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-872\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-103\",\"limit\":4596,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":2073,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8004,\"orderedBy\":\"orderedBy-367\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-572\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":9767,\"settlePlanA\":true,\"spotSpread1\":1194,\"spotSpread2\":8909,\"trdrRate\":3.499,\"trigPrice\":5429,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+49312247888\"}"

# [939] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[939] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [940] POST /doc-inpays — Incoming Payment API
run_request "[940] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":7229,\"amount\":671072.28,\"bankClearNr\":\"bankClearNr-659\",\"bankInfo\":\"bankInfo-850\",\"bdeRecVersion\":4227,\"benefAcc\":\"benefAcc-888\",\"benefRefNr\":\"benefRefNr-835\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-623\",\"contrPeriodStart\":\"contrPeriodStart-931\",\"credAddr\":\"credAddr-705\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-702\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-731\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-512\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-896\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-320\",\"orderDate\":\"2026-03-17\",\"orderNr\":2578,\"orderedBy\":\"orderedBy-254\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-979\",\"payerAddrTxt\":\"payerAddrTxt-246\",\"payerIban\":\"FR57167173696134927\",\"payerInfo\":\"payerInfo-376\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-807\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [941] GET /doc-inpays/{id} — Incoming Payment API
run_request "[941] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [942] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[942] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":1891,\"amount\":609467.71,\"bankClearNr\":\"bankClearNr-812\",\"bankInfo\":\"bankInfo-888\",\"bdeRecVersion\":7959,\"benefAcc\":\"benefAcc-190\",\"benefRefNr\":\"benefRefNr-818\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-159\",\"contrPeriodStart\":\"contrPeriodStart-729\",\"credAddr\":\"credAddr-220\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-521\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-766\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-670\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-712\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-434\",\"orderDate\":\"2026-03-17\",\"orderNr\":6929,\"orderedBy\":\"orderedBy-556\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-997\",\"payerAddrTxt\":\"payerAddrTxt-706\",\"payerIban\":\"FR89454531275400195\",\"payerInfo\":\"payerInfo-820\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-751\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [943] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[943] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [944] GET /doc-intrs/{id} — Interest API
run_request "[944] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [945] POST /doc-invst-bdls — Investment Bundler API
run_request "[945] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":8141,\"bdeRecVersion\":4010,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-466\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-862\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-762\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-631\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8563,\"orderedBy\":\"orderedBy-126\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":2667,\"remnBaccBalMin\":6574,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [946] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[946] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [947] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[947] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":1271,\"bdeRecVersion\":7884,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-735\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-719\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-909\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-209\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4377,\"orderedBy\":\"orderedBy-891\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":7833,\"remnBaccBalMin\":1726,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [948] POST /doc-crm-issues — Issue Management API
run_request "[948] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-418\",\"advNr\":7977,\"allDayEvt\":true,\"attch\":\"attch-768\",\"bdeRecVersion\":3568,\"campgnTaskSeqNr\":8491,\"descn\":\"descn-437\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-970\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-326\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-122\",\"findingKey\":\"findingKey-317\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-799\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-270\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-591\",\"location\":\"location-352\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1245,\"orderedBy\":\"orderedBy-826\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":3381,\"qtyLinked\":3057,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-199\",\"subject\":\"subject-361\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-625\",\"undefBp\":\"undefBp-335\",\"val\":3869,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [949] GET /doc-crm-issues/{id} — Issue Management API
run_request "[949] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [950] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[950] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-274\",\"advNr\":6647,\"allDayEvt\":true,\"attch\":\"attch-543\",\"bdeRecVersion\":4386,\"campgnTaskSeqNr\":9136,\"descn\":\"descn-938\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-176\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-906\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-314\",\"findingKey\":\"findingKey-332\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-164\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-590\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-133\",\"location\":\"location-435\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8950,\"orderedBy\":\"orderedBy-747\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2455,\"qtyLinked\":4761,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-446\",\"subject\":\"subject-120\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-543\",\"undefBp\":\"undefBp-943\",\"val\":1072,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [951] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[951] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [952] GET /doc-letters/{id} — Letter API
run_request "[952] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [953] POST /doc-limits — Limit API
run_request "[953] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":9042,\"advTextCred\":\"advTextCred-901\",\"advTextDeb\":\"advTextDeb-406\",\"amount\":687184.51,\"bdeRecVersion\":7377,\"bookTextCred\":\"bookTextCred-402\",\"bookTextDeb\":\"bookTextDeb-958\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-377\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-238\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-444\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-263\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-474\",\"nextReview\":\"nextReview-598\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5862,\"orderedBy\":\"orderedBy-785\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [954] GET /doc-limits/{id} — Limit API
run_request "[954] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [955] PATCH /doc-limits/{id} — Limit API
run_request "[955] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":509,\"advTextCred\":\"advTextCred-236\",\"advTextDeb\":\"advTextDeb-340\",\"amount\":896154.13,\"bdeRecVersion\":9173,\"bookTextCred\":\"bookTextCred-300\",\"bookTextDeb\":\"bookTextDeb-699\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-227\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-610\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-919\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-366\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-599\",\"nextReview\":\"nextReview-693\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8539,\"orderedBy\":\"orderedBy-954\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [956] POST /doc-loans — Loan API
run_request "[956] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":1064,\"advTextCred\":\"advTextCred-171\",\"advTextDeb\":\"advTextDeb-437\",\"bdeRecVersion\":3680,\"bookTextCred\":\"bookTextCred-862\",\"bookTextDeb\":\"bookTextDeb-785\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-689\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-302\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-870\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-502\",\"intrGradManMarkup\":1085,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-783\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":2637,\"orderedBy\":\"orderedBy-167\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":7096,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [957] GET /doc-loans/{id} — Loan API
run_request "[957] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [958] PATCH /doc-loans/{id} — Loan API
run_request "[958] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":4050,\"advTextCred\":\"advTextCred-627\",\"advTextDeb\":\"advTextDeb-719\",\"bdeRecVersion\":6320,\"bookTextCred\":\"bookTextCred-156\",\"bookTextDeb\":\"bookTextDeb-345\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-911\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-585\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-179\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-437\",\"intrGradManMarkup\":9618,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-317\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":3480,\"orderedBy\":\"orderedBy-640\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8525,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [959] POST /doc-mass-settles — Mass Settlement API
run_request "[959] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":8990,\"autoFillList\":true,\"bdeRecVersion\":1853,\"benefBpText\":\"benefBpText-964\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-924\",\"destBankBic\":\"BFGEIT3F\",\"destBankBpText\":\"destBankBpText-312\",\"destBankClr\":\"destBankClr-165\",\"destBankText\":\"destBankText-899\",\"destBenefText\":\"destBenefText-164\",\"destInfo\":\"destInfo-743\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-272\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-673\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-360\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-852\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9334,\"orderedBy\":\"orderedBy-601\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [960] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[960] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [961] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[961] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":2249,\"autoFillList\":true,\"bdeRecVersion\":9580,\"benefBpText\":\"benefBpText-947\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-621\",\"destBankBic\":\"UBSWCHZH80A\",\"destBankBpText\":\"destBankBpText-504\",\"destBankClr\":\"destBankClr-876\",\"destBankText\":\"destBankText-421\",\"destBenefText\":\"destBenefText-702\",\"destInfo\":\"destInfo-444\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-184\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-825\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-586\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-864\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2116,\"orderedBy\":\"orderedBy-940\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [962] POST /doc-mmkts — Money Market API
run_request "[962] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":5967,\"bdeRecVersion\":3076,\"capt\":4820,\"dcdStrike\":4121,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-554\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-776\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-844\",\"intrRate\":7.577,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-712\",\"maturityDate\":\"2026-03-17\",\"mktRate\":3.675,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":822,\"orderedBy\":\"orderedBy-609\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6526,\"respBpA\":true,\"respObjA\":true,\"rmRate\":4.455,\"settlePlanA\":true,\"trdrRate\":2.375,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [963] GET /doc-mmkts/{id} — Money Market API
run_request "[963] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [964] PATCH /doc-mmkts/{id} — Money Market API
run_request "[964] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":8335,\"bdeRecVersion\":1045,\"capt\":8412,\"dcdStrike\":1377,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-118\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-414\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-577\",\"intrRate\":7.116,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-639\",\"maturityDate\":\"2026-03-17\",\"mktRate\":6.285,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9246,\"orderedBy\":\"orderedBy-315\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6153,\"respBpA\":true,\"respObjA\":true,\"rmRate\":6.53,\"settlePlanA\":true,\"trdrRate\":4.224,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [965] POST /doc-xfermons — Money Transfer API
run_request "[965] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":2761,\"amount\":573463.12,\"bdeRecVersion\":287,\"bulkItemIdent\":\"bulkItemIdent-911\",\"credAdvText\":\"credAdvText-972\",\"credBookText\":\"credBookText-627\",\"debAdvText\":\"debAdvText-463\",\"debBookText\":\"debBookText-730\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-496\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-726\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-259\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-605\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8935,\"orderedBy\":\"orderedBy-137\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [966] GET /doc-xfermons/{id} — Money Transfer API
run_request "[966] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [967] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[967] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":6224,\"amount\":754678.08,\"bdeRecVersion\":4021,\"bulkItemIdent\":\"bulkItemIdent-117\",\"credAdvText\":\"credAdvText-162\",\"credBookText\":\"credBookText-962\",\"debAdvText\":\"debAdvText-915\",\"debBookText\":\"debBookText-798\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-136\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-903\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-924\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-962\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8156,\"orderedBy\":\"orderedBy-922\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [968] POST /doc-oofxs — OTC FX Option API
run_request "[968] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":4695,\"advTextCred\":\"advTextCred-142\",\"advTextDeb\":\"advTextDeb-993\",\"bdeRecVersion\":3496,\"bookTextCred\":\"bookTextCred-601\",\"bookTextDeb\":\"bookTextDeb-832\",\"callQty\":5711,\"cutOffTime\":\"cutOffTime-635\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-846\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-727\",\"gross\":\"gross-596\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-870\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-800\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7594,\"orderedBy\":\"orderedBy-567\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-819\",\"putQty\":8118,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-964\",\"spread2\":\"spread2-579\",\"strike\":7927,\"strikePict\":3402,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [969] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[969] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [970] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[970] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":6885,\"advTextCred\":\"advTextCred-504\",\"advTextDeb\":\"advTextDeb-617\",\"bdeRecVersion\":7428,\"bookTextCred\":\"bookTextCred-638\",\"bookTextDeb\":\"bookTextDeb-300\",\"callQty\":9069,\"cutOffTime\":\"cutOffTime-330\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-923\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-411\",\"gross\":\"gross-489\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-858\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-708\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6735,\"orderedBy\":\"orderedBy-290\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-265\",\"putQty\":540,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-798\",\"spread2\":\"spread2-111\",\"strike\":5993,\"strikePict\":7094,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [971] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[971] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [972] GET /doc-otcopts/{id} — OTC Option API
run_request "[972] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [973] GET /doc-othsecs/{id} — Other Security API
run_request "[973] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [974] POST /doc-pays — Payment API
run_request "[974] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":6638,\"amount\":878744.63,\"bank\":\"bank-918\",\"bankAcc\":\"bankAcc-848\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-146\",\"bankCorr1\":\"bankCorr1-131\",\"bankCorr1Acc\":\"bankCorr1Acc-798\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-751\",\"bankCorr3\":\"bankCorr3-382\",\"bankCorr3Acc\":\"bankCorr3Acc-979\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-131\",\"bankCorr4\":\"bankCorr4-568\",\"bankCorr4Acc\":\"bankCorr4Acc-493\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-953\",\"bankInfo\":\"bankInfo-618\",\"bdeRecVersion\":4891,\"benef\":\"benef-867\",\"benefAcc\":\"benefAcc-265\",\"benefIban\":\"DE46132868613658902\",\"benefInfo\":\"benefInfo-604\",\"benefRefNr\":\"benefRefNr-472\",\"bookTextCred\":\"bookTextCred-299\",\"bookTextDeb\":\"bookTextDeb-967\",\"bulkItemIdent\":\"bulkItemIdent-939\",\"destCountry\":{\"id\":2,\"ident\":\"DE\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-639\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-590\",\"hasPostit\":true,\"instrAmount\":621353.95,\"intlRefNr\":\"intlRefNr-595\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"FR9029093599\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-251\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-117\",\"ordBankAcc\":\"ordBankAcc-613\",\"ordBankClearNr\":\"ordBankClearNr-195\",\"ordRef\":\"ordRef-880\",\"orderDate\":\"2026-03-17\",\"orderNr\":7202,\"orderedBy\":\"orderedBy-961\",\"orderedByAcc\":\"orderedByAcc-251\",\"origGrpRef\":\"origGrpRef-694\",\"originCountry\":{\"id\":2,\"ident\":\"DE\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-753\",\"stordPeriodEnd\":\"stordPeriodEnd-901\",\"stordPeriodStart\":\"stordPeriodStart-429\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39962724582\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [975] GET /doc-pays/{id} — Payment API
run_request "[975] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [976] PATCH /doc-pays/{id} — Payment API
run_request "[976] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":3577,\"amount\":113703.01,\"bank\":\"bank-295\",\"bankAcc\":\"bankAcc-613\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-790\",\"bankCorr1\":\"bankCorr1-519\",\"bankCorr1Acc\":\"bankCorr1Acc-616\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-159\",\"bankCorr3\":\"bankCorr3-667\",\"bankCorr3Acc\":\"bankCorr3Acc-954\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-558\",\"bankCorr4\":\"bankCorr4-209\",\"bankCorr4Acc\":\"bankCorr4Acc-485\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-490\",\"bankInfo\":\"bankInfo-196\",\"bdeRecVersion\":4134,\"benef\":\"benef-315\",\"benefAcc\":\"benefAcc-315\",\"benefIban\":\"CH87104791148982094\",\"benefInfo\":\"benefInfo-601\",\"benefRefNr\":\"benefRefNr-999\",\"bookTextCred\":\"bookTextCred-635\",\"bookTextDeb\":\"bookTextDeb-991\",\"bulkItemIdent\":\"bulkItemIdent-875\",\"destCountry\":{\"id\":2,\"ident\":\"DE\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-265\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-193\",\"hasPostit\":true,\"instrAmount\":851169.09,\"intlRefNr\":\"intlRefNr-272\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"CH1737548178\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-552\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-123\",\"ordBankAcc\":\"ordBankAcc-668\",\"ordBankClearNr\":\"ordBankClearNr-803\",\"ordRef\":\"ordRef-267\",\"orderDate\":\"2026-03-17\",\"orderNr\":5488,\"orderedBy\":\"orderedBy-143\",\"orderedByAcc\":\"orderedByAcc-897\",\"origGrpRef\":\"origGrpRef-998\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-947\",\"stordPeriodEnd\":\"stordPeriodEnd-698\",\"stordPeriodStart\":\"stordPeriodStart-305\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+41706585188\"}"

# [977] GET /doc-realsecs/{id} — Real Security API
run_request "[977] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [978] POST /doc-realtys — Realty API
run_request "[978] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":9647,\"bdeRecVersion\":5104,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-322\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-729\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-675\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-747\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1283,\"orderedBy\":\"orderedBy-729\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [979] GET /doc-realtys/{id} — Realty API
run_request "[979] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [980] PATCH /doc-realtys/{id} — Realty API
run_request "[980] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":6894,\"bdeRecVersion\":2128,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-190\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-980\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-413\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-221\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7362,\"orderedBy\":\"orderedBy-311\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [981] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[981] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":8633,\"bdeRecVersion\":5427,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-762\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-162\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-511\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-232\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7764,\"orderedBy\":\"orderedBy-582\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [982] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[982] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [983] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[983] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":3594,\"bdeRecVersion\":7158,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-430\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-473\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-681\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-737\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2943,\"orderedBy\":\"orderedBy-800\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [984] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[984] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [985] POST /doc-rebalss — Rebalancer Order API
run_request "[985] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":3451,\"bdeRecVersion\":6268,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-839\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-744\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-770\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-949\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6981,\"orderedBy\":\"orderedBy-192\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [986] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[986] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [987] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[987] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":4931,\"bdeRecVersion\":9168,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-133\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-119\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-815\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-397\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3954,\"orderedBy\":\"orderedBy-285\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [988] GET /doc-repocs/{id} — Repo Contract API
run_request "[988] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [1369] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[1369] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [1370] POST /doc-ctact2s — Contact Management (V2) API
run_request "[1370] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":8894,\"attch\":\"attch-734\",\"attchA\":true,\"bdeRecVersion\":759,\"campgnCltReaction\":\"campgnCltReaction-142\",\"campgnRespKey\":\"campgnRespKey-463\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-872\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-260\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-886\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-985\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-127\",\"linkDocListA\":true,\"loc\":\"loc-209\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9546,\"orderedBy\":\"orderedBy-661\",\"particListA\":true,\"questrSeqNr\":8764,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":6474,\"reactComment\":\"reactComment-689\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-917\",\"reactNrPartic\":5834,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-898\",\"subjA\":true,\"syncSeqNr\":4402,\"totExpndTimeM\":443,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1371] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1371] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [1372] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[1372] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":4667,\"attch\":\"attch-780\",\"attchA\":true,\"bdeRecVersion\":554,\"campgnCltReaction\":\"campgnCltReaction-716\",\"campgnRespKey\":\"campgnRespKey-465\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-974\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-112\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-863\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-344\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-228\",\"linkDocListA\":true,\"loc\":\"loc-667\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1830,\"orderedBy\":\"orderedBy-506\",\"particListA\":true,\"questrSeqNr\":4466,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":8930,\"reactComment\":\"reactComment-323\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-645\",\"reactNrPartic\":1180,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-570\",\"subjA\":true,\"syncSeqNr\":294,\"totExpndTimeM\":9790,\"trxDate\":\"2026-03-17\"}"

# [1373] GET /doc-cmgs/{id} — Cashier Management API
run_request "[1373] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [1374] GET /doc-cops/{id} — Cashier Operations API
run_request "[1374] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [1375] POST /doc-clts — Client Opening API
run_request "[1375] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1376] GET /doc-clts/{id} — Client Opening API
run_request "[1376] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [1377] PATCH /doc-clts/{id} — Client Opening API
run_request "[1377] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [1378] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[1378] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [1379] GET /doc-cltms/{id} — Collateral Movement API
run_request "[1379] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [1380] GET /doc-cords/{id} — Collective Order API
run_request "[1380] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [1381] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[1381] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [1382] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[1382] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [1383] POST /doc-xioms — External Investment Order Manager API
run_request "[1383] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":3504,\"bdeRecVersion\":5951,\"bpLevelRep\":true,\"descn\":\"descn-323\",\"extlRefNr\":\"extlRefNr-865\",\"extlRepLang\":\"extlRepLang-511\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-532\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-912\",\"linkGrp\":5481,\"orderDate\":\"2026-03-17\",\"orderNr\":5021,\"orderedBy\":\"orderedBy-484\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1384] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[1384] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [1385] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[1385] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":449,\"bdeRecVersion\":6929,\"bpLevelRep\":true,\"descn\":\"descn-650\",\"extlRefNr\":\"extlRefNr-290\",\"extlRepLang\":\"extlRepLang-292\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-726\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-712\",\"linkGrp\":5285,\"orderDate\":\"2026-03-17\",\"orderNr\":6695,\"orderedBy\":\"orderedBy-854\",\"sendRepToEbank\":true}"

# [1386] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[1386] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [1387] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[1387] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [1388] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[1388] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [1389] POST /doc-fxsws — FX Swap API
run_request "[1389] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-469\",\"bdeRecVersion\":731,\"buyBookText1\":\"buyBookText1-346\",\"buyBookText2\":\"buyBookText2-434\",\"buyQty1\":3422,\"buyQty2\":526,\"cfi\":\"cfi-472\",\"dealFwdRate1\":7.014,\"dealFwdRate2\":1.48,\"dealSpotRate1\":8.487,\"dealSpotRate2\":5.367,\"foDomiCountry\":{\"id\":5,\"ident\":\"AT\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"DE4086236269\",\"lastTrans\":\"lastTrans-641\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-490\",\"period1\":\"period1-290\",\"period2\":\"period2-611\",\"sellBookText1\":\"sellBookText1-781\",\"sellBookText2\":\"sellBookText2-988\",\"sellQty1\":4738,\"sellQty2\":1275,\"spotDate\":\"2026-03-17\",\"trdrRate1\":2.2,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1390] GET /doc-fxsws/{id} — FX Swap API
run_request "[1390] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [1391] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[1391] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-724\",\"bdeRecVersion\":8343,\"buyBookText1\":\"buyBookText1-941\",\"buyBookText2\":\"buyBookText2-403\",\"buyQty1\":3173,\"buyQty2\":3819,\"cfi\":\"cfi-468\",\"dealFwdRate1\":4.408,\"dealFwdRate2\":1.092,\"dealSpotRate1\":8.323,\"dealSpotRate2\":1.289,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"CH9824375490\",\"lastTrans\":\"lastTrans-934\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-710\",\"period1\":\"period1-950\",\"period2\":\"period2-852\",\"sellBookText1\":\"sellBookText1-541\",\"sellBookText2\":\"sellBookText2-444\",\"sellQty1\":7748,\"sellQty2\":5579,\"spotDate\":\"2026-03-17\",\"trdrRate1\":6.502,\"trxDate\":\"2026-03-17\"}"

# [1392] POST /doc-fxtrs — FXTR API
run_request "[1392] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":3244,\"advText\":\"advText-265\",\"bdeRecVersion\":6226,\"buyQty\":9840,\"dealFwdRate\":5.573,\"dealSpotRate\":2.837,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-900\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-652\",\"fwdSpread\":1479,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-779\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-517\",\"limit\":8309,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4258,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4914,\"orderedBy\":\"orderedBy-360\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-129\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":7911,\"settlePlanA\":true,\"spotSpread1\":7061,\"spotSpread2\":4312,\"trdrRate\":7.703,\"trigPrice\":4782,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39189182021\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1393] GET /doc-fxtrs/{id} — FXTR API
run_request "[1393] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [1394] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[1394] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":130,\"advText\":\"advText-885\",\"bdeRecVersion\":3459,\"buyQty\":3467,\"dealFwdRate\":6.341,\"dealSpotRate\":4.365,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-374\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-393\",\"fwdSpread\":7781,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-763\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-472\",\"limit\":5061,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":4202,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":3295,\"orderedBy\":\"orderedBy-110\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-706\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":4998,\"settlePlanA\":true,\"spotSpread1\":8580,\"spotSpread2\":2965,\"trdrRate\":5.183,\"trigPrice\":269,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39670993634\"}"

# [1395] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[1395] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [1396] POST /doc-inpays — Incoming Payment API
run_request "[1396] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":9236,\"amount\":477486.28,\"bankClearNr\":\"bankClearNr-159\",\"bankInfo\":\"bankInfo-915\",\"bdeRecVersion\":9033,\"benefAcc\":\"benefAcc-283\",\"benefRefNr\":\"benefRefNr-113\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-184\",\"contrPeriodStart\":\"contrPeriodStart-574\",\"credAddr\":\"credAddr-431\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-126\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-157\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-467\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-160\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-588\",\"orderDate\":\"2026-03-17\",\"orderNr\":2064,\"orderedBy\":\"orderedBy-542\",\"originCountry\":{\"id\":5,\"ident\":\"AT\"},\"payerAcc\":\"payerAcc-893\",\"payerAddrTxt\":\"payerAddrTxt-878\",\"payerIban\":\"CH45928912508396672\",\"payerInfo\":\"payerInfo-955\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-456\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1397] GET /doc-inpays/{id} — Incoming Payment API
run_request "[1397] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [1398] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[1398] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":2724,\"amount\":52636.78,\"bankClearNr\":\"bankClearNr-662\",\"bankInfo\":\"bankInfo-308\",\"bdeRecVersion\":5774,\"benefAcc\":\"benefAcc-159\",\"benefRefNr\":\"benefRefNr-967\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-466\",\"contrPeriodStart\":\"contrPeriodStart-334\",\"credAddr\":\"credAddr-207\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-902\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-681\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-251\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-640\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-499\",\"orderDate\":\"2026-03-17\",\"orderNr\":1988,\"orderedBy\":\"orderedBy-534\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payerAcc\":\"payerAcc-537\",\"payerAddrTxt\":\"payerAddrTxt-609\",\"payerIban\":\"CH83999866703250050\",\"payerInfo\":\"payerInfo-539\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-186\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1399] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[1399] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [1400] GET /doc-intrs/{id} — Interest API
run_request "[1400] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [1401] POST /doc-invst-bdls — Investment Bundler API
run_request "[1401] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":7460,\"bdeRecVersion\":7858,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-842\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-606\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-163\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-787\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":661,\"orderedBy\":\"orderedBy-199\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":1458,\"remnBaccBalMin\":4122,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1402] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1402] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [1403] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[1403] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":5454,\"bdeRecVersion\":4823,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-931\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-884\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-523\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-814\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2390,\"orderedBy\":\"orderedBy-749\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":4756,\"remnBaccBalMin\":1535,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1404] POST /doc-crm-issues — Issue Management API
run_request "[1404] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-197\",\"advNr\":5668,\"allDayEvt\":true,\"attch\":\"attch-493\",\"bdeRecVersion\":1374,\"campgnTaskSeqNr\":7203,\"descn\":\"descn-591\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-840\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-351\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-564\",\"findingKey\":\"findingKey-459\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-947\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-997\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-553\",\"location\":\"location-690\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":1096,\"orderedBy\":\"orderedBy-863\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":6179,\"qtyLinked\":584,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-322\",\"subject\":\"subject-624\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-887\",\"undefBp\":\"undefBp-727\",\"val\":6451,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1405] GET /doc-crm-issues/{id} — Issue Management API
run_request "[1405] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [1406] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[1406] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-683\",\"advNr\":1482,\"allDayEvt\":true,\"attch\":\"attch-249\",\"bdeRecVersion\":6672,\"campgnTaskSeqNr\":5411,\"descn\":\"descn-818\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-764\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-326\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-106\",\"findingKey\":\"findingKey-603\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-617\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-343\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-405\",\"location\":\"location-995\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8602,\"orderedBy\":\"orderedBy-555\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":4312,\"qtyLinked\":1553,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-909\",\"subject\":\"subject-535\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-868\",\"undefBp\":\"undefBp-467\",\"val\":4052,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1407] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[1407] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [1408] GET /doc-letters/{id} — Letter API
run_request "[1408] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# [1409] POST /doc-limits — Limit API
run_request "[1409] POST /doc-limits — Limit API" POST "http://localhost:8855/doc-limits" "{\"advNr\":9809,\"advTextCred\":\"advTextCred-481\",\"advTextDeb\":\"advTextDeb-735\",\"amount\":614853.91,\"bdeRecVersion\":1589,\"bookTextCred\":\"bookTextCred-671\",\"bookTextDeb\":\"bookTextDeb-305\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-305\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-402\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-369\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-367\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-491\",\"nextReview\":\"nextReview-852\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":8136,\"orderedBy\":\"orderedBy-406\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LIMITS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1410] GET /doc-limits/{id} — Limit API
run_request "[1410] GET /doc-limits/{id} — Limit API" GET "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" ''

# [1411] PATCH /doc-limits/{id} — Limit API
run_request "[1411] PATCH /doc-limits/{id} — Limit API" PATCH "http://localhost:8855/doc-limits/$ID_DOC_LIMITS" "{\"advNr\":5833,\"advTextCred\":\"advTextCred-836\",\"advTextDeb\":\"advTextDeb-237\",\"amount\":344448.88,\"bdeRecVersion\":9034,\"bookTextCred\":\"bookTextCred-886\",\"bookTextDeb\":\"bookTextDeb-974\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-413\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-343\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-792\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-965\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-883\",\"nextReview\":\"nextReview-335\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":5432,\"orderedBy\":\"orderedBy-873\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1412] POST /doc-loans — Loan API
run_request "[1412] POST /doc-loans — Loan API" POST "http://localhost:8855/doc-loans" "{\"advNr\":5937,\"advTextCred\":\"advTextCred-623\",\"advTextDeb\":\"advTextDeb-358\",\"bdeRecVersion\":6543,\"bookTextCred\":\"bookTextCred-250\",\"bookTextDeb\":\"bookTextDeb-871\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-231\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-884\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-829\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-524\",\"intrGradManMarkup\":392,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-884\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":9600,\"orderedBy\":\"orderedBy-951\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5777,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_LOANS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1413] GET /doc-loans/{id} — Loan API
run_request "[1413] GET /doc-loans/{id} — Loan API" GET "http://localhost:8855/doc-loans/$ID_DOC_LOANS" ''

# [1414] PATCH /doc-loans/{id} — Loan API
run_request "[1414] PATCH /doc-loans/{id} — Loan API" PATCH "http://localhost:8855/doc-loans/$ID_DOC_LOANS" "{\"advNr\":8458,\"advTextCred\":\"advTextCred-104\",\"advTextDeb\":\"advTextDeb-349\",\"bdeRecVersion\":4581,\"bookTextCred\":\"bookTextCred-725\",\"bookTextDeb\":\"bookTextDeb-181\",\"closeDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-972\",\"dueDate\":\"2026-03-17\",\"duration\":\"duration-952\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-899\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-577\",\"intrGradManMarkup\":8376,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-136\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":7476,\"orderedBy\":\"orderedBy-273\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":2519,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1415] POST /doc-mass-settles — Mass Settlement API
run_request "[1415] POST /doc-mass-settles — Mass Settlement API" POST "http://localhost:8855/doc-mass-settles" "{\"advNr\":9639,\"autoFillList\":true,\"bdeRecVersion\":466,\"benefBpText\":\"benefBpText-733\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-677\",\"destBankBic\":\"BFGEIT3F\",\"destBankBpText\":\"destBankBpText-400\",\"destBankClr\":\"destBankClr-174\",\"destBankText\":\"destBankText-573\",\"destBenefText\":\"destBenefText-949\",\"destInfo\":\"destInfo-832\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-344\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-652\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-576\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-646\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1688,\"orderedBy\":\"orderedBy-271\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MASS_SETTLES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1416] GET /doc-mass-settles/{id} — Mass Settlement API
run_request "[1416] GET /doc-mass-settles/{id} — Mass Settlement API" GET "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" ''

# [1417] PATCH /doc-mass-settles/{id} — Mass Settlement API
run_request "[1417] PATCH /doc-mass-settles/{id} — Mass Settlement API" PATCH "http://localhost:8855/doc-mass-settles/$ID_DOC_MASS_SETTLES" "{\"advNr\":6835,\"autoFillList\":true,\"bdeRecVersion\":5844,\"benefBpText\":\"benefBpText-437\",\"benefIsNoOwnsChg\":true,\"benefIsPrty\":true,\"benefSafe\":\"benefSafe-321\",\"destBankBic\":\"BFGEIT3F\",\"destBankBpText\":\"destBankBpText-856\",\"destBankClr\":\"destBankClr-742\",\"destBankText\":\"destBankText-488\",\"destBenefText\":\"destBenefText-597\",\"destInfo\":\"destInfo-262\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-302\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-324\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-860\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-898\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1890,\"orderedBy\":\"orderedBy-659\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1418] POST /doc-mmkts — Money Market API
run_request "[1418] POST /doc-mmkts — Money Market API" POST "http://localhost:8855/doc-mmkts" "{\"advNr\":4992,\"bdeRecVersion\":3778,\"capt\":9546,\"dcdStrike\":2101,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-152\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-729\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-752\",\"intrRate\":4.738,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-437\",\"maturityDate\":\"2026-03-17\",\"mktRate\":7.509,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6291,\"orderedBy\":\"orderedBy-861\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":5527,\"respBpA\":true,\"respObjA\":true,\"rmRate\":5.911,\"settlePlanA\":true,\"trdrRate\":6.036,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_MMKTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1419] GET /doc-mmkts/{id} — Money Market API
run_request "[1419] GET /doc-mmkts/{id} — Money Market API" GET "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" ''

# [1420] PATCH /doc-mmkts/{id} — Money Market API
run_request "[1420] PATCH /doc-mmkts/{id} — Money Market API" PATCH "http://localhost:8855/doc-mmkts/$ID_DOC_MMKTS" "{\"advNr\":4385,\"bdeRecVersion\":5377,\"capt\":8653,\"dcdStrike\":5643,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-273\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-472\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-150\",\"intrRate\":8.176,\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-427\",\"maturityDate\":\"2026-03-17\",\"mktRate\":2.336,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":2476,\"orderedBy\":\"orderedBy-916\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":8470,\"respBpA\":true,\"respObjA\":true,\"rmRate\":3.73,\"settlePlanA\":true,\"trdrRate\":7.429,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1421] POST /doc-xfermons — Money Transfer API
run_request "[1421] POST /doc-xfermons — Money Transfer API" POST "http://localhost:8855/doc-xfermons" "{\"advNr\":4584,\"amount\":130066.5,\"bdeRecVersion\":4305,\"bulkItemIdent\":\"bulkItemIdent-300\",\"credAdvText\":\"credAdvText-971\",\"credBookText\":\"credBookText-457\",\"debAdvText\":\"debAdvText-885\",\"debBookText\":\"debBookText-376\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-213\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-583\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-541\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-812\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9887,\"orderedBy\":\"orderedBy-799\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XFERMONS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1422] GET /doc-xfermons/{id} — Money Transfer API
run_request "[1422] GET /doc-xfermons/{id} — Money Transfer API" GET "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" ''

# [1423] PATCH /doc-xfermons/{id} — Money Transfer API
run_request "[1423] PATCH /doc-xfermons/{id} — Money Transfer API" PATCH "http://localhost:8855/doc-xfermons/$ID_DOC_XFERMONS" "{\"advNr\":3249,\"amount\":316276.49,\"bdeRecVersion\":5848,\"bulkItemIdent\":\"bulkItemIdent-259\",\"credAdvText\":\"credAdvText-238\",\"credBookText\":\"credBookText-820\",\"debAdvText\":\"debAdvText-357\",\"debBookText\":\"debBookText-385\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-448\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-591\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-757\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-198\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":9472,\"orderedBy\":\"orderedBy-526\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1424] POST /doc-oofxs — OTC FX Option API
run_request "[1424] POST /doc-oofxs — OTC FX Option API" POST "http://localhost:8855/doc-oofxs" "{\"advNr\":9805,\"advTextCred\":\"advTextCred-406\",\"advTextDeb\":\"advTextDeb-733\",\"bdeRecVersion\":1574,\"bookTextCred\":\"bookTextCred-307\",\"bookTextDeb\":\"bookTextDeb-543\",\"callQty\":5091,\"cutOffTime\":\"cutOffTime-690\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-533\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-762\",\"gross\":\"gross-489\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-543\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-977\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5337,\"orderedBy\":\"orderedBy-416\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-491\",\"putQty\":2155,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-358\",\"spread2\":\"spread2-760\",\"strike\":4386,\"strikePict\":3495,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_OOFXS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1425] GET /doc-oofxs/{id} — OTC FX Option API
run_request "[1425] GET /doc-oofxs/{id} — OTC FX Option API" GET "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" ''

# [1426] PATCH /doc-oofxs/{id} — OTC FX Option API
run_request "[1426] PATCH /doc-oofxs/{id} — OTC FX Option API" PATCH "http://localhost:8855/doc-oofxs/$ID_DOC_OOFXS" "{\"advNr\":6440,\"advTextCred\":\"advTextCred-658\",\"advTextDeb\":\"advTextDeb-719\",\"bdeRecVersion\":1753,\"bookTextCred\":\"bookTextCred-640\",\"bookTextDeb\":\"bookTextDeb-825\",\"callQty\":6888,\"cutOffTime\":\"cutOffTime-171\",\"dateCalcMtd\":\"2026-03-17\",\"dlvDate\":\"2026-03-17\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-727\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-637\",\"gross\":\"gross-224\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-813\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-147\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5955,\"orderedBy\":\"orderedBy-251\",\"perfDate\":\"2026-03-17\",\"prem\":\"prem-999\",\"putQty\":2098,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"spread1\":\"spread1-363\",\"spread2\":\"spread2-696\",\"strike\":196,\"strikePict\":9602,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1427] GET /doc-ooots/{id} — OTC Option on Securities API
run_request "[1427] GET /doc-ooots/{id} — OTC Option on Securities API" GET "http://localhost:8855/doc-ooots/$ID_DOC_OOOTS" ''

# [1428] GET /doc-otcopts/{id} — OTC Option API
run_request "[1428] GET /doc-otcopts/{id} — OTC Option API" GET "http://localhost:8855/doc-otcopts/$ID_DOC_OTCOPTS" ''

# [1429] GET /doc-othsecs/{id} — Other Security API
run_request "[1429] GET /doc-othsecs/{id} — Other Security API" GET "http://localhost:8855/doc-othsecs/$ID_DOC_OTHSECS" ''

# [1430] POST /doc-pays — Payment API
run_request "[1430] POST /doc-pays — Payment API" POST "http://localhost:8855/doc-pays" "{\"advNr\":3252,\"amount\":942503.48,\"bank\":\"bank-362\",\"bankAcc\":\"bankAcc-610\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-137\",\"bankCorr1\":\"bankCorr1-567\",\"bankCorr1Acc\":\"bankCorr1Acc-559\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-377\",\"bankCorr3\":\"bankCorr3-876\",\"bankCorr3Acc\":\"bankCorr3Acc-679\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-375\",\"bankCorr4\":\"bankCorr4-329\",\"bankCorr4Acc\":\"bankCorr4Acc-751\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-997\",\"bankInfo\":\"bankInfo-855\",\"bdeRecVersion\":3679,\"benef\":\"benef-486\",\"benefAcc\":\"benefAcc-257\",\"benefIban\":\"DE15700888392672057\",\"benefInfo\":\"benefInfo-421\",\"benefRefNr\":\"benefRefNr-458\",\"bookTextCred\":\"bookTextCred-336\",\"bookTextDeb\":\"bookTextDeb-784\",\"bulkItemIdent\":\"bulkItemIdent-404\",\"destCountry\":{\"id\":5,\"ident\":\"AT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-505\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-592\",\"hasPostit\":true,\"instrAmount\":391257.54,\"intlRefNr\":\"intlRefNr-499\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"US8659984629\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-892\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-145\",\"ordBankAcc\":\"ordBankAcc-492\",\"ordBankClearNr\":\"ordBankClearNr-120\",\"ordRef\":\"ordRef-660\",\"orderDate\":\"2026-03-17\",\"orderNr\":2292,\"orderedBy\":\"orderedBy-361\",\"orderedByAcc\":\"orderedByAcc-615\",\"origGrpRef\":\"origGrpRef-195\",\"originCountry\":{\"id\":1,\"ident\":\"CH\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-644\",\"stordPeriodEnd\":\"stordPeriodEnd-803\",\"stordPeriodStart\":\"stordPeriodStart-821\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+49487125079\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_PAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1431] GET /doc-pays/{id} — Payment API
run_request "[1431] GET /doc-pays/{id} — Payment API" GET "http://localhost:8855/doc-pays/$ID_DOC_PAYS" ''

# [1432] PATCH /doc-pays/{id} — Payment API
run_request "[1432] PATCH /doc-pays/{id} — Payment API" PATCH "http://localhost:8855/doc-pays/$ID_DOC_PAYS" "{\"advNr\":2330,\"amount\":612987.69,\"bank\":\"bank-225\",\"bankAcc\":\"bankAcc-145\",\"bankAccA\":true,\"bankBpA\":true,\"bankClearNr\":\"bankClearNr-467\",\"bankCorr1\":\"bankCorr1-515\",\"bankCorr1Acc\":\"bankCorr1Acc-654\",\"bankCorr1ClearNr\":\"bankCorr1ClearNr-829\",\"bankCorr3\":\"bankCorr3-166\",\"bankCorr3Acc\":\"bankCorr3Acc-814\",\"bankCorr3ClearNr\":\"bankCorr3ClearNr-548\",\"bankCorr4\":\"bankCorr4-362\",\"bankCorr4Acc\":\"bankCorr4Acc-425\",\"bankCorr4ClearNr\":\"bankCorr4ClearNr-761\",\"bankInfo\":\"bankInfo-890\",\"bdeRecVersion\":6456,\"benef\":\"benef-989\",\"benefAcc\":\"benefAcc-310\",\"benefIban\":\"IT99878384834554410\",\"benefInfo\":\"benefInfo-891\",\"benefRefNr\":\"benefRefNr-455\",\"bookTextCred\":\"bookTextCred-457\",\"bookTextDeb\":\"bookTextDeb-336\",\"bulkItemIdent\":\"bulkItemIdent-641\",\"destCountry\":{\"id\":5,\"ident\":\"AT\"},\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-417\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-859\",\"hasPostit\":true,\"instrAmount\":415965.57,\"intlRefNr\":\"intlRefNr-407\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isInstant\":\"DE2545849531\",\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-365\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordBank\":\"ordBank-449\",\"ordBankAcc\":\"ordBankAcc-102\",\"ordBankClearNr\":\"ordBankClearNr-521\",\"ordRef\":\"ordRef-793\",\"orderDate\":\"2026-03-17\",\"orderNr\":8547,\"orderedBy\":\"orderedBy-201\",\"orderedByAcc\":\"orderedByAcc-118\",\"origGrpRef\":\"origGrpRef-537\",\"originCountry\":{\"id\":3,\"ident\":\"IT\"},\"payChrgA\":true,\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"stordDeactiv\":true,\"stordGrp\":\"stordGrp-896\",\"stordPeriodEnd\":\"stordPeriodEnd-118\",\"stordPeriodStart\":\"stordPeriodStart-353\",\"stordRefDate\":\"2026-03-17\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"valDateCred\":\"2026-03-17\",\"valDateDeb\":\"2026-03-17\",\"xrateList\":\"+39812577330\"}"

# [1433] GET /doc-realsecs/{id} — Real Security API
run_request "[1433] GET /doc-realsecs/{id} — Real Security API" GET "http://localhost:8855/doc-realsecs/$ID_DOC_REALSECS" ''

# [1434] POST /doc-realtys — Realty API
run_request "[1434] POST /doc-realtys — Realty API" POST "http://localhost:8855/doc-realtys" "{\"advNr\":3069,\"bdeRecVersion\":4155,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-872\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-100\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-497\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-745\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":8245,\"orderedBy\":\"orderedBy-767\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REALTYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1435] GET /doc-realtys/{id} — Realty API
run_request "[1435] GET /doc-realtys/{id} — Realty API" GET "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" ''

# [1436] PATCH /doc-realtys/{id} — Realty API
run_request "[1436] PATCH /doc-realtys/{id} — Realty API" PATCH "http://localhost:8855/doc-realtys/$ID_DOC_REALTYS" "{\"advNr\":8511,\"bdeRecVersion\":7549,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-590\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-175\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-959\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-383\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4702,\"orderedBy\":\"orderedBy-138\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1437] POST /doc-rebalps — Rebalancer Investment Proposition API
run_request "[1437] POST /doc-rebalps — Rebalancer Investment Proposition API" POST "http://localhost:8855/doc-rebalps" "{\"advNr\":3570,\"bdeRecVersion\":5097,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-501\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-829\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-507\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-977\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7395,\"orderedBy\":\"orderedBy-965\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALPS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1438] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1438] GET /doc-rebalps/{id} — Rebalancer Investment Proposition API" GET "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" ''

# [1439] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API
run_request "[1439] PATCH /doc-rebalps/{id} — Rebalancer Investment Proposition API" PATCH "http://localhost:8855/doc-rebalps/$ID_DOC_REBALPS" "{\"advNr\":2469,\"bdeRecVersion\":1794,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-232\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-102\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-527\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-944\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":6005,\"orderedBy\":\"orderedBy-796\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [1440] GET /doc-rebalms/{id} — Rebalancer Master API
run_request "[1440] GET /doc-rebalms/{id} — Rebalancer Master API" GET "http://localhost:8855/doc-rebalms/$ID_DOC_REBALMS" ''

# [1441] POST /doc-rebalss — Rebalancer Order API
run_request "[1441] POST /doc-rebalss — Rebalancer Order API" POST "http://localhost:8855/doc-rebalss" "{\"advNr\":7411,\"bdeRecVersion\":2827,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-571\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-999\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-449\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-313\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7266,\"orderedBy\":\"orderedBy-712\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_REBALSS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [1442] GET /doc-rebalss/{id} — Rebalancer Order API
run_request "[1442] GET /doc-rebalss/{id} — Rebalancer Order API" GET "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" ''

# [1443] PATCH /doc-rebalss/{id} — Rebalancer Order API
run_request "[1443] PATCH /doc-rebalss/{id} — Rebalancer Order API" PATCH "http://localhost:8855/doc-rebalss/$ID_DOC_REBALSS" "{\"advNr\":9887,\"bdeRecVersion\":1477,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-434\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-195\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-228\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-698\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":4028,\"orderedBy\":\"orderedBy-651\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [1444] GET /doc-repocs/{id} — Repo Contract API
run_request "[1444] GET /doc-repocs/{id} — Repo Contract API" GET "http://localhost:8855/doc-repocs/$ID_DOC_REPOCS" ''

# [229] GET /doc-sectrx2s/{id} — Security Event Transaction API
run_request "[229] GET /doc-sectrx2s/{id} — Security Event Transaction API" GET "http://localhost:8855/doc-sectrx2s/$ID_DOC_SECTRX2S" ''

# [230] POST /doc-ctact2s — Contact Management (V2) API
run_request "[230] POST /doc-ctact2s — Contact Management (V2) API" POST "http://localhost:8855/doc-ctact2s" "{\"addrA\":true,\"advNr\":7672,\"attch\":\"attch-169\",\"attchA\":true,\"bdeRecVersion\":2042,\"campgnCltReaction\":\"campgnCltReaction-424\",\"campgnRespKey\":\"campgnRespKey-585\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-477\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-985\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-578\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-523\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-544\",\"linkDocListA\":true,\"loc\":\"loc-378\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1207,\"orderedBy\":\"orderedBy-173\",\"particListA\":true,\"questrSeqNr\":568,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":3255,\"reactComment\":\"reactComment-902\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-527\",\"reactNrPartic\":3524,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-553\",\"subjA\":true,\"syncSeqNr\":4799,\"totExpndTimeM\":8949,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CTACT2S=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [231] GET /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[231] GET /doc-ctact2s/{id} — Contact Management (V2) API" GET "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" ''

# [232] PATCH /doc-ctact2s/{id} — Contact Management (V2) API
run_request "[232] PATCH /doc-ctact2s/{id} — Contact Management (V2) API" PATCH "http://localhost:8855/doc-ctact2s/$ID_DOC_CTACT2S" "{\"addrA\":true,\"advNr\":4893,\"attch\":\"attch-666\",\"attchA\":true,\"bdeRecVersion\":8039,\"campgnCltReaction\":\"campgnCltReaction-125\",\"campgnRespKey\":\"campgnRespKey-649\",\"chanA\":true,\"cltListA\":true,\"contentLong\":\"contentLong-328\",\"ctactAreaA\":true,\"ctactEndDate\":\"2026-03-17\",\"ctactEndDateA\":\"2026-03-17\",\"ctactMediumA\":true,\"ctactStartDate\":\"2026-03-17\",\"ctactStartDateA\":\"2026-03-17\",\"ctactSubTypeA\":true,\"ctactTypeA\":true,\"dirA\":true,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-422\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expiryDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-322\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-271\",\"involObjListA\":true,\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-208\",\"linkDocListA\":true,\"loc\":\"loc-591\",\"locA\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5143,\"orderedBy\":\"orderedBy-292\",\"particListA\":true,\"questrSeqNr\":1961,\"reactCampgnDocA\":true,\"reactCampgnSeqNr\":1509,\"reactComment\":\"reactComment-426\",\"reactDate\":\"2026-03-17\",\"reactLoc\":\"reactLoc-920\",\"reactNrPartic\":9555,\"respBpA\":true,\"respDeptA\":true,\"respObjA\":true,\"subj\":\"subj-875\",\"subjA\":true,\"syncSeqNr\":2311,\"totExpndTimeM\":3297,\"trxDate\":\"2026-03-17\"}"

# [233] GET /doc-cmgs/{id} — Cashier Management API
run_request "[233] GET /doc-cmgs/{id} — Cashier Management API" GET "http://localhost:8855/doc-cmgs/$ID_DOC_CMGS" ''

# [234] GET /doc-cops/{id} — Cashier Operations API
run_request "[234] GET /doc-cops/{id} — Cashier Operations API" GET "http://localhost:8855/doc-cops/$ID_DOC_COPS" ''

# [235] POST /doc-clts — Client Opening API
run_request "[235] POST /doc-clts — Client Opening API" POST "http://localhost:8855/doc-clts" "{}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CLTS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [236] GET /doc-clts/{id} — Client Opening API
run_request "[236] GET /doc-clts/{id} — Client Opening API" GET "http://localhost:8855/doc-clts/$ID_DOC_CLTS" ''

# [237] PATCH /doc-clts/{id} — Client Opening API
run_request "[237] PATCH /doc-clts/{id} — Client Opening API" PATCH "http://localhost:8855/doc-clts/$ID_DOC_CLTS" "{}"

# [238] GET /doc-cltas/{id} — Collateral Agreement API
run_request "[238] GET /doc-cltas/{id} — Collateral Agreement API" GET "http://localhost:8855/doc-cltas/$ID_DOC_CLTAS" ''

# [239] GET /doc-cltms/{id} — Collateral Movement API
run_request "[239] GET /doc-cltms/{id} — Collateral Movement API" GET "http://localhost:8855/doc-cltms/$ID_DOC_CLTMS" ''

# [240] GET /doc-cords/{id} — Collective Order API
run_request "[240] GET /doc-cords/{id} — Collective Order API" GET "http://localhost:8855/doc-cords/$ID_DOC_CORDS" ''

# [241] GET /doc-cdss/{id} — Credit Default Swap API
run_request "[241] GET /doc-cdss/{id} — Credit Default Swap API" GET "http://localhost:8855/doc-cdss/$ID_DOC_CDSS" ''

# [242] GET /doc-dcds/{id} — Dual Currency Investment API
run_request "[242] GET /doc-dcds/{id} — Dual Currency Investment API" GET "http://localhost:8855/doc-dcds/$ID_DOC_DCDS" ''

# [243] POST /doc-xioms — External Investment Order Manager API
run_request "[243] POST /doc-xioms — External Investment Order Manager API" POST "http://localhost:8855/doc-xioms" "{\"advNr\":8127,\"bdeRecVersion\":8110,\"bpLevelRep\":true,\"descn\":\"descn-566\",\"extlRefNr\":\"extlRefNr-691\",\"extlRepLang\":\"extlRepLang-795\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-391\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-713\",\"linkGrp\":8565,\"orderDate\":\"2026-03-17\",\"orderNr\":6662,\"orderedBy\":\"orderedBy-378\",\"sendRepToEbank\":true}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_XIOMS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [244] GET /doc-xioms/{id} — External Investment Order Manager API
run_request "[244] GET /doc-xioms/{id} — External Investment Order Manager API" GET "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" ''

# [245] PATCH /doc-xioms/{id} — External Investment Order Manager API
run_request "[245] PATCH /doc-xioms/{id} — External Investment Order Manager API" PATCH "http://localhost:8855/doc-xioms/$ID_DOC_XIOMS" "{\"advNr\":3773,\"bdeRecVersion\":9895,\"bpLevelRep\":true,\"descn\":\"descn-957\",\"extlRefNr\":\"extlRefNr-272\",\"extlRepLang\":\"extlRepLang-425\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-948\",\"isDel\":true,\"isFinal\":true,\"lastTrans\":\"lastTrans-249\",\"linkGrp\":6608,\"orderDate\":\"2026-03-17\",\"orderNr\":2881,\"orderedBy\":\"orderedBy-624\",\"sendRepToEbank\":true}"

# [246] GET /doc-xferfees/{id} — Fee Transfer API
run_request "[246] GET /doc-xferfees/{id} — Fee Transfer API" GET "http://localhost:8855/doc-xferfees/$ID_DOC_XFERFEES" ''

# [247] GET /doc-fidds/{id} — Fiduciary Deposit API
run_request "[247] GET /doc-fidds/{id} — Fiduciary Deposit API" GET "http://localhost:8855/doc-fidds/$ID_DOC_FIDDS" ''

# [248] GET /doc-fras/{id} — Forward Rate Agreement API
run_request "[248] GET /doc-fras/{id} — Forward Rate Agreement API" GET "http://localhost:8855/doc-fras/$ID_DOC_FRAS" ''

# [249] POST /doc-fxsws — FX Swap API
run_request "[249] POST /doc-fxsws — FX Swap API" POST "http://localhost:8855/doc-fxsws" "{\"advText\":\"advText-436\",\"bdeRecVersion\":9180,\"buyBookText1\":\"buyBookText1-804\",\"buyBookText2\":\"buyBookText2-390\",\"buyQty1\":4634,\"buyQty2\":9880,\"cfi\":\"cfi-657\",\"dealFwdRate1\":0.406,\"dealFwdRate2\":4.498,\"dealSpotRate1\":1.245,\"dealSpotRate2\":7.498,\"foDomiCountry\":{\"id\":7,\"ident\":\"US\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"US3926763475\",\"lastTrans\":\"lastTrans-815\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-414\",\"period1\":\"period1-718\",\"period2\":\"period2-204\",\"sellBookText1\":\"sellBookText1-317\",\"sellBookText2\":\"sellBookText2-535\",\"sellQty1\":6189,\"sellQty2\":75,\"spotDate\":\"2026-03-17\",\"trdrRate1\":0.839,\"trxDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXSWS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [250] GET /doc-fxsws/{id} — FX Swap API
run_request "[250] GET /doc-fxsws/{id} — FX Swap API" GET "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" ''

# [251] PATCH /doc-fxsws/{id} — FX Swap API
run_request "[251] PATCH /doc-fxsws/{id} — FX Swap API" PATCH "http://localhost:8855/doc-fxsws/$ID_DOC_FXSWS" "{\"advText\":\"advText-235\",\"bdeRecVersion\":2139,\"buyBookText1\":\"buyBookText1-216\",\"buyBookText2\":\"buyBookText2-113\",\"buyQty1\":1145,\"buyQty2\":1887,\"cfi\":\"cfi-678\",\"dealFwdRate1\":3.271,\"dealFwdRate2\":7.989,\"dealSpotRate1\":8.223,\"dealSpotRate2\":2.833,\"foDomiCountry\":{\"id\":2,\"ident\":\"DE\"},\"isFinal\":true,\"isUnevenswap\":true,\"isin\":\"GB6242130082\",\"lastTrans\":\"lastTrans-412\",\"maturityDate1\":\"2026-03-17\",\"maturityDate2\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderedBy\":\"orderedBy-694\",\"period1\":\"period1-435\",\"period2\":\"period2-398\",\"sellBookText1\":\"sellBookText1-348\",\"sellBookText2\":\"sellBookText2-598\",\"sellQty1\":6228,\"sellQty2\":426,\"spotDate\":\"2026-03-17\",\"trdrRate1\":5.69,\"trxDate\":\"2026-03-17\"}"

# [252] POST /doc-fxtrs — FXTR API
run_request "[252] POST /doc-fxtrs — FXTR API" POST "http://localhost:8855/doc-fxtrs" "{\"advNr\":2058,\"advText\":\"advText-764\",\"bdeRecVersion\":2336,\"buyQty\":9544,\"dealFwdRate\":3.531,\"dealSpotRate\":3.343,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-113\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-638\",\"fwdSpread\":4293,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-419\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-769\",\"limit\":8655,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":8009,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5881,\"orderedBy\":\"orderedBy-578\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-214\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":3313,\"settlePlanA\":true,\"spotSpread1\":685,\"spotSpread2\":509,\"trdrRate\":6.185,\"trigPrice\":3643,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+44613938719\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_FXTRS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [253] GET /doc-fxtrs/{id} — FXTR API
run_request "[253] GET /doc-fxtrs/{id} — FXTR API" GET "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" ''

# [254] PATCH /doc-fxtrs/{id} — FXTR API
run_request "[254] PATCH /doc-fxtrs/{id} — FXTR API" PATCH "http://localhost:8855/doc-fxtrs/$ID_DOC_FXTRS" "{\"advNr\":4686,\"advText\":\"advText-892\",\"bdeRecVersion\":4778,\"buyQty\":1563,\"dealFwdRate\":2.969,\"dealSpotRate\":5.663,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-966\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-498\",\"fwdSpread\":7210,\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-239\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-454\",\"limit\":4047,\"maturityDate\":\"2026-03-17\",\"mktFwdBps\":8367,\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":7473,\"orderedBy\":\"orderedBy-287\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"period\":\"period-196\",\"respBpA\":true,\"respObjA\":true,\"sellQty\":6845,\"settlePlanA\":true,\"spotSpread1\":5513,\"spotSpread2\":7065,\"trdrRate\":5.497,\"trigPrice\":2424,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\",\"xrateList\":\"+39206157969\"}"

# [255] GET /doc-guarcreds/{id} — Guarantee Credit API
run_request "[255] GET /doc-guarcreds/{id} — Guarantee Credit API" GET "http://localhost:8855/doc-guarcreds/$ID_DOC_GUARCREDS" ''

# [256] POST /doc-inpays — Incoming Payment API
run_request "[256] POST /doc-inpays — Incoming Payment API" POST "http://localhost:8855/doc-inpays" "{\"advNr\":2094,\"amount\":285239.52,\"bankClearNr\":\"bankClearNr-503\",\"bankInfo\":\"bankInfo-448\",\"bdeRecVersion\":4104,\"benefAcc\":\"benefAcc-549\",\"benefRefNr\":\"benefRefNr-781\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-868\",\"contrPeriodStart\":\"contrPeriodStart-390\",\"credAddr\":\"credAddr-947\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-215\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-621\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-750\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-750\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-419\",\"orderDate\":\"2026-03-17\",\"orderNr\":1285,\"orderedBy\":\"orderedBy-420\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payerAcc\":\"payerAcc-705\",\"payerAddrTxt\":\"payerAddrTxt-968\",\"payerIban\":\"AT52516265115576647\",\"payerInfo\":\"payerInfo-234\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-425\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INPAYS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [257] GET /doc-inpays/{id} — Incoming Payment API
run_request "[257] GET /doc-inpays/{id} — Incoming Payment API" GET "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" ''

# [258] PATCH /doc-inpays/{id} — Incoming Payment API
run_request "[258] PATCH /doc-inpays/{id} — Incoming Payment API" PATCH "http://localhost:8855/doc-inpays/$ID_DOC_INPAYS" "{\"advNr\":4968,\"amount\":68572.08,\"bankClearNr\":\"bankClearNr-320\",\"bankInfo\":\"bankInfo-448\",\"bdeRecVersion\":795,\"benefAcc\":\"benefAcc-991\",\"benefRefNr\":\"benefRefNr-165\",\"contrDeactiv\":true,\"contrEnd\":\"contrEnd-399\",\"contrPeriodStart\":\"contrPeriodStart-898\",\"credAddr\":\"credAddr-931\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-505\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-809\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-385\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-385\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"ordRef\":\"ordRef-543\",\"orderDate\":\"2026-03-17\",\"orderNr\":1701,\"orderedBy\":\"orderedBy-899\",\"originCountry\":{\"id\":6,\"ident\":\"GB\"},\"payerAcc\":\"payerAcc-570\",\"payerAddrTxt\":\"payerAddrTxt-382\",\"payerIban\":\"AT20635424198554632\",\"payerInfo\":\"payerInfo-889\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"respBpA\":true,\"respObjA\":true,\"retExtlRefNr\":\"retExtlRefNr-973\",\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [259] GET /doc-irss/{id} — Interest Rate Swap API
run_request "[259] GET /doc-irss/{id} — Interest Rate Swap API" GET "http://localhost:8855/doc-irss/$ID_DOC_IRSS" ''

# [260] GET /doc-intrs/{id} — Interest API
run_request "[260] GET /doc-intrs/{id} — Interest API" GET "http://localhost:8855/doc-intrs/$ID_DOC_INTRS" ''

# [261] POST /doc-invst-bdls — Investment Bundler API
run_request "[261] POST /doc-invst-bdls — Investment Bundler API" POST "http://localhost:8855/doc-invst-bdls" "{\"advNr\":9987,\"bdeRecVersion\":4087,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-437\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-179\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-691\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-949\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":5760,\"orderedBy\":\"orderedBy-730\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":1007,\"remnBaccBalMin\":8208,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_INVST_BDLS=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [262] GET /doc-invst-bdls/{id} — Investment Bundler API
run_request "[262] GET /doc-invst-bdls/{id} — Investment Bundler API" GET "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" ''

# [263] PATCH /doc-invst-bdls/{id} — Investment Bundler API
run_request "[263] PATCH /doc-invst-bdls/{id} — Investment Bundler API" PATCH "http://localhost:8855/doc-invst-bdls/$ID_DOC_INVST_BDLS" "{\"advNr\":9260,\"bdeRecVersion\":7510,\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-525\",\"dueDate\":\"2026-03-17\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-922\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-622\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRevs\":true,\"isaRelv\":true,\"lastTrans\":\"lastTrans-587\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"orderDate\":\"2026-03-17\",\"orderNr\":1147,\"orderedBy\":\"orderedBy-713\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"remnBaccBalMax\":2352,\"remnBaccBalMin\":9258,\"respBpA\":true,\"respObjA\":true,\"settlePlanA\":true,\"trxDate\":\"2026-03-17\",\"valDate\":\"2026-03-17\"}"

# [264] POST /doc-crm-issues — Issue Management API
run_request "[264] POST /doc-crm-issues — Issue Management API" POST "http://localhost:8855/doc-crm-issues" "{\"_ident\":\"_ident-194\",\"advNr\":7610,\"allDayEvt\":true,\"attch\":\"attch-945\",\"bdeRecVersion\":293,\"campgnTaskSeqNr\":9850,\"descn\":\"descn-314\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-379\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-864\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-285\",\"findingKey\":\"findingKey-736\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-894\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-708\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-979\",\"location\":\"location-995\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":510,\"orderedBy\":\"orderedBy-108\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":3127,\"qtyLinked\":9836,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-773\",\"subject\":\"subject-614\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-831\",\"undefBp\":\"undefBp-660\",\"val\":8827,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"
if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then
  ID_DOC_CRM_ISSUES=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")
fi

# [265] GET /doc-crm-issues/{id} — Issue Management API
run_request "[265] GET /doc-crm-issues/{id} — Issue Management API" GET "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" ''

# [266] PATCH /doc-crm-issues/{id} — Issue Management API
run_request "[266] PATCH /doc-crm-issues/{id} — Issue Management API" PATCH "http://localhost:8855/doc-crm-issues/$ID_DOC_CRM_ISSUES" "{\"_ident\":\"_ident-549\",\"advNr\":3803,\"allDayEvt\":true,\"attch\":\"attch-856\",\"bdeRecVersion\":7581,\"campgnTaskSeqNr\":8902,\"descn\":\"descn-179\",\"docBlockA\":true,\"docPrcInfoRemark\":\"docPrcInfoRemark-913\",\"dueDate\":\"2026-03-17\",\"endTime\":\"endTime-657\",\"enteredVmDate\":\"2026-03-17\",\"expirDate\":\"2026-03-17\",\"expirDateA\":\"2026-03-17\",\"extlRefNr\":\"extlRefNr-570\",\"findingKey\":\"findingKey-245\",\"firstRemindDate\":\"2026-03-17\",\"hasPostit\":true,\"intlRefNr\":\"intlRefNr-571\",\"isBackdt\":true,\"isDel\":true,\"isFinal\":true,\"isRefIssue\":true,\"isRevs\":true,\"isaRelv\":true,\"issueNote\":\"issueNote-720\",\"issuerA\":true,\"issuerDeptA\":true,\"issuerDeptObjA\":true,\"lastRemindDate\":\"2026-03-17\",\"lastTrans\":\"lastTrans-279\",\"location\":\"location-167\",\"notBonusRelv\":true,\"notBonusWidrwRelv\":true,\"notReconStornoRelv\":true,\"notWidrwRelv\":true,\"openDate\":\"2026-03-17\",\"orderDate\":\"2026-03-17\",\"orderNr\":4320,\"orderedBy\":\"orderedBy-670\",\"perfDate\":\"2026-03-17\",\"perfDateA\":\"2026-03-17\",\"qty\":599,\"qtyLinked\":6941,\"refDate\":\"2026-03-17\",\"respBpA\":true,\"respDeptA\":true,\"respDeptObjA\":true,\"respObjA\":true,\"settlePlanA\":true,\"startDate\":\"2026-03-17\",\"startTime\":\"startTime-375\",\"subject\":\"subject-742\",\"trxDate\":\"2026-03-17\",\"trxDateA\":\"2026-03-17\",\"undefAsset\":\"undefAsset-617\",\"undefBp\":\"undefBp-928\",\"val\":4934,\"valDate\":\"2026-03-17\",\"valDateA\":\"2026-03-17\"}"

# [267] GET /doc-ledgers/{id} — Ledger Transfer API
run_request "[267] GET /doc-ledgers/{id} — Ledger Transfer API" GET "http://localhost:8855/doc-ledgers/$ID_DOC_LEDGERS" ''

# [268] GET /doc-letters/{id} — Letter API
run_request "[268] GET /doc-letters/{id} — Letter API" GET "http://localhost:8855/doc-letters/$ID_DOC_LETTERS" ''

# ── SUMMARY + HTML REPORT ────────────────────────────────────
TOTAL_CALC=$((PASS+FAIL))
echo ""
echo -e "Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total"

PCT=0
[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))

# ── Write HTML report ──────────────────────────────────────
cat > "$REPORT_FILE" << HTMLEOF
<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>
<title>Capi Test Report · Part 4</title>
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
<h1>🧪 Capi Test Report <span style='color:#8b949e;font-size:14px'>Part 4 / 8</span></h1>
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