from typing import Dict, Any, List
from abc import ABC, abstractmethod

class BaseAdapter(ABC):
    @abstractmethod
    async def process(self, document_path: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Process a document and return layout/extracted fields."""
        pass

class DeterministicRulesAdapter(BaseAdapter):
    async def process(self, document_path: str, options: Dict[str, Any]) -> Dict[str, Any]:
        # A simple deterministic rule based extraction mock
        return {
            "fields": [
                {"field_id": "total_amount", "value": "1500.00", "confidence": 1.0},
                {"field_id": "invoice_date", "value": "2024-01-01", "confidence": 1.0}
            ],
            "layout": {
                "pages": [
                    {
                        "page_number": 1,
                        "blocks": [
                            {"type": "text", "text": "INVOICE", "bbox": [100, 100, 200, 120]}
                        ]
                    }
                ]
            }
        }
