from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.integrity import compute_transaction_hash, verify_transaction_hash
except ModuleNotFoundError:
    from integrity import compute_transaction_hash, verify_transaction_hash
import time, json, os
from datetime import datetime
import random

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
AUDIT_FOLDER = "audit_repo"
AUDIT_LOG = os.path.join(AUDIT_FOLDER, "audit_log.json")
MEMBERS_FILE = os.path.join(AUDIT_FOLDER, "members.json")

os.makedirs(AUDIT_FOLDER, exist_ok=True)

# Initialize members file if missing
if not os.path.exists(MEMBERS_FILE):
    members = {
        "M001": {"password": "user", "lockout_until": 0, "attempts": 3},
        "M002": {"password": "user2", "lockout_until": 0, "attempts": 3},
        "M003": {"password": "user3", "lockout_until": 0, "attempts": 3},
    }
    with open(MEMBERS_FILE, "w") as f:
        json.dump(members, f, indent=2)

def load_members():
    with open(MEMBERS_FILE, "r") as f:
        return json.load(f)

def save_members(members):
    with open(MEMBERS_FILE, "w") as f:
        json.dump(members, f, indent=2)

class LoginRequest(BaseModel):
    member_id: str
    password: str

class Transaction(BaseModel):
    transaction_id: str
    amount: float
    member_id: str
    description: str
    method: str = "manual"

class MobileMoneyRequest(BaseModel):
    member_id: str
    amount: float
    phone_number: str
    description: str
    network: str

# ---------------- AUTH ----------------
@app.post("/member_login")
def member_login(req: LoginRequest):
    members = load_members()
    member = members.get(req.member_id)
    if not member:
        raise HTTPException(status_code=401, detail="Invalid Member ID")

    # Check lockout
    if time.time() < member["lockout_until"]:
        minutes_left = int((member["lockout_until"] - time.time()) / 60)
        raise HTTPException(status_code=403, detail=f"Account locked. Try again in {minutes_left} minutes.")

    # Validate password
    if req.password == member["password"]:
        member["attempts"] = 3  # reset attempts
        save_members(members)
        return {"success": True, "message": "Login successful"}
    else:
        member["attempts"] -= 1
        if member["attempts"] <= 0:
            member["lockout_until"] = time.time() + 2 * 60 * 60  # 2 hours lockout
            member["attempts"] = 3  # reset attempts after lockout
            save_members(members)
            raise HTTPException(status_code=403, detail="Too many failed attempts. Account locked for 2 hours.")
        save_members(members)
        raise HTTPException(status_code=401, detail=f"Invalid password. Attempts remaining: {member['attempts']}")

# ---------------- TRANSACTIONS ----------------
@app.get("/transactions")
def get_transactions():
    try:
        with open(AUDIT_LOG, "r") as f:
            data = json.load(f)
        if not isinstance(data, list):
            data = []
        return {"transactions": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading transactions: {str(e)}")

@app.post("/transactions")
def add_transaction(tx: Transaction):
    try:
        with open(AUDIT_LOG, "r") as f:
            try:
                data = json.load(f)
            except:
                data = []

        if any(record.get("transaction_id") == tx.transaction_id for record in data):
            raise HTTPException(status_code=409, detail="Transaction ID already exists")

        new_tx = {
            "transaction_id": tx.transaction_id,
            "amount": tx.amount,
            "member_id": tx.member_id,
            "description": tx.description,
            "date_time": datetime.now().isoformat(),
            "method": tx.method,
            "network": None,
            "phone_number": None
        }
        new_tx["hash"] = compute_transaction_hash(new_tx)
        data.append(new_tx)

        with open(AUDIT_LOG, "w") as f:
            json.dump(data, f, indent=2)

        return {"success": True, "transaction": new_tx}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding transaction: {str(e)}")


@app.get("/verify/{transaction_id}")
def verify_transaction(transaction_id: str):
    try:
        with open(AUDIT_LOG, "r") as audit_file:
            data = json.load(audit_file)
        transaction = next((record for record in data if record.get("transaction_id") == transaction_id), None)
        if transaction is None:
            raise HTTPException(status_code=404, detail="Transaction not found")
        verified = verify_transaction_hash(transaction)
        return {"transaction_id": transaction_id, "verified": verified, "status": "verified" if verified else "tampered"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Error verifying transaction: {error}") from error

# ---------------- MOBILE MONEY (SIMULATION) ----------------
@app.post("/mobile_money")
def simulate_mobile_money(req: MobileMoneyRequest):
    try:
        with open(AUDIT_LOG, "r") as f:
            try:
                data = json.load(f)
            except:
                data = []

        success = random.choice([True, True, False])  # 2/3 chance success

        if not success:
            raise HTTPException(status_code=402, detail=f"{req.network} payment failed (simulation).")

        transaction_id = f"MM-{time.time_ns()}"
        if any(record.get("transaction_id") == transaction_id for record in data):
            raise HTTPException(status_code=409, detail="Transaction ID already exists")

        new_tx = {
            "transaction_id": transaction_id,
            "amount": req.amount,
            "member_id": req.member_id,
            "description": req.description,
            "date_time": datetime.now().isoformat(),
            "method": "mobile_money",
            "network": req.network,
            "phone_number": req.phone_number
        }
        new_tx["hash"] = compute_transaction_hash(new_tx)
        data.append(new_tx)

        with open(AUDIT_LOG, "w") as f:
            json.dump(data, f, indent=2)

        return {"success": True, "transaction": new_tx}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error simulating mobile money: {str(e)}")
