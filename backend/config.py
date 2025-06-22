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
    
    # EmailJS settings
    EMAILJS_PUBLIC_KEY: str = os.getenv("EMAILJS_PUBLIC_KEY", "eaBdGX9iZD0BzCpex")
    EMAILJS_SERVICE_ID: str = os.getenv("EMAILJS_SERVICE_ID", "service_2s0dkxv")
    EMAILJS_TEMPLATE_ID: str = os.getenv("EMAILJS_TEMPLATE_ID", "template_x2bo3pz")
    
    # Email sender settings
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "gksvaibav99@gmail.com")
    SENDER_NAME: str = os.getenv("SENDER_NAME", "Maverick Pathfinder Training")
    
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
    def validate_emailjs_config(cls) -> tuple[bool, str]:
        """Validate EmailJS configuration"""
        if not cls.EMAILJS_PUBLIC_KEY:
            return False, "EmailJS Public Key not configured. Please set EMAILJS_PUBLIC_KEY environment variable."
        if not cls.EMAILJS_SERVICE_ID:
            return False, "EmailJS Service ID not configured. Please set EMAILJS_SERVICE_ID environment variable."
        if not cls.EMAILJS_TEMPLATE_ID:
            return False, "EmailJS Template ID not configured. Please set EMAILJS_TEMPLATE_ID environment variable."
        return True, "EmailJS configuration is valid."
    
    @classmethod
    def print_config_debug(cls):
        """Print debug information about email configuration"""
        print("🔧 EmailJS Configuration Debug Info:")
        print(f"   📧 EmailJS Public Key: {cls.EMAILJS_PUBLIC_KEY[:10]}..." if cls.EMAILJS_PUBLIC_KEY else "   📧 EmailJS Public Key: Not configured")
        print(f"   📧 EmailJS Service ID: {cls.EMAILJS_SERVICE_ID}")
        print(f"   📧 EmailJS Template ID: {cls.EMAILJS_TEMPLATE_ID}")
        print(f"   📧 Sender Email: {cls.SENDER_EMAIL}")
        print(f"   📧 Sender Name: {cls.SENDER_NAME}")
        print(f"   🐛 Debug Mode: {cls.DEBUG}")

# Create settings instance
settings = Settings()
