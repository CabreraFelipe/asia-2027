-- PROPOSED ONLY, synthetic pilot. Requires 0010 and 0015. No historical row is deleted.
CREATE TABLE pilot_fresh_profiles_v12 (
 legacy_account_id TEXT PRIMARY KEY REFERENCES accounts_v11(account_id),
 fresh_account_id TEXT NOT NULL UNIQUE REFERENCES accounts_v11(account_id),
 created_at TEXT NOT NULL,
 CHECK(legacy_account_id<>fresh_account_id)
);
CREATE TRIGGER pilot_fresh_profile_guard_v12 BEFORE INSERT ON pilot_fresh_profiles_v12
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM accounts_v11 WHERE account_id=NEW.legacy_account_id AND issuer='https://accounts.google.com')
 OR EXISTS(SELECT 1 FROM accounts_v11 WHERE account_id=NEW.fresh_account_id)
 OR EXISTS(SELECT 1 FROM managed_account_keys_v1152 WHERE account_id=NEW.legacy_account_id)
 OR EXISTS(SELECT 1 FROM pilot_fresh_profiles_v12 WHERE fresh_account_id=NEW.legacy_account_id)
 THEN RAISE(ABORT,'profile not eligible') END;
END;
CREATE TRIGGER pilot_fresh_profile_create_v12 AFTER INSERT ON pilot_fresh_profiles_v12
BEGIN
 INSERT INTO accounts_v11(account_id,issuer,subject,created_at)
 VALUES(NEW.fresh_account_id,'urn:asia:synthetic-fresh-profile-v12',NEW.legacy_account_id,NEW.created_at);
 -- 0015 enrolls the newly inserted profile in the managed-key system.
 DELETE FROM auth_oidc_sessions_v1111 WHERE account_id=NEW.legacy_account_id;
END;
CREATE TRIGGER pilot_fresh_profile_session_fence_v12 BEFORE INSERT ON auth_oidc_sessions_v1111
WHEN EXISTS(SELECT 1 FROM pilot_fresh_profiles_v12 WHERE legacy_account_id=NEW.account_id)
BEGIN SELECT RAISE(ABORT,'retired profile'); END;
