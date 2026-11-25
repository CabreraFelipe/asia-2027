-- ASIA V11.15 ONLY. Run only against asia-v11-db-staging.
-- Separate append-only synthetic domain journal; never changes V11.14 encrypted snapshots.
CREATE TABLE IF NOT EXISTS synthetic_journal_v115 (
  account_id TEXT NOT NULL REFERENCES accounts_v11(account_id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK(revision BETWEEN 1 AND 30),
  envelope TEXT NOT NULL CHECK(length(envelope) BETWEEN 24 AND 120000),
  created_at TEXT NOT NULL,
  PRIMARY KEY(account_id,revision)
);
CREATE INDEX IF NOT EXISTS synthetic_journal_recent_v115 ON synthetic_journal_v115(account_id, revision DESC);
