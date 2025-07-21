import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import db

async def cleanup_orphaned_batch_trainees():
    # Get all valid empIds from the trainees collection
    valid_emp_ids = set()
    async for trainee in db['trainees'].find({}, {"empId": 1}):
        if 'empId' in trainee:
            valid_emp_ids.add(trainee['empId'])

    # Iterate through all batches
    async for batch in db['batches'].find():
        batch_id = batch['_id']
        trainees = batch.get('trainees', [])
        # Keep only trainees whose empId is still valid
        filtered_trainees = [t for t in trainees if t.get('empId') in valid_emp_ids]
        if len(filtered_trainees) != len(trainees):
            await db['batches'].update_one({'_id': batch_id}, {'$set': {'trainees': filtered_trainees}})

    # Delete batches with zero trainees
    result = await db['batches'].delete_many({
        "$or": [
            {"trainees": {"$exists": False}},
            {"trainees": {"$size": 0}}
        ]
    })
    print(f"Cleaned up orphaned trainees and deleted {result.deleted_count} empty batches.")

if __name__ == "__main__":
    asyncio.run(cleanup_orphaned_batch_trainees()) 