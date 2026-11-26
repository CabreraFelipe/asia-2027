-- Proposed only: no production migration, no subscription credentials or delivery.
-- Device IDs are issued by a future verified enrollment flow; never adopted from a request body.
CREATE TABLE notification_devices_v12 (
 device_id TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id),
 revoked INTEGER NOT NULL DEFAULT 0 CHECK(revoked IN (0,1)),
 UNIQUE(account_id,device_id)
);
CREATE TABLE notification_queue_v12 (
 account_id TEXT NOT NULL,
 device_id TEXT NOT NULL,
 channel TEXT NOT NULL CHECK(channel IN ('agenda','rest')),
 revision INTEGER NOT NULL CHECK(revision > 0),
 events_json TEXT NOT NULL,
 PRIMARY KEY(account_id,device_id,channel),
 FOREIGN KEY(account_id,device_id) REFERENCES notification_devices_v12(account_id,device_id)
);
