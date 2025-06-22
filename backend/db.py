import motor.motor_asyncio
from .config import settings

# Initialize MongoDB client with configuration
client = motor.motor_asyncio.AsyncIOMotorClient(settings.get_database_url())
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
    """Ensure all required indexes exist"""
    try:
        print("📊 Setting up database indexes...")
        
        # Clean up any documents with null email values before creating unique indexes
        print("🧹 Cleaning up documents with null email values...")
        await db.trainees.delete_many({"email": None})
        await db.admins.delete_many({"email": None})
        
        # Drop existing indexes to avoid conflicts
        try:
            await db.trainees.drop_index("email_1")
        except:
            pass
        try:
            await db.trainees.drop_index("empId_1")
        except:
            pass
        try:
            await db.admins.drop_index("email_1")
        except:
            pass
        
        # Create new indexes
        print("🔧 Creating trainees indexes...")
        await db.trainees.create_index("email", unique=True, sparse=True)
        await db.trainees.create_index("empId", unique=True, sparse=True)
        await db.trainees.create_index("status")
        await db.trainees.create_index("phase")
        
        print("🔧 Creating admins indexes...")
        await db.admins.create_index("email", unique=True, sparse=True)
        
        print("✅ Database indexes created successfully")
        return True
    except Exception as e:
        print(f"❌ Error ensuring indexes: {e}")
        return False
