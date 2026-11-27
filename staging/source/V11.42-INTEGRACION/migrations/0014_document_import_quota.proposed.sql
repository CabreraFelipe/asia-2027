-- Proposed, independent cost budget for documents. Not applied to production.
CREATE TABLE document_import_reservations_v12 (
 account_id TEXT NOT NULL REFERENCES accounts_v11(account_id),
 request_id TEXT NOT NULL,
 reserved_ms INTEGER NOT NULL,
 PRIMARY KEY(account_id,request_id)
);
CREATE INDEX document_import_reservations_account_time_v12 ON document_import_reservations_v12(account_id,reserved_ms);
CREATE INDEX document_import_reservations_time_v12 ON document_import_reservations_v12(reserved_ms);
