-- V11.6 OFFLINE-LAB ONLY. DO NOT APPLY TO CLOUDFLARE OR PRODUCTION.
-- Synthetic consent, opaque health archives, encrypted synthetic push configuration.
CREATE TABLE wellness_devices_v116 (
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id) ON DELETE CASCADE,
 device_id TEXT NOT NULL CHECK(length(device_id)=36 AND substr(device_id,1,4)='dev_'),
 platform TEXT NOT NULL CHECK(platform IN ('iphone','android','desktop','simulator')),
 health_enabled INTEGER NOT NULL DEFAULT 0 CHECK(health_enabled IN (0,1)),
 push_enabled INTEGER NOT NULL DEFAULT 0 CHECK(push_enabled IN (0,1)),
 consent_version INTEGER NOT NULL DEFAULT 1 CHECK(consent_version>0),
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,device_id)
);
CREATE TABLE wellness_health_v116 (
 account_id TEXT NOT NULL,
 device_id TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision BETWEEN 1 AND 10),
 envelope TEXT NOT NULL CHECK(length(envelope) BETWEEN 100 AND 280000),
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,device_id,revision),
 FOREIGN KEY(account_id,device_id) REFERENCES wellness_devices_v116(account_id,device_id) ON DELETE CASCADE
);
CREATE TABLE wellness_push_v116 (
 account_id TEXT NOT NULL,
 device_id TEXT NOT NULL,
 endpoint_fingerprint TEXT NOT NULL CHECK(length(endpoint_fingerprint)=64),
 envelope TEXT NOT NULL CHECK(length(envelope) BETWEEN 100 AND 280000),
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,device_id),
 FOREIGN KEY(account_id,device_id) REFERENCES wellness_devices_v116(account_id,device_id) ON DELETE CASCADE
);
CREATE TABLE wellness_reminders_v116 (
 account_id TEXT NOT NULL,
 device_id TEXT NOT NULL,
 reminder_id TEXT NOT NULL CHECK(length(reminder_id)=28),
 kind TEXT NOT NULL CHECK(kind IN ('checkin','training','hydration','weekly')),
 due_at INTEGER NOT NULL CHECK(due_at>0),
 created_at TEXT NOT NULL,
 PRIMARY KEY(account_id,device_id,reminder_id),
 FOREIGN KEY(account_id,device_id) REFERENCES wellness_devices_v116(account_id,device_id) ON DELETE CASCADE
);
CREATE INDEX wellness_reminder_owner_v116 ON wellness_reminders_v116(account_id,due_at);
