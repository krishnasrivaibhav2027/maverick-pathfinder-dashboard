from pymongo import MongoClient

MONGODB_URL = "mongodb+srv://gksvaibav99:vaibhu2027@cluster0.rc32pqz.mongodb.net/mydatabase?retryWrites=true&w=majority&tls=true"
db = MongoClient(MONGODB_URL)["maverick_dashboard"]
result = db.trainees.update_many({'id': {'$exists': True}}, {'$unset': {'id': ""}})
print(f"Modified {result.modified_count} documents. Removed 'id' field from all trainee documents.") 