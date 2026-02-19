"""Factory — returns real or mock Hedera service based on HEDERA_ENABLED env var."""

from __future__ import annotations

import os


def get_hts_service():
    """Return HTSService (real) if HEDERA_ENABLED=true, else MockHTSService."""
    enabled = os.environ.get("HEDERA_ENABLED", "false").lower() == "true"

    if enabled:
        from hedera.hts_service import HTSService
        return HTSService()

    from hedera.mock_hedera import MockHTSService
    return MockHTSService()
