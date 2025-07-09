import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def migrate_completed_subcourses():
    client = AsyncIOMotorClient('mongodb+srv://gksvaibav99:vaibhu2027@cluster0.rc32pqz.mongodb.net/mydatabase?retryWrites=true&w=majority&tls=true')
    db = client['maverick_dashboard']  # Use your actual DB name
    trainees = db['trainees']
    count = 0
    async for trainee in trainees.find({"completed_subcourses": {"$exists": False}}):
        await trainees.update_one({"_id": trainee["_id"]}, {"$set": {"completed_subcourses": []}})
        count += 1
    print(f"Migration complete: {count} trainees updated with completed_subcourses field.")

if __name__ == "__main__":
    asyncio.run(migrate_completed_subcourses()) 