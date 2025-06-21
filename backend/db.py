import motor.motor_asyncio

MONGODB_URL = "mongodb+srv://gksvaibav99:admin@cluster0.rc32pqz.mongodb.net/"
DATABASE_NAME = "maverick_dashboard"  # You can change this to your preferred DB name

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

def get_database():
    return db 