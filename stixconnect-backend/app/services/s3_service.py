"""
Serviço de integração com AWS S3 para upload de arquivos
"""

import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from typing import Optional, Tuple
import uuid
from datetime import datetime
from app.core.config import settings


class S3Service:
    """Serviço para gerenciar uploads no AWS S3"""
    
    def __init__(self):
        self.bucket = settings.AWS_S3_BUCKET
        self.region = settings.AWS_REGION
        self.s3_client = None
        
        # Inicializar cliente S3 se credenciais disponíveis
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=self.region
                )
            except Exception as e:
                print(f"Erro ao inicializar cliente S3: {e}")
                self.s3_client = None
    
    def is_configured(self) -> bool:
        """Verifica se o S3 está configurado"""
        return self.s3_client is not None
    
    def generate_key(self, patient_id: Optional[int], filename: str) -> str:
        """Gera chave única para o arquivo no S3"""
        now = datetime.utcnow()
        unique_id = str(uuid.uuid4())[:8]
        
        # Sanitizar nome do arquivo
        safe_filename = "".join(c for c in filename if c.isalnum() or c in '.-_')
        
        if patient_id:
            return f"patients/{patient_id}/{now.year}/{now.month:02d}/{unique_id}_{safe_filename}"
        else:
            return f"uploads/{now.year}/{now.month:02d}/{unique_id}_{safe_filename}"
    
    async def upload_file(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
        patient_id: Optional[int] = None
    ) -> Tuple[str, str]:
        """
        Faz upload de arquivo para S3
        
        Returns:
            (url, key) - URL pública e chave S3 do arquivo
        """
        if not self.is_configured():
            raise Exception("S3 não configurado. Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY.")
        
        key = self.generate_key(patient_id, filename)
        
        try:
            self.s3_client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=file_data,
                ContentType=content_type,
                ACL='private'  # Arquivos privados por padrão
            )
            
            # Gerar URL pública (ou presigned URL para privados)
            url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{key}"
            
            return url, key
        
        except ClientError as e:
            raise Exception(f"Erro ao fazer upload para S3: {str(e)}")
    
    async def delete_file(self, key: str) -> bool:
        """Deleta um arquivo do S3"""
        if not self.is_configured():
            return False
        
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False
    
    async def get_presigned_url(self, key: str, expiration: int = 3600) -> str:
        """
        Gera URL pré-assinada para download temporário
        
        Args:
            key: Chave do arquivo no S3
            expiration: Tempo de expiração em segundos (padrão: 1 hora)
        
        Returns:
            URL pré-assinada
        """
        if not self.is_configured():
            raise Exception("S3 não configurado")
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise Exception(f"Erro ao gerar URL pré-assinada: {str(e)}")
    
    async def file_exists(self, key: str) -> bool:
        """Verifica se um arquivo existe no S3"""
        if not self.is_configured():
            return False
        
        try:
            self.s3_client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False


# Instância singleton
_s3_service: Optional[S3Service] = None


def get_s3_service() -> S3Service:
    """Retorna instância singleton do S3Service"""
    global _s3_service
    if _s3_service is None:
        _s3_service = S3Service()
    return _s3_service
