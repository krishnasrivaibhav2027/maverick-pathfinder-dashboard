import asyncio
from ..db import get_database

async def ensure_collections_and_indexes():
    db = get_database()
    # Create collections if they don't exist
    await db.create_collection('trainees') if 'trainees' not in await db.list_collection_names() else None
    await db.create_collection('courses') if 'courses' not in await db.list_collection_names() else None
    await db.create_collection('subcourses') if 'subcourses' not in await db.list_collection_names() else None
    await db.create_collection('quizzes') if 'quizzes' not in await db.list_collection_names() else None
    await db.create_collection('tests') if 'tests' not in await db.list_collection_names() else None

    # Create unique indexes
    await db.trainees.create_index('email', unique=True)
    await db.courses.create_index('course_id', unique=True)
    await db.subcourses.create_index('subcourse_id', unique=True)
    print('Collections and indexes ensured.')

if __name__ == '__main__':
    asyncio.run(ensure_collections_and_indexes()) 