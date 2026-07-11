from __future__ import annotations

import re


_LINE_ITEM_PATTERN = re.compile(
    r"^\s*(?P<item>.+?),\s*(?P<qty>\d+)\s*,\s*(?P<amount>[\d.,]+)\s*$"
)


def _parse_amount(value: str) -> int:
    return int(re.sub(r"\D", "", value) or "0")


def table_parser_provider(payload: dict) -> dict:
    text = str(payload.get("text") or payload.get("content") or "")
    rows: list[dict] = []

    for line in text.splitlines():
        match = _LINE_ITEM_PATTERN.match(line)
        if match is None:
            continue
        rows.append(
            {
                "item": match.group("item").strip(),
                "qty": int(match.group("qty")),
                "amount": _parse_amount(match.group("amount")),
            }
        )

    return {"rows": rows}
