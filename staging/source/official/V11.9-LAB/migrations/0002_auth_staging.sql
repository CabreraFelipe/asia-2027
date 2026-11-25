-- V11.1 | Synthetic identities ONLY. Apply to asia-v11-db-staging and nowhere else.
-- Does not alter historical tables or the V11.0 account identifiers.
CREATE TABLE auth_credentials_v111 (
 account_id TEXT PRIMARY KEY REFERENCES accounts_v11(account_id) ON DELETE CASCADE,
 salt TEXT NOT NULL CHECK(length(salt)=22),
 verifier TEXT NOT NULL CHECK(length(verifier)=43),
 kdf_iterations INTEGER NOT NULL CHECK(kdf_iterations >= 600000),
 created_at INTEGER NOT NULL CHECK(created_at > 0)
);
CREATE TABLE auth_sessions_v111 (
 token_digest TEXT PRIMARY KEY CHECK(length(token_digest)=64),
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL CHECK(created_at > 0),
 expires_at INTEGER NOT NULL CHECK(expires_at > created_at)
);
CREATE INDEX auth_sessions_account_v111 ON auth_sessions_v111(account_id, expires_at);
CREATE TABLE auth_attempts_v111 (
 bucket TEXT PRIMARY KEY CHECK(length(bucket)=32),
 attempts INTEGER NOT NULL CHECK(attempts BETWEEN 1 AND 10000),
 expires_at INTEGER NOT NULL CHECK(expires_at > 0)
);
