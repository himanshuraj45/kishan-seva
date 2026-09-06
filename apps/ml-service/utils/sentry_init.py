"""
KisanSeva ML Service — Sentry initialisation
Import this at the very top of main.py before anything else.
"""
import os
import logging

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    """Initialise Sentry SDK for the FastAPI ML service."""
    dsn = os.getenv("SENTRY_DSN", "")
    if not dsn:
        logger.warning("SENTRY_DSN not set — Sentry monitoring disabled")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.httpx import HttpxIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration

        sentry_sdk.init(
            dsn=dsn,
            environment=os.getenv("NODE_ENV", "development"),
            release=f"kisanseva-ml@{os.getenv('APP_VERSION', '1.0.0')}",

            # Capture 100% of transactions in dev, 20% in prod
            traces_sample_rate=0.2 if os.getenv("NODE_ENV") == "production" else 1.0,

            # Capture 100% of profiles
            profiles_sample_rate=0.1,

            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                HttpxIntegration(),
                LoggingIntegration(
                    level=logging.WARNING,       # Capture warnings+
                    event_level=logging.ERROR,   # Send errors as events
                ),
            ],

            # Tag every event with agent context
            before_send=_before_send,

            # Ignore noisy non-critical errors
            ignore_errors=[
                KeyboardInterrupt,
                ConnectionResetError,
            ],
        )

        # Set global tags
        sentry_sdk.set_tag("service", "kisanseva-ml")
        sentry_sdk.set_tag("component", "agent-orchestrator")
        logger.info("✅ Sentry initialised for ML service")

    except ImportError:
        logger.warning("sentry-sdk not installed — run: pip install sentry-sdk[fastapi]")
    except Exception as e:
        logger.error(f"Sentry init failed: {e}")


def _before_send(event: dict, hint: dict) -> dict | None:
    """Filter and enrich Sentry events before sending."""
    exc = hint.get("exc_info")
    if exc:
        exc_type = exc[0]
        # Drop connection errors (likely farmer network issues, not our bugs)
        if exc_type in (ConnectionResetError, BrokenPipeError, TimeoutError):
            return None

    # Attach agent name if available in extra
    agent = event.get("extra", {}).get("agent_name")
    if agent:
        event.setdefault("tags", {})["agent"] = agent

    return event


def capture_agent_error(
    error: Exception,
    agent_name: str,
    query: str = "",
    user_id: str = "",
) -> None:
    """Capture an agent-level error with full context.

    Args:
        error: The exception to report.
        agent_name: Name of the agent that failed (e.g. 'WeatherAdvisoryAgent').
        query: The farmer query that triggered the error.
        user_id: Farmer user ID for grouping.
    """
    try:
        import sentry_sdk
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("agent", agent_name)
            scope.set_tag("has_query", bool(query))
            scope.set_user({"id": user_id} if user_id else None)
            scope.set_extra("agent_name", agent_name)
            scope.set_extra("query_preview", query[:200] if query else "")
            scope.set_level("error")
            sentry_sdk.capture_exception(error)
    except Exception:
        pass  # Never let Sentry break the app
