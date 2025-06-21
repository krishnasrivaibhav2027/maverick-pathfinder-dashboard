from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from .db import get_database
from fastapi.responses import JSONResponse
from .models import (
    Trainee, Admin, DashboardStats, WeeklyProgress, 
    PhaseDistribution, Training, Task, LoginRequest
)
from .ai_agent import create_trainee_profile
from .email_service import generate_temp_password, send_welcome_email
import asyncio
from bson import ObjectId
import uuid

app = FastAPI()

# CORS Middleware Configuration
origins = [
    "http://localhost:8080",  # Vite default dev port
    "http://localhost:5173",  # React default dev port
    "http://localhost:3000",  # Another common React dev port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = get_database()

def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI backend!"}

@app.get("/trainees")
async def get_trainees():
    data = []
    cursor = db["trainees"].find()
    async for document in cursor:
        data.append(serialize_doc(document))
    return JSONResponse(content=data)

@app.get("/trainees/{emp_id}")
async def get_trainee_by_empid(emp_id: str):
    trainee = await db["trainees"].find_one({"empId": emp_id})
    if trainee:
        return JSONResponse(content=serialize_doc(trainee))
    return JSONResponse(content={"error": "Trainee not found"}, status_code=404)

@app.get("/admins")
async def get_admins():
    data = []
    cursor = db["admins"].find()
    async for document in cursor:
        data.append(serialize_doc(document))
    return JSONResponse(content=data)

@app.get("/dashboard-stats")
async def get_dashboard_stats():
    data = []
    cursor = db["dashboard_stats"].find()
    async for document in cursor:
        data.append(serialize_doc(document))
    return JSONResponse(content=data)

@app.get("/weekly-progress")
async def get_weekly_progress():
    data = []
    cursor = db["weekly_progress"].find()
    async for document in cursor:
        data.append(serialize_doc(document))
    return JSONResponse(content=data)

@app.get("/phase-distribution")
async def get_phase_distribution():
    data = []
    cursor = db["phase_distribution"].find()
    async for document in cursor:
        data.append(serialize_doc(document))
    return JSONResponse(content=data)

@app.get("/trainings")
async def get_trainings():
    data = []
    cursor = db["trainings"].find()
    async for document in cursor:
        data.append(serialize_doc(document))
    return JSONResponse(content=data)

@app.get("/tasks")
async def get_tasks():
    data = []
    cursor = db["tasks"].find()
    async for document in cursor:
        data.append(serialize_doc(document))
    return JSONResponse(content=data)

@app.post("/trainees")
async def add_trainee(trainee: Trainee):
    result = await db["trainees"].insert_one(trainee.dict())
    return {"inserted_id": str(result.inserted_id)}

@app.post("/admins")
async def add_admin(admin: Admin):
    result = await db["admins"].insert_one(admin.dict())
    return {"inserted_id": str(result.inserted_id)}

@app.post("/dashboard-stats")
async def add_dashboard_stats(stats: DashboardStats):
    result = await db["dashboard_stats"].insert_one(stats.dict())
    return {"inserted_id": str(result.inserted_id)}

@app.post("/weekly-progress")
async def add_weekly_progress(progress: WeeklyProgress):
    result = await db["weekly_progress"].insert_one(progress.dict())
    return {"inserted_id": str(result.inserted_id)}

@app.post("/phase-distribution")
async def add_phase_distribution(phase: PhaseDistribution):
    result = await db["phase_distribution"].insert_one(phase.dict())
    return {"inserted_id": str(result.inserted_id)}

@app.post("/trainings")
async def add_training(training: Training):
    result = await db["trainings"].insert_one(training.dict())
    return {"inserted_id": str(result.inserted_id)}

@app.post("/tasks")
async def add_task(task: Task):
    result = await db["tasks"].insert_one(task.dict())
    return {"inserted_id": str(result.inserted_id)}

@app.post("/auth/login")
async def login(login_request: LoginRequest):
    user_collection = db[f"{login_request.role}s"]
    user = await user_collection.find_one({"email": login_request.email})

    if user:
        if user["password"] == login_request.password:
            return JSONResponse(content={"status": "success", "user": serialize_doc(user)})
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if login_request.role == 'trainee':
        # AI agent generates the profile for the new trainee (name, empId, password)
        profile = await create_trainee_profile(login_request.email)
        
        new_trainee = Trainee(
            name=profile["name"],
            email=login_request.email,
            password=profile["password"],  # Use AI-generated password
            empId=profile["empId"]
        )
        
        # Save to database
        await db.trainees.insert_one(new_trainee.dict())
        
        # Send welcome email with credentials
        email_success, email_message = send_welcome_email(
            login_request.email, 
            profile["name"], 
            profile["empId"], 
            profile["password"]
        )
        
        # Get the created user from database
        created_user = await db.trainees.find_one({"email": login_request.email})
        
        return JSONResponse(content={
            "status": "created", 
            "user": serialize_doc(created_user),
            "email_sent": email_success,
            "email_message": email_message
        })

    raise HTTPException(status_code=404, detail="Admin not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)