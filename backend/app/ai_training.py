from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, Text, Enum, Boolean, Table
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session
from datetime import datetime, timedelta
import enum
from pydantic import BaseModel
from typing import List, Optional
import json
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi import status

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./ai_training.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enums
class UserRole(str, enum.Enum):
    trainee = "trainee"
    admin = "admin"

class AttemptStatus(str, enum.Enum):
    pending = "pending"
    passed = "passed"
    failed = "failed"

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.trainee)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    batches = relationship("Batch", secondary="trainee_batches", back_populates="trainees")

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    language = Column(String, nullable=False)
    phase = Column(Integer, nullable=False)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    trainees = relationship("User", secondary="trainee_batches", back_populates="batches")
    courses = relationship("Course", back_populates="batch")

class TraineeBatch(Base):
    __tablename__ = "trainee_batches"
    id = Column(Integer, primary_key=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    batch_id = Column(Integer, ForeignKey("batches.id"))

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phase = Column(Integer, nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"))
    description = Column(Text)
    batch = relationship("Batch", back_populates="courses")
    subtopics = relationship("Subtopic", back_populates="course")
    quiztasks = relationship("QuizTask", back_populates="course")

class Subtopic(Base):
    __tablename__ = "subtopics"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String, nullable=False)
    content = Column(Text)
    order = Column(Integer)
    course = relationship("Course", back_populates="subtopics")

class QuizTask(Base):
    __tablename__ = "quiztasks"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    subtopic_ids = Column(String)  # Comma-separated subtopic IDs
    type = Column(String)  # quiz or task
    questions = Column(Text)  # JSON string
    created_by_ai = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    course = relationship("Course", back_populates="quiztasks")

class Attempt(Base):
    __tablename__ = "attempts"
    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    quiztask_id = Column(Integer, ForeignKey("quiztasks.id"))
    score = Column(Integer)
    attempt_number = Column(Integer, default=1)
    status = Column(Enum(AttemptStatus), default=AttemptStatus.pending)
    submitted_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI()

# CORS (for frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Health check endpoint
@app.get("/")
def read_root():
    return {"status": "ok"}

# JWT Config
SECRET_KEY = "supersecretkey"  # In production, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Password hashing helpers
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# JWT helpers
def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# User registration (admin/trainee)
@app.post("/register")
def register_user(name: str, email: str, password: str, role: UserRole, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(password)
    user = User(name=name, email=email, password_hash=hashed_password, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "role": user.role}

# Course creation (admin only)
@app.post("/admin/course")
def create_course(name: str, phase: int, batch_id: int, description: str = "", db: Session = Depends(get_db)):
    course = Course(name=name, phase=phase, batch_id=batch_id, description=description)
    db.add(course)
    db.commit()
    db.refresh(course)
    return {"id": course.id, "name": course.name, "phase": course.phase}

# Pydantic Schemas
class SubtopicCreate(BaseModel):
    course_id: int
    title: str
    content: str
    order: int

class QuizTaskCreate(BaseModel):
    course_id: int
    subtopic_ids: List[int]
    type: str  # 'quiz' or 'task'

class AttemptCreate(BaseModel):
    trainee_id: int
    quiztask_id: int
    score: int

class AdminActionRequest(BaseModel):
    trainee_id: int
    reason: Optional[str] = None

class NotesRequest(BaseModel):
    subtopic_ids: List[int]

# Subtopic creation
@app.post("/admin/subtopic")
def create_subtopic(subtopic: SubtopicCreate, db: Session = Depends(get_db)):
    sub = Subtopic(
        course_id=subtopic.course_id,
        title=subtopic.title,
        content=subtopic.content,
        order=subtopic.order
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return {"id": sub.id, "title": sub.title}

# Quiz/Task generation (AI integration stub)
@app.post("/admin/quiztask/generate")
def generate_quiztask(data: QuizTaskCreate, db: Session = Depends(get_db)):
    # In real implementation, call AI service with subtopic content
    questions = [{
        "question": f"Sample question for subtopics {data.subtopic_ids}",
        "options": ["A", "B", "C", "D"],
        "answer": "A"
    }]
    quiztask = QuizTask(
        course_id=data.course_id,
        subtopic_ids=','.join(map(str, data.subtopic_ids)),
        type=data.type,
        questions=json.dumps(questions),
        created_by_ai=True
    )
    db.add(quiztask)
    db.commit()
    db.refresh(quiztask)
    return {"id": quiztask.id, "type": quiztask.type, "questions": questions}

# Attempt submission
@app.post("/trainee/attempt")
def submit_attempt(attempt: AttemptCreate, db: Session = Depends(get_db)):
    # Check for previous attempts
    prev_attempts = db.query(Attempt).filter_by(trainee_id=attempt.trainee_id, quiztask_id=attempt.quiztask_id).count()
    status = AttemptStatus.passed if attempt.score >= 80 else AttemptStatus.failed
    new_attempt = Attempt(
        trainee_id=attempt.trainee_id,
        quiztask_id=attempt.quiztask_id,
        score=attempt.score,
        attempt_number=prev_attempts + 1,
        status=status
    )
    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)
    # TODO: Notify admin if failed, trigger AI notes if needed
    return {"id": new_attempt.id, "status": new_attempt.status, "attempt_number": new_attempt.attempt_number}

# Admin approves retake
@app.post("/admin/approve-retake")
def approve_retake(action: AdminActionRequest, db: Session = Depends(get_db)):
    # TODO: Add logic to mark retake as approved, notify trainee, trigger AI notes
    # For now, just log the action
    return {"trainee_id": action.trainee_id, "action": "retake approved"}

# Admin terminates trainee
@app.post("/admin/terminate")
def terminate_trainee(action: AdminActionRequest, db: Session = Depends(get_db)):
    trainee = db.query(User).filter_by(id=action.trainee_id).first()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")
    trainee.status = "terminated"
    db.commit()
    # TODO: Send termination email/notification
    return {"trainee_id": action.trainee_id, "action": "terminated"}

# Notifications endpoint (for a user)
@app.get("/notifications/{user_id}")
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter_by(user_id=user_id).all()
    return [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "created_at": n.created_at,
            "resolved": n.resolved
        } for n in notifications
    ]

# Login endpoint
@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "role": user.role}

