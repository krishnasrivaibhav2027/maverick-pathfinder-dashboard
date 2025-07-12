from passlib.context import CryptContext
from pymongo import MongoClient
import os

# Use the provided MongoDB Atlas connection string
MONGODB_URL = "mongodb+srv://gksvaibav99:vaibhu2027@cluster0.rc32pqz.mongodb.net/mydatabase?retryWrites=true&w=majority&tls=true"
DATABASE_NAME = "maverick_dashboard"  # Change if your DB name is different

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

for admin in db.admins.find():
    plain_pw = admin.get("password", "")
    # Only hash if not already hashed (very basic check)
    if not plain_pw.startswith("$2b$"):
        hashed_pw = pwd_context.hash(plain_pw)
        db.admins.update_one({"_id": admin["_id"]}, {"$set": {"password": hashed_pw}})
        print(f"Updated admin {admin.get('email', admin.get('empId', ''))} with hashed password.")
    else:
        print(f"Admin {admin.get('email', admin.get('empId', ''))} already has a hashed password.")
print("Done.") 