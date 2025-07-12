from db import get_database
from .schemas import Trainee, Course, Subcourse, Quiz, Test
from bson import ObjectId

# Get the database instance
_db = get_database()

# --- Trainee CRUD ---
async def create_trainee(trainee: Trainee):
    doc = trainee.dict(by_alias=True, exclude_unset=True)
    result = await _db.trainees.insert_one(doc)
    return str(result.inserted_id)

async def get_trainee_by_id(trainee_id: str):
    doc = await _db.trainees.find_one({'_id': ObjectId(trainee_id)})
    return Trainee(**doc) if doc else None

async def update_trainee(trainee_id: str, update_data: dict):
    await _db.trainees.update_one({'_id': ObjectId(trainee_id)}, {'$set': update_data})

async def delete_trainee(trainee_id: str):
    await _db.trainees.delete_one({'_id': ObjectId(trainee_id)})

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