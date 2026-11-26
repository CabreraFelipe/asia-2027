-- PROPOSED only, not part of deployment migration list.
-- Synthetic pilot D1 only. Explicit enrollment is intentionally out of band.
CREATE TABLE managed_account_keys_v1152 (
 account_id TEXT PRIMARY KEY REFERENCES accounts_v11(account_id),
 envelope TEXT CHECK(envelope IS NULL OR length(envelope) BETWEEN 80 AND 512),
 -- Only a future authenticated migration coordinator may set/clear this lock.
 migration_lock TEXT CHECK(migration_lock IS NULL OR length(migration_lock)=36),
 -- Enrollment is explicit; never infer a new account from an empty cloud.
 enrollment_kind TEXT NOT NULL CHECK(enrollment_kind IN ('new','legacy'))
);
