from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class Trainee(BaseModel):
    id: Optional[int] = Field(None, description="Unique identifier")
    name: str
    email: EmailStr
    password: str
    empId: str = Field(..., description="Employee ID")
    phase: int = 1
    progress: int = 0
    score: int = 0
    status: str = "active"
    specialization: str = "Pending"
    created_at: Optional[str] = None
    last_login: Optional[str] = None

class Admin(BaseModel):
    id: Optional[int] = Field(None, description="Unique identifier")
    name: str
    email: EmailStr
    password: str
    role: str = "admin"
    created_at: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None  # Optional for new trainees
    role: str  # 'trainee' or 'admin'
    name: Optional[str] = None  # Required for new trainees

class PasswordResetRequest(BaseModel):
    email: EmailStr

class DashboardStats(BaseModel):
    totalTrainees: int
    activeTrainees: int
    completedPhase1: int
    avgScore: int

class WeeklyProgress(BaseModel):
    week: str
    newJoiners: int
    completions: int
    avgScore: int

class PhaseDistribution(BaseModel):
    name: str
    value: int
    color: str

class Training(BaseModel):
    id: Optional[int] = Field(None, description="Unique identifier")
    title: str
    status: str
    progress: int
    description: Optional[str] = None
    duration: Optional[str] = None

class Task(BaseModel):
    id: Optional[int] = Field(None, description="Unique identifier")
    title: str
    due: str
    priority: str
    description: Optional[str] = None
    assignedTo: Optional[str] = None
    status: str = "pending"

class UserProfile(BaseModel):
    empId: str
    name: str
    email: EmailStr
    phase: int
    progress: int
    score: int
    specialization: str
    status: str