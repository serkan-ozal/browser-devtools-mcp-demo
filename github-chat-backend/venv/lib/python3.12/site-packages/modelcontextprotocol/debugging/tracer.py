"""Tracing utilities for MCP operations."""

import time
import functools
from typing import Any, Callable
from .logger import MCPLogger


class Tracer:
    """Traces MCP operations for debugging."""

    def __init__(self, logger: MCPLogger):
        self.logger = logger

    def trace_operation(
        self, operation_name: str, func: Callable[..., Any]
    ) -> Callable[..., Any]:
        """
        Trace a function execution.

        Args:
            operation_name: Name of the operation
            func: Function to trace

        Returns:
            Wrapped function with tracing
        """

        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            start_time = time.time()
            self.logger.info(f"Starting {operation_name}")

            try:
                result = await func(*args, **kwargs)
                elapsed = time.time() - start_time
                self.logger.info(
                    f"Completed {operation_name} in {elapsed:.3f}s"
                )
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                self.logger.error(
                    f"Failed {operation_name} after {elapsed:.3f}s: {e}"
                )
                raise

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            start_time = time.time()
            self.logger.info(f"Starting {operation_name}")

            try:
                result = func(*args, **kwargs)
                elapsed = time.time() - start_time
                self.logger.info(
                    f"Completed {operation_name} in {elapsed:.3f}s"
                )
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                self.logger.error(
                    f"Failed {operation_name} after {elapsed:.3f}s: {e}"
                )
                raise

        # Check if function is async
        import inspect

        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper


def trace_call(operation_name: str) -> Callable[[Callable], Callable]:
    """
    Decorator to trace function calls.

    Args:
        operation_name: Name of the operation

    Returns:
        Decorator function

    Example:
        ```python
        @trace_call("my_operation")
        async def my_function():
            pass
        ```
    """
    logger = MCPLogger()
    tracer = Tracer(logger)

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        return tracer.trace_operation(operation_name, func)

    return decorator
