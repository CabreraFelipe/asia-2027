-- PROPOSED synthetic D1 only. Not included in deploy migrations.
-- Single statement + triggers form the atomic publication boundary.
CREATE TABLE remote_rekeys_v1157 (
 account_id TEXT NOT NULL REFERENCES managed_account_keys_v1152(account_id),
 operation_id TEXT NOT NULL CHECK(length(operation_id)=36),
 source_revision INTEGER NOT NULL CHECK(source_revision BETWEEN 1 AND 199),
 source_sha TEXT NOT NULL CHECK(length(source_sha)=64),
 phase TEXT NOT NULL CHECK(phase IN ('locked','committed','canceled')),
 wrapped_key TEXT,
 target_object TEXT UNIQUE,
 target_bytes INTEGER,
 target_sha TEXT,
 created_at TEXT NOT NULL,
 finished_at TEXT,
 PRIMARY KEY(account_id,operation_id),
 CHECK((phase='locked' AND wrapped_key IS NOT NULL AND target_object IS NULL AND target_bytes IS NULL AND target_sha IS NULL AND finished_at IS NULL)
 OR (phase='canceled' AND wrapped_key IS NULL AND target_object IS NULL AND target_bytes IS NULL AND target_sha IS NULL AND finished_at IS NOT NULL)
 OR (phase='committed' AND wrapped_key IS NULL AND target_object IS NOT NULL AND target_bytes BETWEEN 1 AND 41000000 AND length(target_sha)=64 AND finished_at IS NOT NULL))
);
CREATE UNIQUE INDEX remote_rekeys_v1157_one_locked ON remote_rekeys_v1157(account_id) WHERE phase='locked';
CREATE TRIGGER remote_rekeys_v1157_lock AFTER INSERT ON remote_rekeys_v1157
BEGIN
 SELECT CASE WHEN NEW.phase<>'locked' THEN RAISE(ABORT,'invalid migration start') END;
 UPDATE managed_account_keys_v1152 SET migration_lock=NEW.operation_id
 WHERE account_id=NEW.account_id AND envelope IS NULL AND migration_lock IS NULL
 AND EXISTS(SELECT 1 FROM sync_v1138_objects WHERE account_id=NEW.account_id AND revision=NEW.source_revision AND sha256=NEW.source_sha)
 AND (SELECT MAX(revision) FROM sync_v1138_objects WHERE account_id=NEW.account_id)=NEW.source_revision
 AND NOT EXISTS(SELECT 1 FROM synthetic_journal_v115 WHERE account_id=NEW.account_id)
 AND NOT EXISTS(SELECT 1 FROM encrypted_snapshots_v11 WHERE account_id=NEW.account_id);
 SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'migration lock conflict') END;
END;
CREATE TRIGGER remote_rekeys_v1157_finish AFTER UPDATE ON remote_rekeys_v1157
BEGIN
 SELECT CASE WHEN OLD.phase<>'locked' OR NEW.phase NOT IN ('committed','canceled')
 OR NEW.account_id<>OLD.account_id OR NEW.operation_id<>OLD.operation_id
 OR NEW.source_revision<>OLD.source_revision OR NEW.source_sha<>OLD.source_sha
 OR NEW.created_at<>OLD.created_at THEN RAISE(ABORT,'invalid migration transition') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM managed_account_keys_v1152 WHERE account_id=OLD.account_id AND envelope IS NULL AND migration_lock=OLD.operation_id)
 THEN RAISE(ABORT,'migration lock lost') END;
 SELECT CASE WHEN NEW.phase='committed' AND (
 NOT EXISTS(SELECT 1 FROM sync_v1138_objects WHERE account_id=OLD.account_id AND revision=OLD.source_revision AND sha256=OLD.source_sha)
 OR (SELECT MAX(revision) FROM sync_v1138_objects WHERE account_id=OLD.account_id)<>OLD.source_revision
 OR EXISTS(SELECT 1 FROM synthetic_journal_v115 WHERE account_id=OLD.account_id)
 OR EXISTS(SELECT 1 FROM encrypted_snapshots_v11 WHERE account_id=OLD.account_id))
 THEN RAISE(ABORT,'migration source changed') END;
 INSERT INTO sync_v1138_objects(account_id,revision,object_key,bytes,sha256,created_at)
 SELECT OLD.account_id,OLD.source_revision+1,NEW.target_object,NEW.target_bytes,NEW.target_sha,NEW.finished_at
 WHERE NEW.phase='committed';
 UPDATE managed_account_keys_v1152 SET migration_lock=NULL,
 envelope=CASE WHEN NEW.phase='committed' THEN OLD.wrapped_key ELSE NULL END
 WHERE account_id=OLD.account_id AND envelope IS NULL AND migration_lock=OLD.operation_id;
 SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'migration key conflict') END;
END;
