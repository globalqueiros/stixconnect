"""
WebSocket endpoints para comunicação em tempo real durante consultas
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import json

from app.core.database import get_db
from app.core.security import get_current_user, decode_token
from app.models.models import Consulta, User
from app.websockets.connection_manager import get_manager

router = APIRouter(prefix="/ws", tags=["WebSocket"])


async def get_user_from_token(websocket: WebSocket, token: Optional[str] = None) -> Optional[User]:
    """Valida token JWT do WebSocket e retorna usuário"""
    if not token:
        return None
    
    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
        token_data = decode_token(token)
        user = db.query(User).filter(User.email == token_data.email).first()
        if not user or not user.ativo:
            return None
        return user
    except Exception:
        return None


@router.websocket("/consultations/{consulta_id}")
async def consultation_websocket(
    websocket: WebSocket,
    consulta_id: int,
    token: Optional[str] = None
):
    """
    WebSocket endpoint para comunicação em tempo real durante uma consulta
    
    Query params:
    - token: JWT token do usuário (Bearer token)
    """
    manager = get_manager()
    user = None
    
    # Tentar obter token de query params ou headers
    if not token:
        # Tentar pegar do header Authorization
        auth_header = websocket.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        # Tentar pegar de query params
        query_params = dict(websocket.query_params)
        token = query_params.get("token")
    
    # Validar token e obter usuário
    if token:
        user = await get_user_from_token(websocket, token)
    
    if not user:
        await websocket.close(code=4001, reason="Token inválido ou ausente")
        return
    
    # Verificar se a consulta existe e usuário tem acesso
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        consulta = db.query(Consulta).filter(Consulta.id == consulta_id).first()
        if not consulta:
            await websocket.close(code=4004, reason="Consulta não encontrada")
            return
        
        # Verificar permissão: paciente, enfermeira ou médico da consulta
        has_access = (
            consulta.paciente_id == user.id or
            consulta.enfermeira_id == user.id or
            consulta.medico_id == user.id or
            user.role.value in ["admin", "supervisor"]
        )
        
        if not has_access:
            await websocket.close(code=4003, reason="Acesso negado a esta consulta")
            return
        
        # Conectar à sala
        await manager.connect(
            websocket,
            consulta_id,
            {
                "id": user.id,
                "nome": user.nome,
                "email": user.email,
                "role": user.role.value,
            }
        )
        
        # Loop principal de mensagens
        try:
            while True:
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    message_type = message.get("type")
                    
                    # Tipos de mensagens suportadas
                    if message_type == "message":
                        # Mensagem de chat
                        await manager.broadcast_to_room(
                            consulta_id,
                            {
                                "type": "message",
                                "sender": {
                                    "id": user.id,
                                    "nome": user.nome,
                                    "role": user.role.value,
                                },
                                "content": message.get("content", ""),
                                "timestamp": datetime.utcnow().isoformat(),
                            },
                            exclude=[websocket]
                        )
                    
                    elif message_type == "status_update":
                        # Atualização de status (apenas admin/enfermeira/médico)
                        if user.role.value in ["admin", "supervisor", "nurse", "doctor"]:
                            await manager.broadcast_to_room(
                                consulta_id,
                                {
                                    "type": "status_update",
                                    "status": message.get("status"),
                                    "updated_by": {
                                        "id": user.id,
                                        "nome": user.nome,
                                    },
                                    "timestamp": datetime.utcnow().isoformat(),
                                }
                            )
                    
                    elif message_type == "typing":
                        # Indicador de digitação
                        await manager.broadcast_to_room(
                            consulta_id,
                            {
                                "type": "typing",
                                "user": {
                                    "id": user.id,
                                    "nome": user.nome,
                                },
                                "is_typing": message.get("is_typing", False),
                                "timestamp": datetime.utcnow().isoformat(),
                            },
                            exclude=[websocket]
                        )
                    
                    elif message_type == "ping":
                        # Heartbeat
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat(),
                        })
                    
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Tipo de mensagem desconhecido: {message_type}",
                        })
                
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Formato JSON inválido",
                    })
        
        except WebSocketDisconnect:
            manager.disconnect(websocket)
        except Exception as e:
            print(f"Erro no WebSocket: {e}")
            manager.disconnect(websocket)
    
    finally:
        db.close()
