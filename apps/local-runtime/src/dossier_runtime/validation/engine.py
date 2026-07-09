from __future__ import annotations

from .rules import compute_invoice_table_total, field_by_schema_key


def validate_fields(document_payload: dict, fields: list[dict], table_result: dict) -> list[dict]:
    warnings: list[dict] = []

    total_field = field_by_schema_key(fields, "invoice.total_amount")
    if total_field is not None:
        table_total = compute_invoice_table_total(table_result)
        normalized_total = int(total_field["normalized_value"])
        if normalized_total != table_total:
            warnings.append(
                {
                    "code": "TOTAL_SUM_MISMATCH",
                    "message": f"Expected {normalized_total} but line items sum to {table_total}",
                    "severity": "medium",
                }
            )
            total_field["status"] = "warning"

    for field in fields:
        if field.get("confidence", 1.0) < 0.85:
            warnings.append(
                {
                    "code": "LOW_CONFIDENCE_FIELD",
                    "message": f"{field['label']} is below confidence threshold",
                    "severity": "medium",
                }
            )
            field["status"] = "warning"

    if document_payload.get("has_schema") and not warnings:
        warnings.append(
            {
                "code": "APPROVAL_REQUIRED",
                "message": "Schema workflow requires approval before export",
                "severity": "medium",
            }
        )

    return warnings
