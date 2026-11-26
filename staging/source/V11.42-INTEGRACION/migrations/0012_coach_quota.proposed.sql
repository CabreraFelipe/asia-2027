-- PROPOSED only, excluded from deployment migration manifest.
-- Reservations contain no prompt, reply, token, email or provider secret.
CREATE TABLE coach_reservations_v1186 (
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id),
 request_id TEXT NOT NULL CHECK(length(request_id)=36),
 reserved_ms INTEGER NOT NULL CHECK(reserved_ms>=0),
 PRIMARY KEY(account_id,request_id)
);
CREATE INDEX coach_reservations_v1186_account_time ON coach_reservations_v1186(account_id,reserved_ms);
CREATE INDEX coach_reservations_v1186_time ON coach_reservations_v1186(reserved_ms);
