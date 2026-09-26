# AUREVIA Architecture

Browser
  ↓
FastAPI REST API
  ↓
Metadata / Replication / Health / Repair managers
  ↓
SQLite metadata + independent storage nodes

Upload:
file → object ID → SHA-256 → choose healthy nodes → write replicas → verify → metadata

Download:
metadata → healthy replicas → SHA-256 verification → verified copy → user

Failure:
node failed → replica unavailable → other replicas remain readable

Repair:
verified healthy replica → copy to available healthy node → checksum verify → restore replication factor

Corruption:
alter replica → checksum mismatch → reject bad copy → repair from verified copy
