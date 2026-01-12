"""
Analytics integration with PostHog.
"""

import os
from typing import Optional, Dict, Any
from loguru import logger

# Default PostHog configuration
DEFAULT_POSTHOG_KEY = "phc_EoMHKFbx6j2wUFsf8ywqgHntY4vEXC3ZzLFoPJVjRRT"
DEFAULT_POSTHOG_HOST = "https://d18m0xvdtnkibr.cloudfront.net"


class Analytics:
    """PostHog analytics integration with opt-out telemetry."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        host: Optional[str] = None,
    ):
        """
        Initialize analytics.

        Analytics are enabled by default with anonymous tracking.
        Set MODELCONTEXTPROTOCOL_TELEMETRY=false to disable.

        Args:
            api_key: PostHog API key (uses default if None)
            host: PostHog host URL (uses default if None)
        """
        # Check telemetry opt-out
        telemetry_enabled = os.getenv("MODELCONTEXTPROTOCOL_TELEMETRY", "true").lower()
        self.enabled = telemetry_enabled not in ("false", "0", "no", "off")

        if not self.enabled:
            logger.debug("Telemetry disabled via MODELCONTEXTPROTOCOL_TELEMETRY")
            self.api_key = None
            self.host = None
            self.client = None
            return

        # Use provided keys or defaults
        self.api_key = api_key or DEFAULT_POSTHOG_KEY
        self.host = host or DEFAULT_POSTHOG_HOST
        self.client = None

        try:
            import posthog

            posthog.api_key = self.api_key
            posthog.host = self.host
            self.client = posthog
            logger.debug("PostHog analytics enabled (anonymized)")
        except ImportError:
            logger.warning("PostHog not installed, analytics disabled")
            self.enabled = False
        except Exception as e:
            logger.warning(f"Failed to initialize PostHog: {e}")
            self.enabled = False

    def track_event(self, event_name: str, properties: Optional[Dict[str, Any]] = None) -> None:
        """
        Track an analytics event.

        Args:
            event_name: Name of the event
            properties: Event properties
        """
        if not self.enabled or not self.client:
            return

        try:
            self.client.capture(
                distinct_id="anonymous",  # Can be customized
                event=event_name,
                properties=properties or {},
            )
            logger.debug(f"Tracked event: {event_name}")
        except Exception as e:
            logger.debug(f"Failed to track event: {e}")

    def identify(self, user_id: str, properties: Optional[Dict[str, Any]] = None) -> None:
        """
        Identify a user.

        Args:
            user_id: User identifier
            properties: User properties
        """
        if not self.enabled or not self.client:
            return

        try:
            self.client.identify(distinct_id=user_id, properties=properties or {})
            logger.debug(f"Identified user: {user_id}")
        except Exception as e:
            logger.debug(f"Failed to identify user: {e}")
