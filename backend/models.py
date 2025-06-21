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

class Admin(BaseModel):
    id: Optional[int] = Field(None, description="Unique identifier")
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str # 'trainee' or 'admin'

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

class Task(BaseModel):
    id: Optional[int] = Field(None, description="Unique identifier")
    title: str
    due: str
    priority: str 