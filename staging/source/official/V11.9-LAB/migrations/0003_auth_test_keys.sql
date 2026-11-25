-- V11.1b: HMAC-verifiable, server-generated 256-bit synthetic test keys.
-- Apply ONLY to asia-v11-db-staging; keep v111 PBKDF2 table untouched for auditing.
-- The previous 600000-PBKDF2 path remains disabled in V11.1b.
CREATE TABLE auth_test_keys_v111b (
 account_id TEXT PRIMARY KEY REFERENCES accounts_v11(account_id) ON DELETE CASCADE,
 salt TEXT NOT NULL CHECK(length(salt)=22),
 key_digest TEXT NOT NULL CHECK(length(key_digest)=64),
 method TEXT NOT NULL CHECK(method='hmac-sha256-synthetic-v1'),
 created_at INTEGER NOT NULL CHECK(created_at>0)
);
