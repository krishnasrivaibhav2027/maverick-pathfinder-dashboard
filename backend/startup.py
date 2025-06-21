#!/usr/bin/env python3
"""
Maverick Pathfinder Dashboard Backend Startup Script
This script initializes the backend services and ensures proper setup.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

async def test_services():
    """Test all backend services"""
    print("🔧 Testing backend services...")
    
    try:
        import db
        import ai_agent
        import email_service
        
        # Test database connection
        print("📊 Testing database connection...")
        db_status, db_message = await db.test_db_connection()
        print(f"   Database: {'✅' if db_status else '❌'} {db_message}")
        
        # Test Ollama connection
        print("🤖 Testing Ollama connection...")
        ollama_status, ollama_message = await ai_agent.test_ollama_connection()
        print(f"   Ollama: {'✅' if ollama_status else '❌'} {ollama_message}")
        
        # Test MailerSend connection
        print("📧 Testing MailerSend connection...")
        mailersend_status, mailersend_message = email_service.test_mailersend_connection()
        print(f"   MailerSend: {'✅' if mailersend_status else '❌'} {mailersend_message}")
        
        # Overall status
        if db_status and ollama_status and mailersend_status:
            print("\n🎉 All services are ready!")
            return True
        else:
            print("\n⚠️  Some services are not ready. Check the configuration.")
            return False
            
    except Exception as e:
        print(f"❌ Error testing services: {e}")
        return False

async def create_sample_admin():
    """Create a sample admin user if none exists"""
    try:
        import db
        import models
        from datetime import datetime
        
        database = db.get_database()
        
        # Check if admin exists
        admin_count = await database.admins.count_documents({})
        
        if admin_count == 0:
            print("👤 Creating sample admin user...")
            
            sample_admin = models.Admin(
                name="Admin User",
                email="admin@maverick.com",
                password="admin123",
                role="admin",
                created_at=datetime.now().isoformat()
            )
            
            await database.admins.insert_one(sample_admin.dict())
            print("✅ Sample admin created: admin@maverick.com / admin123")
        else:
            print("👤 Admin users already exist")
            
    except Exception as e:
        print(f"❌ Error creating sample admin: {e}")

async def initialize_database():
    """Initialize database with required collections and indexes"""
    try:
        import db
        
        database = db.get_database()
        
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

async def main():
    """Main initialization function"""
    print("🚀 Maverick Pathfinder Dashboard Backend Initialization")
    print("=" * 60)
    
    # Test all services
    services_ready = await test_services()
    
    if services_ready:
        # Initialize database
        await initialize_database()
        
        # Create sample admin
        await create_sample_admin()
        
        print("\n🎯 Backend is ready to start!")
        print("💡 Run 'python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000' to start the server")
        
    else:
        print("\n❌ Backend initialization failed. Please check your configuration.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 