import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

import asyncio
from bson import ObjectId
from db import get_database

async def migrate_batch_trainees():
    db = get_database()
    batches = db.batches
    trainees = db.trainees

    # 1. Fix all trainees in the trainees collection
    async for trainee in trainees.find({}):
        if isinstance(trainee.get('progress'), dict):
            await trainees.update_one({'_id': trainee['_id']}, {'$set': {'progress': 0}})
            print(f"Updated trainee {trainee.get('_id')} progress to 0")

    # 2. Fix all embedded trainees in batches
    async for batch in batches.find({}):
        updated_trainees = []
        changed = False
        for t in batch.get('trainees', []):
            # If t is an ObjectId or string, fetch the full trainee object
            if isinstance(t, ObjectId) or (isinstance(t, str) and ObjectId.is_valid(t)):
                t_id = ObjectId(t) if isinstance(t, str) else t
                trainee = await trainees.find_one({'_id': t_id})
                if trainee:
                    embedded = {
                        'name': trainee.get('name'),
                        'email': trainee.get('email'),
                        'empId': trainee.get('empId'),
                        'phase': trainee.get('phase', 1),
                        'status': trainee.get('status', 'active'),
                        'specialization': trainee.get('specialization'),
                        'progress': trainee.get('progress', {}),
                        'created_at': trainee.get('created_at'),
                    }
                    if isinstance(embedded.get('progress'), dict):
                        embedded['progress'] = 0
                    updated_trainees.append(embedded)
                    changed = True
            else:
                # Already an embedded object
                if isinstance(t, dict) and isinstance(t.get('progress'), dict):
                    t['progress'] = 0
                    changed = True
            updated_trainees.append(t)
        if changed:
            await batches.update_one({'_id': batch['_id']}, {'$set': {'trainees': updated_trainees}})
            print(f"Updated batch {batch.get('_id')} embedded trainees' progress to 0")

if __name__ == '__main__':
    asyncio.run(migrate_batch_trainees()) 