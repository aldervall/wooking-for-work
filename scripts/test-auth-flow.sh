#!/bin/bash
set -e

BASE="http://localhost:3002"
COOKIE_JAR="/tmp/test-auth-cookies.txt"
PASS=0
FAIL=0

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$COOKIE_JAR"
}

# Source .env for CREDENTIAL_ENCRYPTION_KEY (credentials tests)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Start server in background
echo "Starting server..."
node src/server.js &
SERVER_PID=$!
sleep 2

assert_status() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $desc (status $actual)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $desc — expected $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

assert_body_contains() {
  local desc="$1" body="$2" pattern="$3"
  if echo "$body" | grep -q "$pattern"; then
    echo "  ✅ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $desc — expected body to contain '$pattern'"
    FAIL=$((FAIL + 1))
  fi
}

assert_body_not_contains() {
  local desc="$1" body="$2" pattern="$3"
  if ! echo "$body" | grep -q "$pattern"; then
    echo "  ✅ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $desc — body should NOT contain '$pattern'"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "======================================"
echo "  Multi-User Auth Flow Integration Test"
echo "======================================"
echo ""

# --- Health check ---
echo "[1] Health check"
HEALTH=$(curl -s "$BASE/health")
assert_body_contains "Health endpoint returns ok" "$HEALTH" '"status":"ok"'

# --- Clean previous test data ---
echo ""
echo "[2] Clean test users"
# Use unique emails to avoid collisions from previous runs
TS=$(date +%s)
EMAIL_A="test-a-${TS}@example.com"
EMAIL_B="test-b-${TS}@example.com"
PASSWORD="secret123"

# --- Register User A ---
echo ""
echo "[3] Register User A ($EMAIL_A)"
rm -f "$COOKIE_JAR"
REG_A=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -c "$COOKIE_JAR" \
  -d "{\"email\":\"${EMAIL_A}\",\"password\":\"${PASSWORD}\",\"name\":\"Test User A\"}")
HTTP_CODE=$(echo "$REG_A" | tail -1)
BODY=$(echo "$REG_A" | sed '$d')
assert_status "Register returns 201" "201" "$HTTP_CODE"
assert_body_contains "Response has email" "$BODY" "$EMAIL_A"
assert_body_contains "Response has name" "$BODY" "Test User A"
assert_body_not_contains "No password_hash exposed" "$BODY" "password_hash"
assert_body_not_contains "No password field" "$BODY" '"password"'

# --- Duplicate email ---
echo ""
echo "[4] Duplicate email rejected"
DUP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL_A}\",\"password\":\"${PASSWORD}\"}")
assert_status "Duplicate returns 409" "409" "$DUP"

# --- Login User A ---
echo ""
echo "[5] Login User A"
rm -f "$COOKIE_JAR"
LOGIN_A=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -c "$COOKIE_JAR" \
  -d "{\"email\":\"${EMAIL_A}\",\"password\":\"${PASSWORD}\"}")
HTTP_CODE=$(echo "$LOGIN_A" | tail -1)
BODY=$(echo "$LOGIN_A" | sed '$d')
assert_status "Login returns 200" "200" "$HTTP_CODE"
assert_body_contains "Response has email" "$BODY" "$EMAIL_A"

# --- Wrong password ---
echo ""
echo "[6] Wrong password rejected"
WRONG=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL_A}\",\"password\":\"wrongpass\"}")
assert_status "Wrong password returns 401" "401" "$WRONG"

# --- Get /me ---
echo ""
echo "[7] GET /api/auth/me (authenticated)"
ME=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/api/auth/me")
HTTP_CODE=$(echo "$ME" | tail -1)
BODY=$(echo "$ME" | sed '$d')
assert_status "/me returns 200" "200" "$HTTP_CODE"
assert_body_contains "Returns email" "$BODY" "$EMAIL_A"

# --- /me without session ---
echo ""
echo "[8] GET /api/auth/me (no session)"
ME_NOSESS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/me")
assert_status "/me without session returns 401" "401" "$ME_NOSESS"

# --- Jobs API (authenticated) ---
echo ""
echo "[9] GET /api/jobs (authenticated, new user = empty)"
JOBS_A=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE/api/jobs")
HTTP_CODE=$(echo "$JOBS_A" | tail -1)
BODY=$(echo "$JOBS_A" | sed '$d')
assert_status "Jobs returns 200" "200" "$HTTP_CODE"
assert_body_contains "Jobs is an array" "$BODY" '"jobs":\['
# New user should see empty or their own jobs

# --- Register User B ---
echo ""
echo "[10] Register User B ($EMAIL_B)"
COOKIE_JAR_B="/tmp/test-auth-cookies-b.txt"
rm -f "$COOKIE_JAR_B"
REG_B=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -c "$COOKIE_JAR_B" \
  -d "{\"email\":\"${EMAIL_B}\",\"password\":\"${PASSWORD}\",\"name\":\"Test User B\"}")
