from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import hashlib, json, os
from datetime import datetime

app = FastAPI(title="Tamper-Evident Audit System", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIT_FILE = os.path.join("audit_repo", "audit_log.json")
if not os.path.exists(AUDIT_FILE):
    os.makedirs("audit_repo", exist_ok=True)
    with open(AUDIT_FILE, "w") as f:
        json.dump([], f)

def load_audit_log():
    with open(AUDIT_FILE, "r") as f:
        return json.load(f)

def save_audit_log(log):
    with open(AUDIT_FILE, "w") as f:
        json.dump(log, f, indent=2)

def compute_hash(entry):
    created_at = entry.get("created_at", "")
    method = entry.get("method", "")
    tx_string = f"{entry['transaction_id']}|{entry['amount']}|{entry['member_id']}|{entry['description']}|{created_at}|{method}"
    return hashlib.sha256(tx_string.encode()).hexdigest()

@app.post("/record")
def record_transaction(entry: dict):
    log = load_audit_log()
    if any(e["transaction_id"] == entry["transaction_id"] for e in log):
        raise HTTPException(status_code=400, detail="Transaction ID already exists")

    entry["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry["method"] = "Admin"
    entry["hash"] = compute_hash(entry)

    log.append(entry)
    save_audit_log(log)
    return {"message": "Transaction recorded successfully", "transaction": entry}

@app.post("/record_mobile")
def record_mobile_transaction(entry: dict):
    log = load_audit_log()
    if any(e["transaction_id"] == entry["transaction_id"] for e in log):
        raise HTTPException(status_code=400, detail="Transaction ID already exists")

    entry["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry["method"] = "Mobile Money"
    entry["hash"] = compute_hash(entry)

    log.append(entry)
    save_audit_log(log)
    return {"message": "Mobile Money transaction recorded successfully", "transaction": entry}

@app.get("/verify/{transaction_id}")
def verify_transaction(transaction_id: str):
    log = load_audit_log()
    entry = next((e for e in log if e["transaction_id"] == transaction_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Transaction not found")

    recomputed_hash = compute_hash(entry)
    is_valid = recomputed_hash == entry.get("hash", "")
    return {
        "transaction_id": entry["transaction_id"],
        "amount": entry["amount"],
        "member_id": entry["member_id"],
        "description": entry["description"],
        "created_at": entry["created_at"],
        "method": entry["method"],
        "status": "✅ Verified" if is_valid else "❌ Tampered"
    }

@app.get("/transactions")
def get_transactions():
    return {"transactions": load_audit_log()}
