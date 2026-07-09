from dossier_runtime.extraction.field_mapper import extract_fields
from dossier_runtime.validation.engine import validate_fields


def test_validation_detects_total_mismatch() -> None:
    fields = extract_fields(
        {"file_name": "invoice_01.pdf", "has_schema": True},
        {"text": "Invoice Number 000789 Total Amount 7590000", "confidence": 0.93},
        {"rows": [{"amount": 1000}, {"amount": 2000}]},
    )

    warnings = validate_fields(
        {"file_name": "invoice_01.pdf", "has_schema": True},
        fields,
        {"rows": [{"amount": 1000}, {"amount": 2000}]},
    )

    assert any(warning["code"] == "TOTAL_SUM_MISMATCH" for warning in warnings)


def test_validation_marks_low_confidence_field() -> None:
    fields = extract_fields(
        {"file_name": "invoice_01.pdf", "has_schema": True},
        {"text": "Invoice Number 000789 Total Amount 7590000", "confidence": 0.93},
        {"rows": [{"amount": 5000000}, {"amount": 1200000}, {"amount": 700000}]},
    )

    warnings = validate_fields(
        {"file_name": "invoice_01.pdf", "has_schema": True},
        fields,
        {"rows": [{"amount": 5000000}, {"amount": 1200000}, {"amount": 700000}]},
    )

    assert any(warning["code"] == "LOW_CONFIDENCE_FIELD" for warning in warnings)