HTTP_CODE=$(echo "$REG_B" | tail -1)
BODY=$(echo "$REG_B" | sed '$d')
assert_status "Register B returns 201" "201" "$HTTP_CODE"
assert_body_contains "Response has email" "$BODY" "$EMAIL_B"

# --- User B creates a job ---
echo ""
echo "[11] User B creates a job"
JOB_B=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/jobs" \
  -H 'Content-Type: application/json' \
  -b "$COOKIE_JAR_B" \
  -d '{"src":"AF","ref":"test-123","title":"Engineer","employer":"TestCorp","location":"Stockholm","remote":"hybrid","language":"sv","match":50,"url":"https://example.com/job","state":"scraped"}')
HTTP_CODE=$(echo "$JOB_B" | tail -1)
assert_status "Job created (201)" "201" "$HTTP_CODE"

# --- Cross-user isolation: User A lists jobs ---
echo ""
echo "[12] User A lists jobs (should NOT see User B's job)"
JOBS_A2=$(curl -s -b "$COOKIE_JAR" "$BASE/api/jobs")
assert_body_not_contains "User A does NOT see User B's job" "$JOBS_A2" "TestCorp"

# --- User B lists jobs (should see their own) ---
echo ""
echo "[13] User B lists jobs (should see their own)"
JOBS_B=$(curl -s -b "$COOKIE_JAR_B" "$BASE/api/jobs")
assert_body_contains "User B sees their own job" "$JOBS_B" "TestCorp"

# --- User A cannot PATCH User B's job (cross-user block) ---
echo ""
echo "[14] User A tries to PATCH User B's job"
# Extract User B's job ID
JOB_ID_B=$(echo "$JOB_B" | sed '$d' | python3 -c "import sys,json; print(json.load(sys.stdin).get('job',{}).get('id',''))" 2>/dev/null || echo "")
if [ -n "$JOB_ID_B" ]; then
  PATCH_A=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/jobs/$JOB_ID_B" \
    -H 'Content-Type: application/json' \
    -b "$COOKIE_JAR" \
    -d '{"role":"Hacker"}')
  assert_status "Cross-user PATCH blocked (404)" "404" "$PATCH_A"
else
  echo "  ⚠️  Could not extract job ID for cross-user test"
fi

# --- Credential CRUD ---
echo ""
echo "[15] Credential CRUD"
# Create
CRED_CREATE=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/credentials" \
  -H 'Content-Type: application/json' \
  -b "$COOKIE_JAR" \
  -d '{"provider":"test-provider","value":"test-value-123"}')
HTTP_CODE=$(echo "$CRED_CREATE" | tail -1)
assert_status "Credential created (201)" "201" "$HTTP_CODE"

# List
CRED_LIST=$(curl -s -b "$COOKIE_JAR" "$BASE/api/credentials")
assert_body_contains "Provider listed" "$CRED_LIST" "test-provider"
assert_body_not_contains "Value NOT exposed" "$CRED_LIST" "test-value-123"

# User B does NOT see User A's credential
CRED_LIST_B=$(curl -s -b "$COOKIE_JAR_B" "$BASE/api/credentials")
assert_body_not_contains "User B does NOT see User A's credential" "$CRED_LIST_B" "test-provider"

# Delete
CRED_DEL=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE -b "$COOKIE_JAR" "$BASE/api/credentials/test-provider")
assert_status "Credential deleted (200)" "200" "$CRED_DEL"

# --- Wrong password test ---
echo ""
echo "[16] Login with wrong password"
WRONG_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL_A}\",\"password\":\"wrong\"}")
assert_status "Wrong password returns 401" "401" "$WRONG_LOGIN"

# --- Logout ---
echo ""
echo "[17] Logout"
LOGOUT=$(curl -s -o /dev/null -w "%{http_code}" -X POST -b "$COOKIE_JAR" "$BASE/api/auth/logout")
assert_status "Logout returns 200" "200" "$LOGOUT"

# --- After logout: 401 ---
echo ""
echo "[18] API access after logout returns 401"
AFTER=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/jobs")
assert_status "Jobs after logout returns 401" "401" "$AFTER"

# --- Cleanup test data (remove User A's and User B's jobs) ---
echo ""
echo "[19] Cleanup"
# Delete user B's test job
if [ -n "$JOB_ID_B" ]; then
  curl -s -o /dev/null -X DELETE -b "$COOKIE_JAR_B" "$BASE/api/jobs/$JOB_ID_B"
fi

rm -f "$COOKIE_JAR" "$COOKIE_JAR_B"

echo ""
echo "======================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "======================================"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
