from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./stixconnect.db"
    DB_HOST: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_NAME: Optional[str] = None
    DB_PORT: int = 3306
    
    # Zoom API
    ZOOM_ACCOUNT_ID: str = ""
    ZOOM_CLIENT_ID: str = ""
    ZOOM_CLIENT_SECRET: str = ""
    
    # JWT / Autenticação
    SECRET_KEY: str = "default-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "stixconnect-files"
    
    # Twilio
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Aplicação
    APP_NAME: str = "StixConnect"
    DEBUG: bool = True
    
    # CORS - origens permitidas
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",  # Frontend StixConnect
        "http://localhost:3001",  # Frontend Nexus Admin
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://stixconnect.com",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()