# Protect sensitive endpoints (example: admin dashboard)
@app.get("/admin/dashboard")
def admin_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    trainees = db.query(User).filter_by(role=UserRole.trainee).all()
    trainee_data = []
    for t in trainees:
        attempts = db.query(Attempt).filter_by(trainee_id=t.id).all()
        trainee_data.append({
            "id": t.id,
            "name": t.name,
            "status": t.status,
            "last_active": t.last_active,
            "attempts": [
                {"quiztask_id": a.quiztask_id, "score": a.score, "status": a.status, "attempt_number": a.attempt_number}
                for a in attempts
            ]
        })
    notifications = db.query(Notification).filter_by(resolved=False).all()
    notifications_data = [
        {"id": n.id, "user_id": n.user_id, "type": n.type, "message": n.message, "created_at": n.created_at}
        for n in notifications
    ]
    return {
        "trainees": trainee_data,
        "pending_notifications": notifications_data
    }

# Protect trainee dashboard
@app.get("/trainee/dashboard/{trainee_id}")
def trainee_dashboard(trainee_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.trainee or current_user.id != trainee_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    trainee = db.query(User).filter_by(id=trainee_id, role=UserRole.trainee).first()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")
    # Get batches, courses, subtopics, quiztasks, attempts
    batches = trainee.batches
    courses = []
    for batch in batches:
        for course in batch.courses:
            subtopics = [
                {"id": s.id, "title": s.title, "order": s.order} for s in course.subtopics
            ]
            quiztasks = [
                {"id": q.id, "type": q.type, "subtopic_ids": q.subtopic_ids} for q in course.quiztasks
            ]
            attempts = db.query(Attempt).filter_by(trainee_id=trainee_id).all()
            courses.append({
                "id": course.id,
                "name": course.name,
                "phase": course.phase,
                "subtopics": subtopics,
                "quiztasks": quiztasks,
                "attempts": [
                    {"quiztask_id": a.quiztask_id, "score": a.score, "status": a.status, "attempt_number": a.attempt_number}
                    for a in attempts if a.quiztask_id in [q.id for q in course.quiztasks]
                ]
            })
    return {
        "trainee_id": trainee.id,
        "name": trainee.name,
        "courses": courses
    }

# Add this endpoint to allow dashboard fetch by empId
@app.get("/trainee/dashboard/by-empid/{emp_id}")
def trainee_dashboard_by_empid(emp_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trainee = db.query(User).filter_by(empId=emp_id, role=UserRole.trainee).first()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")
    # Get batches, courses, subtopics, quiztasks, attempts (reuse logic from the numeric ID endpoint)
    batches = trainee.batches
    courses = []
    for batch in batches:
        for course in batch.courses:
            subtopics = [
                {"id": s.id, "title": s.title, "order": s.order} for s in course.subtopics
            ]
            quiztasks = [
                {"id": q.id, "type": q.type, "subtopic_ids": q.subtopic_ids} for q in course.quiztasks
            ]
            attempts = db.query(Attempt).filter_by(trainee_id=trainee.id).all()
            courses.append({
                "id": course.id,
                "name": course.name,
                "phase": course.phase,
                "subtopics": subtopics,
                "quiztasks": quiztasks,
                "attempts": [
                    {"quiztask_id": a.quiztask_id, "score": a.score, "status": a.status, "attempt_number": a.attempt_number}
                    for a in attempts if a.quiztask_id in [q.id for q in course.quiztasks]
                ]
            })
    return {
        "trainee_id": trainee.id,
        "name": trainee.name,
        "courses": courses
    }

# Helper to fetch subtopic content
def get_subtopics_content(subtopic_ids: List[int], db: Session):
    subtopics = db.query(Subtopic).filter(Subtopic.id.in_(subtopic_ids)).all()
    return [f"{s.title}: {s.content}" for s in subtopics]

# AI notes generation endpoint (stub)
@app.post("/ai/generate-notes")
def generate_notes(request: NotesRequest, db: Session = Depends(get_db)):
    contents = get_subtopics_content(request.subtopic_ids, db)
    # In real implementation, call AI service with contents
    summary = "\n".join([f"Summary for: {c}" for c in contents])
    return {"notes": summary}

# Inactivity check endpoint (manual trigger for now)
@app.post("/admin/check-inactivity")
def check_inactivity(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    three_days_ago = now - timedelta(days=3)
    inactive_trainees = db.query(User).filter(
        User.role == UserRole.trainee,
        User.status == "active",
        User.created_at <= three_days_ago,
        User.last_active == User.created_at  # Not started
    ).all()
    admin_users = db.query(User).filter_by(role=UserRole.admin).all()
    notifications = []
    for trainee in inactive_trainees:
        for admin in admin_users:
            notif = Notification(
                user_id=admin.id,
                type="inactivity",
                message=f"Trainee {trainee.name} (ID: {trainee.id}) has not started training after 3 days.",
            )
            db.add(notif)
            notifications.append({
                "admin_id": admin.id,
                "trainee_id": trainee.id,
                "message": notif.message
            })
    db.commit()
    # In real implementation, automate this with a scheduler (Celery/APScheduler)
    return {"notified": notifications, "inactive_trainees": [t.id for t in inactive_trainees]}

# TODO: Add endpoints for notifications, AI integration, etc. 