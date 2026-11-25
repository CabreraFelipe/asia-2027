-- Asia V11.11 ONLY staging database asia-v11-db-staging.
-- DO NOT apply to asia2027db or any production database.
CREATE TABLE IF NOT EXISTS auth_oidc_flows_v1111 (
 state_digest TEXT PRIMARY KEY CHECK(length(state_digest)=64),
 nonce TEXT NOT NULL CHECK(length(nonce)=43),
 verifier TEXT NOT NULL CHECK(length(verifier)=43),
 expires_at INTEGER NOT NULL CHECK(expires_at>0)
);
CREATE INDEX IF NOT EXISTS auth_oidc_flows_expiry_v1111 ON auth_oidc_flows_v1111(expires_at);
CREATE TABLE IF NOT EXISTS auth_oidc_sessions_v1111 (
 token_digest TEXT PRIMARY KEY CHECK(length(token_digest)=64),
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id) ON DELETE CASCADE,
 csrf TEXT NOT NULL CHECK(length(csrf)=43),
 email_digest TEXT NOT NULL CHECK(length(email_digest)=64),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 expires_at INTEGER NOT NULL CHECK(expires_at>created_at)
);
CREATE INDEX IF NOT EXISTS auth_oidc_sessions_account_v1111 ON auth_oidc_sessions_v1111(account_id,expires_at);
