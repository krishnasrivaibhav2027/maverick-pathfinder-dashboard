from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class CompletedQuiz(BaseModel):
    quizId: ObjectId
    subcourseId: ObjectId
    courseId: ObjectId
    score: Optional[float]
    passStatus: Optional[bool]
    attemptedAt: Optional[datetime]
    model_config = {"arbitrary_types_allowed": True}

class TestAttempt(BaseModel):
    testId: ObjectId
    score: Optional[float]
    passStatus: Optional[bool]
    attemptedAt: Optional[datetime]
    notes: Optional[str]
    model_config = {"arbitrary_types_allowed": True}

class CompletedCourse(BaseModel):
    courseId: ObjectId
    scores: List[float] = []
    testAttempts: List[TestAttempt] = []
    averageScore: Optional[float]
    model_config = {"arbitrary_types_allowed": True}

class Trainee(BaseModel):
    name: str
    email: EmailStr
    password: str
    empId: Optional[str]
    phase: int = 1
    status: str = 'active'
    progress: dict = Field(default_factory=dict)  # {phase1: int, phase2: int, overall: int}
    specialization: Optional[str] = None
    password_is_temporary: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime]
    currentCourse: Optional[ObjectId] = None
    currentSubcourse: Optional[ObjectId] = None
    completedCourses: List[CompletedCourse] = []
    completedQuizzes: List[CompletedQuiz] = []
    model_config = {"arbitrary_types_allowed": True}

class Subcourse(BaseModel):
    id: Optional[ObjectId]
    subcourse_id: str
    title: str
    description: Optional[str]
    courseId: ObjectId
    quiz_enabled: bool = False
    model_config = {"arbitrary_types_allowed": True}

class Course(BaseModel):
    id: Optional[ObjectId]
    course_id: str
    title: str
    description: Optional[str]
    phase: int
    subcourses: List[ObjectId] = []
    test_enabled: bool = False
    model_config = {"arbitrary_types_allowed": True}

class Question(BaseModel):
    question: str
    options: List[str]
    correctAnswer: str
    model_config = {"arbitrary_types_allowed": True}

class Quiz(BaseModel):
    id: Optional[ObjectId]
    subcourseId: ObjectId
    traineeId: ObjectId
    questions: List[Question]
    totalQuestions: int
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    attempted: bool = False
    score: Optional[float]
    passStatus: Optional[bool]
    model_config = {"arbitrary_types_allowed": True}

class Test(BaseModel):
    id: Optional[ObjectId]
    courseId: ObjectId
    traineeId: ObjectId
    questions: List[Question]
    totalQuestions: int
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    attempted: bool = False
    score: Optional[float]
    passStatus: Optional[bool]
    attemptNumber: int = 1
    notes: Optional[str]
    adminApproval: bool = False
    disqualified: bool = False
    model_config = {"arbitrary_types_allowed": True}

class Admin(BaseModel):
    id: Optional[ObjectId]
    name: str
    email: EmailStr
    password: str
    empId: Optional[str]
    role: str = 'admin'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = {"arbitrary_types_allowed": True}

class Batch(BaseModel):
    id: Optional[ObjectId]
    batch_id: str
    phase: int
    trainees: List[str] = []
    is_next_batch: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = {"arbitrary_types_allowed": True} 