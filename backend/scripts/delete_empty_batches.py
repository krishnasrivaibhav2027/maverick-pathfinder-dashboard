import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import db
import asyncio

async def cleanup():
    result = await db['batches'].delete_many({
        "$or": [
            {"trainees": {"$exists": False}},
            {"trainees": {"$size": 0}}
        ]
    })
    print(f"Deleted {result.deleted_count} empty batches")

if __name__ == "__main__":
    asyncio.run(cleanup()) 