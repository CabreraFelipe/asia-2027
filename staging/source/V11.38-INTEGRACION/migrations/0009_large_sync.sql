-- New synthetic table only; no existing table changed. Not applied by CI.
CREATE TABLE IF NOT EXISTS sync_v1138_objects (
 account_id TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision BETWEEN 1 AND 200),
 object_key TEXT NOT NULL UNIQUE,
 bytes INTEGER NOT NULL CHECK(bytes BETWEEN 1 AND 41000000),
 sha256 TEXT NOT NULL,
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,revision)
);
