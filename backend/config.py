
"""
Configuration settings for Maverick Pathfinder Dashboard Backend
"""

import os
from dotenv import load_dotenv
from typing import Optional

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings"""
    
    # Database settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb+srv://gksvaibav99:admin@cluster0.rc32pqz.mongodb.net/maverick_dashboard?retryWrites=true&w=majority")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "maverick_dashboard")
    
    # Email settings
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "gksvaibav99@gmail.com")
    SENDER_NAME: str = os.getenv("SENDER_NAME", "Maverick Pathfinder Training")
    
    # SMTP settings for Gmail
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "gksvaibav99@gmail.com")
    # IMPORTANT: Use Gmail App Password, not your regular password
    # To generate: Google Account > Security > 2-Step Verification > App passwords
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "your_app_password")  # Replace with actual app password
    
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
        "http://localhost:8080",
        "http://localhost:8081", 
        "http://localhost:8082",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://localhost:8080",
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
    def get_ollama_config(cls) -> dict:
        """Get Ollama configuration"""
        return {
            "base_url": cls.OLLAMA_BASE_URL,
            "model": cls.OLLAMA_MODEL,
            "temperature": cls.OLLAMA_TEMPERATURE
        }
    
    @classmethod
    def validate_gmail_config(cls) -> tuple[bool, str]:
        """Validate Gmail SMTP configuration"""
        if not cls.SMTP_PASSWORD or cls.SMTP_PASSWORD == "your_app_password":
            return False, "Gmail App Password not configured. Please set SMTP_PASSWORD environment variable."
        if not cls.SMTP_USERNAME or not cls.SENDER_EMAIL:
            return False, "Gmail username or sender email not configured."
        return True, "Gmail configuration is valid."

# Create settings instance
settings = Settings()
