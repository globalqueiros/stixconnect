"""
Connection Manager para gerenciar conexões WebSocket
"""

from typing import Dict, List, Set
from fastapi import WebSocket
import json
from datetime import datetime


class ConnectionManager:
    """Gerencia conexões WebSocket por sala (consulta)"""
    
    def __init__(self):
        # Dict[consulta_id, Set[websocket]]
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Dict[websocket, consulta_id]
        self.websocket_to_consulta: Dict[WebSocket, int] = {}
        # Dict[websocket, user_info]
        self.websocket_users: Dict[WebSocket, dict] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        consulta_id: int,
        user_info: dict
    ):
        """Aceita conexão e adiciona à sala da consulta"""
        await websocket.accept()
        
        if consulta_id not in self.active_connections:
            self.active_connections[consulta_id] = set()
        
        self.active_connections[consulta_id].add(websocket)
        self.websocket_to_consulta[websocket] = consulta_id
        self.websocket_users[websocket] = user_info
        
        # Notificar outros participantes que alguém entrou
        await self.broadcast_to_room(
            consulta_id,
            {
                "type": "user_joined",
                "user": {
                    "id": user_info.get("id"),
                    "nome": user_info.get("nome"),
                    "role": user_info.get("role"),
                },
                "timestamp": datetime.utcnow().isoformat(),
            },
            exclude=[websocket]
        )
        
        # Enviar lista de participantes atuais
        await self.send_participants_list(websocket, consulta_id)
    
    def disconnect(self, websocket: WebSocket):
        """Remove conexão da sala"""
        consulta_id = self.websocket_to_consulta.pop(websocket, None)
        
        if consulta_id and consulta_id in self.active_connections:
            self.active_connections[consulta_id].discard(websocket)
            
            # Se não há mais conexões na sala, remover a sala
            if not self.active_connections[consulta_id]:
                del self.active_connections[consulta_id]
        
        user_info = self.websocket_users.pop(websocket, None)
        
        # Notificar que usuário saiu
        if consulta_id and user_info:
            self._notify_user_left(consulta_id, user_info)
    
    async def send_personal_message(
        self,
        message: dict,
        websocket: WebSocket
    ):
        """Envia mensagem para um websocket específico"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Erro ao enviar mensagem: {e}")
            self.disconnect(websocket)
    
    async def broadcast_to_room(
        self,
        consulta_id: int,
        message: dict,
        exclude: List[WebSocket] = None
    ):
        """Envia mensagem para todos na sala da consulta"""
        if consulta_id not in self.active_connections:
            return
        
        exclude_set = set(exclude) if exclude else set()
        disconnected = []
        
        for connection in self.active_connections[consulta_id]:
            if connection in exclude_set:
                continue
            
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Erro ao fazer broadcast: {e}")
                disconnected.append(connection)
        
        # Remover conexões desconectadas
        for connection in disconnected:
            self.disconnect(connection)
    
    async def send_participants_list(
        self,
        websocket: WebSocket,
        consulta_id: int
    ):
        """Envia lista de participantes atuais da consulta"""
        if consulta_id not in self.active_connections:
            return
        
        participants = []
        for conn in self.active_connections[consulta_id]:
            user_info = self.websocket_users.get(conn)
            if user_info:
                participants.append({
                    "id": user_info.get("id"),
                    "nome": user_info.get("nome"),
                    "role": user_info.get("role"),
                })
        
        await self.send_personal_message(
            {
                "type": "participants_list",
                "participants": participants,
                "timestamp": datetime.utcnow().isoformat(),
            },
            websocket
        )
    
    async def _notify_user_left(
        self,
        consulta_id: int,
        user_info: dict
    ):
        """Notifica que um usuário saiu (sem bloquear)"""
        if consulta_id not in self.active_connections:
            return
        
        message = {
            "type": "user_left",
            "user": {
                "id": user_info.get("id"),
                "nome": user_info.get("nome"),
                "role": user_info.get("role"),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        for connection in list(self.active_connections.get(consulta_id, [])):
            try:
                await connection.send_json(message)
            except:
                pass
    
    def get_room_participants(self, consulta_id: int) -> List[dict]:
        """Retorna lista de participantes da sala"""
        if consulta_id not in self.active_connections:
            return []
        
        participants = []
        for conn in self.active_connections[consulta_id]:
            user_info = self.websocket_users.get(conn)
            if user_info:
                participants.append(user_info)
        
        return participants
    
    def get_connection_count(self, consulta_id: int) -> int:
        """Retorna número de conexões ativas na sala"""
        return len(self.active_connections.get(consulta_id, []))


# Instância singleton
_manager: ConnectionManager = None


def get_manager() -> ConnectionManager:
    """Retorna instância singleton do ConnectionManager"""
    global _manager
    if _manager is None:
        _manager = ConnectionManager()
    return _manager
