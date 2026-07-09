from __future__ import annotations


def compute_invoice_table_total(table_result: dict) -> int:
    return sum(int(row["amount"]) for row in table_result.get("rows", []))


def field_by_schema_key(fields: list[dict], schema_key: str) -> dict | None:
    for field in fields:
        if field["schema_key"] == schema_key:
            return field
    return None
