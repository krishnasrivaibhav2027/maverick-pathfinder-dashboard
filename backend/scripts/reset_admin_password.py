from passlib.context import CryptContext
from pymongo import MongoClient

MONGODB_URL = "mongodb+srv://gksvaibav99:vaibhu2027@cluster0.rc32pqz.mongodb.net/mydatabase?retryWrites=true&w=majority&tls=true"
DATABASE_NAME = "maverick_dashboard"
NEW_PASSWORD = "admin123"  # Set your new password here

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

hashed_pw = pwd_context.hash(NEW_PASSWORD)
result = db.admins.update_many({}, {"$set": {"password": hashed_pw}})
print(f"Updated {result.modified_count} admin(s) with new password: {NEW_PASSWORD}") 