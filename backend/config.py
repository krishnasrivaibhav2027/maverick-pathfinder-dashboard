"""
Configuration settings for Maverick Pathfinder Dashboard Backend
"""

import os
from typing import Optional

class Settings:
    """Application settings"""
    
    # Database settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb+srv://gksvaibav99:admin@cluster0.rc32pqz.mongodb.net/")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "maverick_dashboard")
    
    # MailerSend settings
    MAILERSEND_API_KEY: str = os.getenv("MAILERSEND_API_KEY", "mlsn.e761f383cddfe859071f8d2df8f18d48ce31c7367097ac1a39007c18ff178462")
    MAILERSEND_TEMPLATE_ID: str = os.getenv("MAILERSEND_TEMPLATE_ID", "zr6ke4ne5934on12")
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "gksvaibav99@gmail.com")
    SENDER_NAME: str = os.getenv("SENDER_NAME", "AI Agent")
    
    # SMTP settings from MailerSend
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.mailersend.net")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "MS_aYOfca@test-2p0347z8nz3lzdrn.mlsender.net")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "mssp.tcYYYvK.o65qngkjyy3lwr12.NDALZ7H")
    
    # Ollama settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    OLLAMA_TEMPERATURE: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.7"))
    
    # Application settings
    APP_NAME: str = "Maverick Pathfinder Dashboard"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS settings
    ALLOWED_ORIGINS: list = [
        "http://localhost:8082",
        "http://localhost:8081", 
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "6289e99246e7449c0be04e209654f2322c3ebf97768539d7d4fd8b77f5f4774a")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Email templates
    WELCOME_EMAIL_SUBJECT: str = "🎉 Welcome to Maverick Pathfinder - Your Training Journey Begins!"
    PASSWORD_RESET_SUBJECT: str = "🔐 Maverick Pathfinder - Password Reset"
    
    @classmethod
    def get_database_url(cls) -> str:
        """Get the complete database URL"""
        return cls.MONGODB_URL
    
    @classmethod
    def get_mailersend_config(cls) -> dict:
        """Get MailerSend configuration"""
        return {
            "api_key": cls.MAILERSEND_API_KEY,
            "template_id": cls.MAILERSEND_TEMPLATE_ID,
            "sender_email": cls.SENDER_EMAIL,
            "sender_name": cls.SENDER_NAME
        }
    
    @classmethod
    def get_ollama_config(cls) -> dict:
        """Get Ollama configuration"""
        return {
            "base_url": cls.OLLAMA_BASE_URL,
            "model": cls.OLLAMA_MODEL,
            "temperature": cls.OLLAMA_TEMPERATURE
        }

# Create settings instance
settings = Settings() 