from __future__ import annotations


def table_parser_provider(payload: dict) -> dict:
    file_name = payload.get("file_name", "").lower()
    if "invoice" not in file_name and "hoa" not in file_name:
        return {"rows": []}

    return {
        "rows": [
            {"item": "May in Canon LBP 2900", "qty": 2, "amount": 5000000},
            {"item": "Muc in Canon 303", "qty": 4, "amount": 1200000},
            {"item": "Giay in A4 Double A", "qty": 10, "amount": 700000},
        ]
    }
