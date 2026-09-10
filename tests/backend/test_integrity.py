from copy import deepcopy

import pytest

from backend.integrity import canonical_transaction, compute_transaction_hash, normalize_amount, verify_transaction_hash


def sample_transaction():
    return {
        "transaction_id": "TX-001",
        "amount": 50000,
        "member_id": "M001",
        "description": "Loan repayment",
        "date_time": "2026-09-10T10:30:00",
        "method": "manual",
        "network": None,
        "phone_number": None,
    }


def test_hash_is_deterministic():
    transaction = sample_transaction()
    assert compute_transaction_hash(transaction) == compute_transaction_hash(deepcopy(transaction))


def test_canonicalization_is_independent_of_input_key_order():
    transaction = sample_transaction()
    reversed_transaction = dict(reversed(tuple(transaction.items())))
    assert canonical_transaction(transaction) == canonical_transaction(reversed_transaction)


def test_equivalent_amounts_have_same_hash():
    integer_transaction = sample_transaction()
    decimal_transaction = sample_transaction()
    decimal_transaction["amount"] = "50000.00"
    assert compute_transaction_hash(integer_transaction) == compute_transaction_hash(decimal_transaction)


def test_tampering_invalidates_hash():
    transaction = sample_transaction()
    transaction["hash"] = compute_transaction_hash(transaction)
    assert verify_transaction_hash(transaction)
    transaction["amount"] = 50001
    assert not verify_transaction_hash(transaction)


def test_missing_or_invalid_hash_is_rejected():
    transaction = sample_transaction()
    assert not verify_transaction_hash(transaction)
    transaction["hash"] = "invalid"
    assert not verify_transaction_hash(transaction)


def test_normalize_amount_rejects_non_numeric_values():
    with pytest.raises(ValueError, match="numeric"):
        normalize_amount("not-a-number")
