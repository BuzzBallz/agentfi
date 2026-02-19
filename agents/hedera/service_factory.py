"""Factory — returns real or mock Hedera services based on HEDERA_ENABLED env var."""

from __future__ import annotations

import os


def _is_enabled() -> bool:
    return os.environ.get("HEDERA_ENABLED", "false").lower() == "true"


def get_hts_service():
    """Return HTSService (real) if HEDERA_ENABLED=true, else MockHTSService."""
    if _is_enabled():
        from hedera.hts_service import HTSService
        return HTSService()

    from hedera.mock_hedera import MockHTSService
    return MockHTSService()


def get_hcs_service():
    """Return HCSMessaging (real) if HEDERA_ENABLED=true, else MockHCSMessaging."""
    if _is_enabled():
        from hedera.hcs_messaging import HCSMessaging
        return HCSMessaging()

    from hedera.mock_hedera import MockHCSMessaging
    return MockHCSMessaging()
