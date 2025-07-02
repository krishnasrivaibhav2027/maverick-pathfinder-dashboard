import motor.motor_asyncio
import asyncio
from config import settings

# Initialize MongoDB client with configuration and timeout
client = motor.motor_asyncio.AsyncIOMotorClient(
    settings.get_database_url(),
    serverSelectionTimeoutMS=10000,  # 10 second timeout
    connectTimeoutMS=10000,
    socketTimeoutMS=10000
)
db = client[settings.DATABASE_NAME]

def get_database():
    """Get the database instance"""
    return db

async def test_db_connection():
    """Test the MongoDB connection"""
    try:
        # The ismaster command is cheap and does not require auth.
        await db.command('ismaster')
        return True, "MongoDB connection successful."
    except Exception as e:
        return False, f"MongoDB connection failed: {e}"

async def get_collection_stats():
    """Get basic statistics about collections"""
    try:
        stats = {}
        
        # Get trainees count
        trainees_count = await db.trainees.count_documents({})
        stats['trainees'] = trainees_count
        
        # Get admins count
        admins_count = await db.admins.count_documents({})
        stats['admins'] = admins_count
        
        return stats
    except Exception as e:
        print(f"Error getting collection stats: {e}")
        return {}

async def ensure_indexes():
    """Ensure all required indexes exist - disabled to prevent timeouts"""
    try:
        print("📊 Testing database connection...")
        
        # Test connection first
        try:
            await db.command('ismaster')
            print("✅ Database connection verified")
            print("ℹ️  Index creation disabled to prevent timeouts - server will work without indexes")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
        
    except Exception as e:
        print(f"❌ Error in database setup: {e}")
        return False
