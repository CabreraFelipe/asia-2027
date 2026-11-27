-- PROPOSED only. Install only on verified isolated pilot after 0010 and explicit approval.
-- Enroll accounts at the instant of their first successful insertion, never retroactively.
-- The verified Google OIDC callback is the only account creator in the pilot Worker.
-- INSERT OR IGNORE on existing identity does not run this trigger.
CREATE TRIGGER managed_new_account_enrollment_v12
AFTER INSERT ON accounts_v11
BEGIN
 INSERT INTO managed_account_keys_v1152(account_id,enrollment_kind)
 VALUES(NEW.account_id,'new');
END;
