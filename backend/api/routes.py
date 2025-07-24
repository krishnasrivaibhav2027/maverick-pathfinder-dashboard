from fastapi import APIRouter, HTTPException, status, Body, Depends
from typing import List
from models.schemas import Trainee, Course, Subcourse, Quiz, Question, Test
from models import crud_examples
from bson import ObjectId
from auth import get_current_user
from ai_agent import generate_training_recommendations, generate_quiz_questions_with_llama, generate_short_notes_on_mistakes

router = APIRouter()

# --- Trainee Endpoints ---
@router.post('/trainees', response_model=Trainee)
async def register_trainee(trainee: Trainee):
    # Registration is public
    existing = await crud_examples.get_user_by_empid(trainee.empId)
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already registered.")
    trainee_id = await crud_examples.create_trainee(trainee)
    created = await crud_examples.get_user_by_empid(trainee.empId)
    return created

@router.get('/trainees', response_model=List[Trainee])
async def get_all_trainees(user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin only')
    trainees = await crud_examples.get_all_trainees()
    for trainee in trainees:
        trainee.account_created = trainee.password is not None
    return trainees

@router.get('/trainees/{emp_id}', response_model=Trainee)
async def get_user_profile(emp_id: str, user=Depends(get_current_user)):
    if user['empId'] != emp_id and user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Not authorized')

    # Use a new function to get user by empId, which can check both trainees and admins
    user_profile = await crud_examples.get_user_by_empid(emp_id)

    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found.")
    return user_profile

@router.patch('/trainees/{emp_id}', response_model=Trainee)
async def update_trainee(emp_id: str, update_data: dict = Body(...), user=Depends(get_current_user)):
    if user['empId'] != emp_id and user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Not authorized')
    trainee = await crud_examples.get_user_by_empid(emp_id)
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found.")
    await crud_examples.update_trainee(emp_id, update_data)
    updated = await crud_examples.get_user_by_empid(emp_id)
    return updated

@router.delete('/trainees/{emp_id}')
async def delete_trainee(emp_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin only')
    trainee = await crud_examples.get_user_by_empid(emp_id)
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found.")
    await crud_examples.delete_trainee(emp_id)
    return {"message": "Trainee deleted successfully."}

@router.get('/trainees/{emp_id}/courses')
async def get_trainee_courses(emp_id: str, user=Depends(get_current_user)):
    if user['empId'] != emp_id and user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Not authorized')
    trainee = await crud_examples.get_user_by_empid(emp_id)
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found.")
    courses_cursor = crud_examples._db.courses.find({})
    courses = []
    async for course in courses_cursor:
        # Calculate progress: i/n
        completed = 0
        n = len(course.get('subcourses', []))
        for sub_id in course.get('subcourses', []):
            if any(str(q.subcourseId) == str(sub_id) and q.passStatus for q in trainee.completedQuizzes):
                completed += 1
        # Lock phase 2 for new trainees
        locked = (course.get('phase', 1) == 2 and trainee.phase == 1)
        courses.append({
            'id': str(course['_id']),
            'title': course.get('title'),
            'description': course.get('description'),
            'phase': course.get('phase'),
            'progress': f"{completed}/{n}",
            'locked': locked
        })
    return courses

@router.get('/trainees/{emp_id}/analytics')
async def get_trainee_analytics(emp_id: str, user=Depends(get_current_user)):
    if user['empId'] != emp_id and user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Not authorized')
    trainee = await crud_examples.get_user_by_empid(emp_id)
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found.")
    # Aggregate real-time stats
    progress = trainee.progress or {}
    completed_courses = len(trainee.completedCourses)
    avg_score = sum([c.averageScore or 0 for c in trainee.completedCourses]) / completed_courses if completed_courses else 0
    quizzes_attempted = len(trainee.completedQuizzes)
    quizzes_passed = sum(1 for q in trainee.completedQuizzes if q.passStatus)
    quiz_pass_rate = (quizzes_passed / quizzes_attempted * 100) if quizzes_attempted else 0
    # Call Llama for AI-generated insights
    ai_insights = await generate_training_recommendations(trainee)
    return {
        "progress": progress,
        "completed_courses": completed_courses,
        "avg_score": avg_score,
        "quiz_pass_rate": quiz_pass_rate,
        "ai_insights": ai_insights
    }

# --- Course & Subcourse Endpoints ---
@router.get('/courses', response_model=List[Course])
async def list_courses(user=Depends(get_current_user)):
    courses_cursor = crud_examples._db.courses.find({})
    courses = []
    async for course in courses_cursor:
        course['id'] = str(course['_id'])
        courses.append(Course(**course))
    return courses

@router.get('/courses/{course_id}', response_model=Course)
async def get_course_details(course_id: str, user=Depends(get_current_user)):
    course = await crud_examples.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    return course

@router.get('/subcourses/{subcourse_id}', response_model=Subcourse)
async def get_subcourse_details(subcourse_id: str, user=Depends(get_current_user)):
    subcourse = await crud_examples.get_subcourse_by_id(subcourse_id)
    if not subcourse:
        raise HTTPException(status_code=404, detail="Subcourse not found.")
    return subcourse

# --- Quiz Endpoints ---
@router.post('/quizzes', response_model=Quiz)
async def create_quiz(quiz: Quiz, user=Depends(get_current_user)):
    # Use Llama to generate quiz questions for the subcourse
    subcourse = await crud_examples.get_subcourse_by_id(str(quiz.subcourseId))
    if not subcourse:
        raise HTTPException(status_code=404, detail="Subcourse not found.")
    questions = await generate_quiz_questions_with_llama(subcourse.title, subcourse.description or "")
    quiz.questions = questions
    quiz.totalQuestions = len(questions)
    quiz_id = await crud_examples.create_quiz(quiz)
    created = await crud_examples.get_quiz_by_id(quiz_id)
    return created

@router.get('/quizzes/{quiz_id}', response_model=Quiz)
async def get_quiz(quiz_id: str, user=Depends(get_current_user)):
    quiz = await crud_examples.get_quiz_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    return quiz

@router.post('/quizzes/{quiz_id}/attempt', response_model=Quiz)
async def attempt_quiz(quiz_id: str, answers: dict = Body(...), user=Depends(get_current_user)):
    quiz = await crud_examples.get_quiz_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    # Validate answers and calculate score
    correct = 0
    for i, q in enumerate(quiz.questions):
        user_answer = answers.get(str(i))
        if user_answer and user_answer == q.correctAnswer:
            correct += 1
    score = correct / len(quiz.questions) * 100 if quiz.questions else 0
    pass_status = score >= 60  # Example pass threshold
    await crud_examples.update_quiz(quiz_id, {"attempted": True, "score": score, "passStatus": pass_status})
    updated = await crud_examples.get_quiz_by_id(quiz_id)
    return updated

# --- Test Endpoints ---
@router.post('/tests', response_model=Test)
async def create_test(test: Test, user=Depends(get_current_user)):
    test_id = await crud_examples.create_test(test)
    created = await crud_examples.get_test_by_id(test_id)
    return created

@router.get('/tests/{test_id}', response_model=Test)
async def get_test(test_id: str, user=Depends(get_current_user)):
    test = await crud_examples.get_test_by_id(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found.")
    return test

@router.post('/tests/{test_id}/attempt', response_model=Test)
async def attempt_test(test_id: str, answers: dict = Body(...), user=Depends(get_current_user)):
    test = await crud_examples.get_test_by_id(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found.")
    # Validate answers and calculate score
    correct = 0
    for i, q in enumerate(test.questions):
        user_answer = answers.get(str(i))
        if user_answer and user_answer == q.correctAnswer:
            correct += 1
    score = correct / len(test.questions) * 100 if test.questions else 0
    pass_status = score >= 60  # Example pass threshold
    attempt_number = test.attemptNumber + 1 if test.attempted else 1
    await crud_examples.update_test(test_id, {"attempted": True, "score": score, "passStatus": pass_status, "attemptNumber": attempt_number})
    updated = await crud_examples.get_test_by_id(test_id)
    return updated

# --- Admin Endpoints ---
@router.get('/admin/notifications')
async def get_admin_notifications(user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin only')

    # Fetch pending resumes
    pending_resumes = await crud_examples.get_trainees_by_resume_status('pending')

    # Find tests where passStatus is False and attempted is True, and not yet approved/disqualified
    cursor = crud_examples._db.tests.find({
        "passStatus": False,
        "attempted": True,
        "adminApproval": False,
        "disqualified": False
    })

    notifications = []

    # Add resume notifications
    for resume in pending_resumes:
        notifications.append({
            "type": "resume",
            "upload_id": str(resume.id),
            "filename": resume.resume_filename,
            "trainee_name": resume.name
        })

    # Add test notifications
    async for test in cursor:
        notifications.append({
            "type": "test",
            "test_id": str(test["_id"]),
            "traineeId": str(test["traineeId"]),
            "courseId": str(test["courseId"]),
            "score": test.get("score"),
            "attemptNumber": test.get("attemptNumber", 1)
        })

    return notifications

@router.post('/admin/tests/{test_id}/approve')
async def approve_test_retake(test_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin only')
    test = await crud_examples.get_test_by_id(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found.")
    # Generate short notes on previous mistakes using Llama
    user_answers = {}
    if hasattr(test, 'userAnswers') and test.userAnswers:
        user_answers = test.userAnswers
    elif hasattr(test, 'answers') and test.answers:
        user_answers = test.answers
    notes = await generate_short_notes_on_mistakes(test.questions, user_answers)
    await crud_examples.update_test(test_id, {"adminApproval": True, "attempted": False, "notes": notes})
    return {"message": "Test retake approved.", "notes": notes}

@router.post('/admin/tests/{test_id}/disqualify')
async def disqualify_trainee(test_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin only')
    test = await crud_examples.get_test_by_id(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found.")
    # Disqualify trainee (set disqualified True)
    await crud_examples.update_test(test_id, {"disqualified": True})
    return {"message": "Trainee disqualified and termination process started."}

# --- Batch Endpoints ---
@router.get('/batches/{batch_id}/skill-groups/{skill_name}/trainees', response_model=List[Trainee])
async def get_trainees_by_skill_group(batch_id: str, skill_name: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin only')

    batch = await crud_examples.get_batch_by_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    trainees = await crud_examples.get_trainees_by_skill(skill_name)

    # Filter trainees that are in the specified batch
    batch_trainee_ids = [str(t_id) for t_id in batch.trainees]
    skill_group_trainees = [t for t in trainees if str(t.id) in batch_trainee_ids]

    for trainee in skill_group_trainees:
        user = await crud_examples.get_user_by_empid(trainee.empId)
        trainee.account_created = user is not None

    return skill_group_trainees

@router.get('/resumes/pending')
async def get_pending_resumes(user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin only')

    pending_resumes = await crud_examples.get_trainees_by_resume_status('pending')
    return pending_resumes

@router.get('/batches')
async def get_batches():
    batches = await crud_examples.get_all_batches()
    return [batch.dict() for batch in batches]