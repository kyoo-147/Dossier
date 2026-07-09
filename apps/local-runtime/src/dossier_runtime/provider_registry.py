from __future__ import annotations

from dataclasses import dataclass
from typing import Callable


ProviderCallable = Callable[[dict], dict]


@dataclass(slots=True)
class ProviderDefinition:
    provider_id: str
    provider_type: str
    version: str
    handler: ProviderCallable


class ProviderRegistry:
    def __init__(self) -> None:
      self._providers: dict[str, ProviderDefinition] = {}
      self._types: dict[str, str] = {}

    def register(self, provider: ProviderDefinition) -> None:
      self._providers[provider.provider_id] = provider
      self._types[provider.provider_type] = provider.provider_id

    def get(self, provider_id: str) -> ProviderDefinition:
      return self._providers[provider_id]

    def get_by_type(self, provider_type: str) -> ProviderDefinition:
      provider_id = self._types[provider_type]
      return self.get(provider_id)

    def list_ids(self) -> list[str]:
      return sorted(self._providers)
