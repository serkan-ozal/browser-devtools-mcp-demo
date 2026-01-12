"""Useful decorators for MCP development."""

import functools
from typing import Any, Callable
from loguru import logger


def with_logging(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator to add logging to a function.

    Example:
        @with_logging
        async def my_tool(param: str) -> str:
            return f"Result: {param}"
    """

    @functools.wraps(func)
    async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
        func_name = func.__name__
        logger.info(f"Calling {func_name} with args={args}, kwargs={kwargs}")
        try:
            result = await func(*args, **kwargs)
            logger.success(f"{func_name} completed successfully")
            return result
        except Exception as e:
            logger.error(f"{func_name} failed: {e}")
            raise

    @functools.wraps(func)
    def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
        func_name = func.__name__
        logger.info(f"Calling {func_name} with args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            logger.success(f"{func_name} completed successfully")
            return result
        except Exception as e:
            logger.error(f"{func_name} failed: {e}")
            raise

    import inspect

    if inspect.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper


def with_retry(max_attempts: int = 3, delay: float = 1.0):
    """
    Decorator to retry a function on failure.

    Args:
        max_attempts: Maximum number of retry attempts
        delay: Delay between retries in seconds

    Example:
        @with_retry(max_attempts=3)
        async def fetch_data(url: str) -> dict:
            # May fail and retry
            pass
    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            import asyncio

            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        logger.error(
                            f"{func.__name__} failed after {max_attempts} attempts"
                        )
                        raise
                    logger.warning(
                        f"{func.__name__} attempt {attempt} failed: {e}. "
                        f"Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            import time

            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        logger.error(
                            f"{func.__name__} failed after {max_attempts} attempts"
                        )
                        raise
                    logger.warning(
                        f"{func.__name__} attempt {attempt} failed: {e}. "
                        f"Retrying in {delay}s..."
                    )
                    time.sleep(delay)

        import inspect

        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator
