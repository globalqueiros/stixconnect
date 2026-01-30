"""
Router de Arquivos
Upload e gerenciamento de arquivos via AWS S3
"""

from typing import Optional, List
from datetime import datetime
import uuid
import mimetypes
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.models import User

router = APIRouter(prefix="/files", tags=["Arquivos"])

# Tipos de arquivo permitidos
ALLOWED_CONTENT_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/dicom",
    "application/dicom",
]

# Tamanho máximo: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024


class FileUploadResponse(BaseModel):
    url: str
    filename: str
    original_name: str
    content_type: str
    size: int


class FileInfo(BaseModel):
    id: int
    patient_id: Optional[int]
    filename: str
    original_name: str
    url: str
    content_type: str
    size: int
    uploaded_by: int
    uploaded_at: datetime


from app.services.s3_service import get_s3_service

def get_s3_client():
    """Retorna cliente S3 ou None se não configurado (legacy)"""
    s3_service = get_s3_service()
    return s3_service.s3_client if s3_service.is_configured() else None


def generate_s3_key(patient_id: Optional[int], filename: str) -> str:
    """Gera chave única para o arquivo no S3"""
    now = datetime.utcnow()
    unique_id = str(uuid.uuid4())[:8]
    
    # Sanitizar nome do arquivo
    safe_filename = "".join(c for c in filename if c.isalnum() or c in '.-_')
    
    if patient_id:
        return f"patients/{patient_id}/{now.year}/{now.month:02d}/{unique_id}_{safe_filename}"
    else:
        return f"uploads/{now.year}/{now.month:02d}/{unique_id}_{safe_filename}"


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Faz upload de um arquivo para o S3"""
    
    # Validar tipo de arquivo
    content_type = file.content_type or mimetypes.guess_type(file.filename)[0]
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido. Tipos aceitos: PDF, JPG, PNG, DICOM"
        )
    
    # Ler conteúdo do arquivo
    file_content = await file.read()
    
    # Validar tamanho
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Arquivo muito grande. Tamanho máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Gerar chave S3
    s3_key = generate_s3_key(patient_id, file.filename)
    
    # Tentar upload para S3
    s3_client = get_s3_client()
    
    if s3_client:
        try:
            s3_client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type
            )
            url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao fazer upload para S3: {str(e)}"
            )
    else:
        # S3 não configurado - salvar localmente (desenvolvimento)
        import os
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        local_path = os.path.join(upload_dir, s3_key.replace("/", "_"))
        with open(local_path, "wb") as f:
            f.write(file_content)
        
        url = f"/uploads/{s3_key.replace('/', '_')}"
    
    return FileUploadResponse(
        url=url,
        filename=s3_key,
        original_name=file.filename,
        content_type=content_type,
        size=len(file_content)
    )


@router.get("/patient/{patient_id}", response_model=List[FileInfo])
async def get_patient_files(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista arquivos de um paciente (stub - implementar com tabela de arquivos)"""
    # TODO: Implementar tabela de arquivos e listar do banco
    return []


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deleta um arquivo (stub - implementar com tabela de arquivos)"""
    # TODO: Implementar deleção do S3 e banco
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Funcionalidade ainda não implementada"
    )


@router.get("/{file_id}/download-url")
async def get_download_url(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Gera URL temporária para download (stub)"""
    # TODO: Implementar com presigned URL do S3
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Funcionalidade ainda não implementada"
    )
