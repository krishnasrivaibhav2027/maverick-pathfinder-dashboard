from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict

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
    batch: Optional[str] = Field(default=None, description="Batch ID")
    password_is_temporary: bool = Field(default=True)
    created_at: Optional[str] = None
    last_login: Optional[str] = None

class Admin(BaseModel):
    id: Optional[int] = Field(None, description="Unique identifier")
    name: str
    email: EmailStr
    password: str
    empId: str = Field(..., description="Admin Employee ID")
    role: str = "admin"
    created_at: Optional[str] = None

class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    empId: Optional[str] = None
    password: Optional[str] = None  # Optional for new trainees
    role: str  # 'trainee' or 'admin'
    name: Optional[str] = None  # Required for new trainees
    
    @validator('name')
    def validate_name_for_trainees(cls, v, values):
        """Validate that name is provided for new trainee registrations"""
        if 'role' in values and values['role'] == 'trainee' and not v:
            raise ValueError('Name is required for trainee registration')
        return v

class SetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

class ChangePasswordRequest(BaseModel):
    email: EmailStr
    old_password: str
    new_password: str

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

class Batch(BaseModel):
    id: Optional[str] = Field(None, description="Unique identifier")
    name: str
    instructor: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    modules: List[Dict] = Field(default_factory=list, description="List of modules with title and active status")
    created_at: Optional[str] = None