#!/usr/bin/env python3
"""
Maverick Pathfinder Dashboard Backend Startup Script
This script initializes the backend services and ensures proper setup.
"""

import asyncio
import sys
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

async def test_services():
    """Test all backend services"""
    print("🔧 Testing backend services...")
    
    try:
        from .db import get_database
        from .ai_agent import create_trainee_profile, test_ollama_connection, generate_training_recommendations, extract_text_from_pdf, extract_text_from_docx, fast_extract_resume_fields
        from .email_service import send_welcome_email_smtp, test_smtp_connection
        from .models import Admin, Trainee
        from .auth import create_access_token, verify_token
        
        from .db import test_db_connection
        # Test database connection
        print("📊 Testing database connection...")
        db_status, db_message = await test_db_connection()
        print(f"   Database: {'✅' if db_status else '❌'} {db_message}")
        
        # Test Ollama connection
        print("🤖 Testing Ollama connection...")
        ollama_status, ollama_message = await test_ollama_connection()
        print(f"   Ollama: {'✅' if ollama_status else '❌'} {ollama_message}")
        
        # Test Gmail SMTP connection
        print("📧 Testing EmailJS connection...")
        smtp_status, smtp_message = await test_smtp_connection()
        print(f"   EmailJS: {'✅' if smtp_status else '❌'} {smtp_message}")
        
        # Overall status
        if db_status and ollama_status and smtp_status:
            print("\n🎉 All services are ready!")
            return True
        else:
            print("\n⚠️  Some services are not ready. Check the configuration.")
            return False
            
    except Exception as e:
        print(f"❌ Error testing services: {e}")
        return False


async def initialize_database():
    """Initialize database with required collections and indexes"""
    try:
        from .db import get_database
        
        database = get_database.get_database()
        
        # Create indexes for better performance
        print("📊 Creating database indexes...")
        
        # Trainees collection indexes
        await database.trainees.create_index("email", unique=True)
        await database.trainees.create_index("empId", unique=True)
        await database.trainees.create_index("status")
        
        # Admins collection indexes
        await database.admins.create_index("email", unique=True)
        
        print("✅ Database indexes created")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

async def migrate_completed_subcourses():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['maverick']  # Change to your actual DB name if different
    trainees = db['trainees']
    async for trainee in trainees.find({"completed_subcourses": {"$exists": False}}):
        await trainees.update_one({"_id": trainee["_id"]}, {"$set": {"completed_subcourses": []}})
    print("Migration complete: ensured all trainees have completed_subcourses field.")

async def main():
    """Main initialization function"""
    print("🚀 Maverick Pathfinder Dashboard Backend Initialization")
    print("=" * 60)
    
    # Test all services
    services_ready = await test_services()
    
    if services_ready:
        # Initialize database
        await initialize_database()
        
        
        # Migrate completed subcourses
        await migrate_completed_subcourses()
        
        print("\n🎯 Backend is ready to start!")
        print("💡 Run 'python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000' to start the server")
        
    else:
        print("\n❌ Backend initialization failed. Please check your configuration.")
        sys.exit(1)

if __name__ == "__main__":
    # To run this script directly for setup, use:
    # python -m backend.startup
    asyncio.run(main()) 