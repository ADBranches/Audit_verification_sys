import hmac
import hashlib
import json
from decimal import Decimal, InvalidOperation

INTEGRITY_FIELDS = (
    "transaction_id",
    "amount",
    "member_id",
    "description",
    "date_time",
    "created_at",
    "method",
    "network",
    "phone_number",
)


def normalize_amount(value):
    try:
        amount = Decimal(str(value))
    except InvalidOperation as error:
        raise ValueError("Transaction amount must be numeric") from error
    if not amount.is_finite():
        raise ValueError("Transaction amount must be finite")
    return format(amount.normalize(), "f")


def canonical_transaction(transaction):
    canonical = {}
    for field in INTEGRITY_FIELDS:
        value = transaction.get(field)
        if field == "amount":
            value = normalize_amount(value)
        elif value is None:
            value = ""
        else:
            value = str(value)
        canonical[field] = value
    return json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def compute_transaction_hash(transaction):
    canonical = canonical_transaction(transaction)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def verify_transaction_hash(transaction):
    stored_hash = transaction.get("hash")
    if not isinstance(stored_hash, str) or len(stored_hash) != 64:
        return False
    return hmac.compare_digest(stored_hash, compute_transaction_hash(transaction))
