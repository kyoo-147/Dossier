from __future__ import annotations


def layout_provider(payload: dict) -> dict:
    page_count = payload.get("page_count", 1)
    regions: list[dict] = []
    for index in range(page_count):
        regions.append(
            {
                "region_id": f"reg_{index + 1}",
                "page_id": f"page_{index + 1}",
                "type": "text",
                "bbox": {"x": 0, "y": 0, "w": 100, "h": 20},
                "reading_order": index,
                "parent_region_id": None,
                "confidence": 0.95,
                "artifact_ref": f"artifact://layout-region-{index + 1}",
            }
        )
    return {"regions": regions}
