from db import get_database
from .schemas import Trainee, Course, Subcourse, Quiz, Test, Batch
from bson import ObjectId

# Get the database instance
_db = get_database()

# --- Trainee CRUD ---
async def create_trainee(trainee: Trainee):
    doc = trainee.dict(by_alias=True, exclude_unset=True)
    result = await _db.trainees.insert_one(doc)
    trainee_id = result.inserted_id

    # Prepare embedded trainee object for batch
    embedded_trainee = {
        'name': doc.get('name'),
        'email': doc.get('email'),
        'empId': doc.get('empId'),
        'phase': doc.get('phase', 1),
        'status': doc.get('status', 'active'),
        'specialization': doc.get('specialization'),
        'progress': doc.get('progress', {}),
        'created_at': doc.get('created_at'),
        # Add more fields as needed
    }

    # Assign to a batch (phase 1, is_next_batch=False)
    batch = await _db.batches.find_one({'phase': 1, 'is_next_batch': False})
    if batch:
        await _db.batches.update_one({'_id': batch['_id']}, {'$push': {'trainees': embedded_trainee}})
    else:
        from datetime import datetime
        batch_doc = {
            'batch_id': str(trainee_id),
            'phase': 1,
            'trainees': [embedded_trainee],
            'is_next_batch': False,
            'created_at': datetime.utcnow()
        }
        await _db.batches.insert_one(batch_doc)
    return str(trainee_id)

async def get_user_by_empid(emp_id: str):
    # This function now checks both trainees and admins collections
    user = await _db.trainees.find_one({'empId': emp_id})
    if user:
        return Trainee(**user)

    user = await _db.admins.find_one({'empId': emp_id})
    if user:
        # You might need an Admin schema for this, assuming it's similar to Trainee
        return Trainee(**user) # Or an appropriate Admin model

    return None

async def update_trainee(emp_id: str, update_data: dict):
    await _db.trainees.update_one({'empId': emp_id}, {'$set': update_data})

async def delete_trainee(emp_id: str):
    await _db.trainees.delete_one({'empId': emp_id})

async def get_all_trainees():
    trainees_cursor = _db.trainees.find({})
    trainees = []
    async for trainee in trainees_cursor:
        trainees.append(Trainee(**trainee))
    return trainees

# --- Course CRUD ---
async def create_course(course: Course):
    doc = course.dict(by_alias=True, exclude_unset=True)
    result = await _db.courses.insert_one(doc)
    return str(result.inserted_id)

async def get_course_by_id(course_id: str):
    doc = await _db.courses.find_one({'_id': ObjectId(course_id)})
    return Course(**doc) if doc else None

async def update_course(course_id: str, update_data: dict):
    await _db.courses.update_one({'_id': ObjectId(course_id)}, {'$set': update_data})

async def delete_course(course_id: str):
    await _db.courses.delete_one({'_id': ObjectId(course_id)})

# --- Subcourse CRUD ---
async def create_subcourse(subcourse: Subcourse):
    doc = subcourse.dict(by_alias=True, exclude_unset=True)
    result = await _db.subcourses.insert_one(doc)
    return str(result.inserted_id)

async def get_subcourse_by_id(subcourse_id: str):
    doc = await _db.subcourses.find_one({'_id': ObjectId(subcourse_id)})
    return Subcourse(**doc) if doc else None

async def update_subcourse(subcourse_id: str, update_data: dict):
    await _db.subcourses.update_one({'_id': ObjectId(subcourse_id)}, {'$set': update_data})

async def delete_subcourse(subcourse_id: str):
    await _db.subcourses.delete_one({'_id': ObjectId(subcourse_id)})

# --- Quiz CRUD ---
async def create_quiz(quiz: Quiz):
    doc = quiz.dict(by_alias=True, exclude_unset=True)
    result = await _db.quizzes.insert_one(doc)
    return str(result.inserted_id)

async def get_quiz_by_id(quiz_id: str):
    doc = await _db.quizzes.find_one({'_id': ObjectId(quiz_id)})
    return Quiz(**doc) if doc else None

async def update_quiz(quiz_id: str, update_data: dict):
    await _db.quizzes.update_one({'_id': ObjectId(quiz_id)}, {'$set': update_data})

async def delete_quiz(quiz_id: str):
    await _db.quizzes.delete_one({'_id': ObjectId(quiz_id)})

# --- Test CRUD ---
async def create_test(test: Test):
    doc = test.dict(by_alias=True, exclude_unset=True)
    result = await _db.tests.insert_one(doc)
    return str(result.inserted_id)

async def get_test_by_id(test_id: str):
    doc = await _db.tests.find_one({'_id': ObjectId(test_id)})
    return Test(**doc) if doc else None

async def update_test(test_id: str, update_data: dict):
    await _db.tests.update_one({'_id': ObjectId(test_id)}, {'$set': update_data})

async def delete_test(test_id: str):
    await _db.tests.delete_one({'_id': ObjectId(test_id)})

# --- Batch CRUD ---
async def create_batch(batch: Batch):
    doc = batch.dict(by_alias=True, exclude_unset=True)
    result = await _db.batches.insert_one(doc)
    return str(result.inserted_id)

async def get_batch_by_id(batch_id: str):
    doc = await _db.batches.find_one({'batch_id': batch_id})
    return Batch(**doc) if doc else None

async def get_all_batches():
    # Only find batches that have at least one trainee
    batches_cursor = _db.batches.find({'trainees.0': {'$exists': True}})
    batches = []
    async for batch in batches_cursor:
        # Since trainees are embedded, no need to fetch them separately
        # But we can re-validate if needed, or just trust the embedded data
        # For simplicity, we'll return the embedded data directly

        # Optional: If you need to ensure trainees still exist in the main collection
        # and get the latest data, you can still perform a lookup.
        # However, the frontend logic seems to rely on the presence of trainees in the batch document itself.

        batches.append(Batch(**batch))

    return batches

async def update_batch(batch_id: str, update_data: dict):
    await _db.batches.update_one({'batch_id': batch_id}, {'$set': update_data})

async def delete_batch(batch_id: str):
    await _db.batches.delete_one({'batch_id': batch_id}) 