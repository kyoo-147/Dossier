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

    def register(self, provider: ProviderDefinition) -> None:
      self._providers[provider.provider_id] = provider

    def get(self, provider_id: str) -> ProviderDefinition:
      return self._providers[provider_id]

    def list_ids(self) -> list[str]:
      return sorted(self._providers)
