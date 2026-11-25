-- STAGING ONLY. New empty D1 database. Never run against current personal database.
-- D1 enables foreign keys. No production tables are referenced.
CREATE TABLE staging_identity_v110 (
 id INTEGER PRIMARY KEY CHECK(id=1),
 marker TEXT NOT NULL CHECK(marker='asia-v11-staging-110')
);
INSERT INTO staging_identity_v110(id,marker) VALUES(1,'asia-v11-staging-110');
CREATE TABLE accounts_v11 (
 account_id TEXT PRIMARY KEY CHECK(length(account_id)=37 AND substr(account_id,1,5)='acct_' AND substr(account_id,6) NOT GLOB '*[^0-9a-f]*'),
 issuer TEXT NOT NULL CHECK(length(issuer) BETWEEN 1 AND 500),
 subject TEXT NOT NULL CHECK(length(subject) BETWEEN 1 AND 500),
 created_at TEXT NOT NULL,
 UNIQUE(issuer,subject)
);
CREATE TABLE encrypted_snapshots_v11 (
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id),
 revision INTEGER NOT NULL CHECK(revision>=1),
 envelope TEXT NOT NULL CHECK(length(envelope) BETWEEN 1 AND 1400000),
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,revision)
);
CREATE TABLE push_devices_v11 (
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id),
 device_id TEXT NOT NULL CHECK(length(device_id) BETWEEN 1 AND 128),
 endpoint TEXT NOT NULL UNIQUE,
 subscription_json TEXT NOT NULL CHECK(length(subscription_json) BETWEEN 1 AND 16384),
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,device_id)
);
CREATE TABLE reminder_queue_v11 (
 account_id TEXT NOT NULL,
 device_id TEXT NOT NULL,
 reminder_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('weight','gym','diet','weekly','checkin','strategy')),
 due_at INTEGER NOT NULL CHECK(due_at>0),
 PRIMARY KEY(account_id,device_id,reminder_id),
 FOREIGN KEY(account_id,device_id) REFERENCES push_devices_v11(account_id,device_id) ON DELETE CASCADE
);
CREATE INDEX reminders_due_v11 ON reminder_queue_v11(due_at);
