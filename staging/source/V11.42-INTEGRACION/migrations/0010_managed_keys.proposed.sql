-- PROPOSED only, not part of deployment migration list.
-- Synthetic pilot D1 only. Explicit enrollment is intentionally out of band.
CREATE TABLE managed_account_keys_v1152 (
 account_id TEXT PRIMARY KEY REFERENCES accounts_v11(account_id),
 envelope TEXT CHECK(envelope IS NULL OR length(envelope) BETWEEN 80 AND 512)
);
