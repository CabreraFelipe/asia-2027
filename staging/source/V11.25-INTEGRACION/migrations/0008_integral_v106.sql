-- Additive. Never applied to personal or staging databases by this package.
CREATE TABLE IF NOT EXISTS integral_v106_backups (
 account_id TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision BETWEEN 1 AND 9007199254740991),
 envelope TEXT NOT NULL,
 bytes INTEGER NOT NULL CHECK(bytes BETWEEN 1 AND 1400000),
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,revision)
);
