"""
WebSocket module for real-time communication
"""

from .connection_manager import ConnectionManager, get_manager
from .consultation_ws import router as ws_router

__all__ = ["ConnectionManager", "get_manager", "ws_router"]
