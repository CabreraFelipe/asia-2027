-- V11.5 LOCAL LAB ONLY. Never apply to production or existing Cloudflare staging.
-- Stored state is an opaque encrypted Coach archive; the server has no decryption key.
CREATE TABLE coach_archives_v115 (
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id) ON DELETE CASCADE,
 revision INTEGER NOT NULL CHECK(revision BETWEEN 1 AND 20),
 envelope TEXT NOT NULL CHECK(length(envelope) BETWEEN 100 AND 700000),
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id, revision)
);
-- Each reservation is idempotent within a synthetic account, kind and day.
CREATE TABLE coach_reservations_v115 (
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id) ON DELETE CASCADE,
 day TEXT NOT NULL CHECK(length(day)=10),
 kind TEXT NOT NULL CHECK(kind IN ('chat','weekly')),
 request_id TEXT NOT NULL CHECK(length(request_id) BETWEEN 12 AND 64),
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,day,kind,request_id)
);
CREATE INDEX coach_quota_v115 ON coach_reservations_v115(account_id, day, kind);
