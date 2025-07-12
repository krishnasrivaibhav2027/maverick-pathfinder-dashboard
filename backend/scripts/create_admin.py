import argparse
from passlib.context import CryptContext
from pymongo import MongoClient
import os

# Use the provided MongoDB Atlas connection string
MONGODB_URL = "mongodb+srv://gksvaibav99:vaibhu2027@cluster0.rc32pqz.mongodb.net/mydatabase?retryWrites=true&w=majority&tls=true"
DATABASE_NAME = "maverick_dashboard"  # Change if your DB name is different

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

def get_password_hash(password):
    return pwd_context.hash(password)

def create_admin(name, email, password):
    """Creates a new admin user with a hashed password."""
    try:
        # Check if admin already exists
        if db.admins.find_one({"email": email}):
            print(f"Admin with email {email} already exists.")
            return

        # Create new admin with hashed password
        admin = {
            "name": name,
            "email": email,
            "password": get_password_hash(password),
            "role": "admin"
        }
        db.admins.insert_one(admin)
        print(f"Successfully created admin with email {email}.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new admin user.")
    parser.add_argument("--name", required=True, help="The name of the admin user.")
    parser.add_argument("--email", required=True, help="The email of the admin user.")
    parser.add_argument("--password", required=True, help="The password of the admin user.")
    args = parser.parse_args()

    create_admin(args.name, args.email, args.password)
