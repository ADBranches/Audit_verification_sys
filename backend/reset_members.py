import json, os, bcrypt

MEMBERS_FILE = os.path.join("audit_repo", "members.json")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def is_bcrypt_hash(value: str) -> bool:
    # bcrypt hashes always start with $2b$ or $2a$ and are ~60 chars long
    return isinstance(value, str) and value.startswith("$2") and len(value) == 60

def reset_members():
    if not os.path.exists(MEMBERS_FILE):
        print("No members.json found.")
        return

    with open(MEMBERS_FILE, "r") as f:
        members = json.load(f)

    updated = False
    for member_id, data in members.items():
        pwd = data.get("password")
        if not is_bcrypt_hash(pwd):
            print(f"Re‑hashing password for {member_id}...")
            data["password"] = hash_password(pwd)
            updated = True

    if updated:
        with open(MEMBERS_FILE, "w") as f:
            json.dump(members, f, indent=2)
        print("✅ Members file updated with hashed passwords.")
    else:
        print("All passwords already hashed.")

if __name__ == "__main__":
    reset_members()
