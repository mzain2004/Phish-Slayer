
"""
tool_registry.py — T in ETCSLV.
All external tool calls registered here. Agents call tools via registry only.
Never call external APIs directly from agent files.
Phase 2: skeleton. Tools implemented per phase.
"""

from dataclasses import dataclass
from typing import Callable, Optional, Any


@dataclass
class ToolDefinition:
    """Single registered tool."""
    name: str
    description: str
    requires_human_approval: bool
    fn: Callable


class ToolRegistry:
    """
    Central tool registry. Agents look up tools by name.
    Tools requiring human approval will block until approved.
    """

    def __init__(self):
        self._tools: dict[str, ToolDefinition] = {}

    def register(self, tool: ToolDefinition) -> None:
        """Register a tool. Phase 3+ will call this for each tool."""
        pass

    def get(self, name: str) -> Optional[ToolDefinition]:
        """Look up tool by name. Returns None if not found."""
        pass

    def execute(self, name: str, **kwargs) -> Any:
        """
        Execute tool by name. Checks human approval gate before running.
        block_ip ALWAYS requires approval — enforced here, not in agent.
        """
        pass

    def list_tools(self) -> list[str]:
        """Return names of all registered tools."""
        pass
