from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from .db import get_database
from fastapi.responses import JSONResponse
from .models import (
    Trainee, Admin, DashboardStats, WeeklyProgress, 
    PhaseDistribution, Training, Task, LoginRequest
)
from .ai_agent import create_trainee_profile
from .email_service import send_welcome_email, generate_temp_password
import asyncio
from bson import ObjectId
import uuid
import hashlib

app = FastAPI()

# CORS Middleware Configuration
origins = [
    "http://localhost:8080",  # Vite default dev port
    "http://localhost:5173",  # React default dev port
    "http://localhost:3000",  # Another common React dev port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = get_database()

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed_password

def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@app.get("/")
def read_root():
    return {"message": "Welcome to the Maverick Pathfinder API! 🚀"}

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
    # Hash the password before storing
    trainee_dict = trainee.dict()
    trainee_dict["password"] = hash_password(trainee_dict["password"])
    
    result = await db["trainees"].insert_one(trainee_dict)
    return {"inserted_id": str(result.inserted_id)}

@app.post("/admins")
async def add_admin(admin: Admin):
    # Hash the password before storing
    admin_dict = admin.dict()
    admin_dict["password"] = hash_password(admin_dict["password"])
    
    result = await db["admins"].insert_one(admin_dict)
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
    print(f"🔐 Login attempt: {login_request.email} as {login_request.role}")
    
    user_collection = db[f"{login_request.role}s"]
    user = await user_collection.find_one({"email": login_request.email})

    if user:
        # Existing user - verify password
        if login_request.password and verify_password(login_request.password, user["password"]):
            print(f"✅ Existing user login successful: {login_request.email}")
            return JSONResponse(content={"status": "success", "user": serialize_doc(user)})
        else:
            print(f"❌ Invalid password for existing user: {login_request.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # New user registration (only for trainees)
    if login_request.role == 'trainee':
        print(f"🆕 Creating new trainee account for: {login_request.email}")
        
        try:
            # AI agent generates the profile for the new trainee (name, empId, password)
            profile = await create_trainee_profile(login_request.email)
            print(f"🤖 AI generated profile: {profile['name']} ({profile['empId']})")
            
            # Hash the AI-generated password
            hashed_password = hash_password(profile["password"])
            
            new_trainee = Trainee(
                name=profile["name"],
                email=login_request.email,
                password=hashed_password,  # Store hashed password
                empId=profile["empId"]
            )
            
            # Save to database
            await db.trainees.insert_one(new_trainee.dict())
            print(f"💾 Trainee saved to database: {profile['empId']}")
            
            # Send welcome email with credentials (use original password, not hashed)
            email_success, email_message = send_welcome_email(
                login_request.email, 
                profile["name"], 
                profile["empId"], 
                profile["password"]  # Send original password in email
            )
            
            if email_success:
                print(f"📧 Welcome email sent successfully to: {login_request.email}")
            else:
                print(f"📧 Failed to send welcome email: {email_message}")
            
            # Get the created user from database (with hashed password)
            created_user = await db.trainees.find_one({"email": login_request.email})
            
            return JSONResponse(content={
                "status": "created", 
                "user": serialize_doc(created_user),
                "email_sent": email_success,
                "email_message": email_message,
                "message": f"Account created successfully! Credentials sent to {login_request.email}"
            })
            
        except Exception as e:
            print(f"❌ Error creating trainee account: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create account: {str(e)}")

    # Admin not found
    print(f"❌ Admin not found: {login_request.email}")
    raise HTTPException(status_code=404, detail="Admin not found")

@app.post("/auth/reset-password")
async def reset_password(email: str = Body(..., embed=True)):
    """Reset password for existing user"""
    # Check if user exists in trainees
    user = await db.trainees.find_one({"email": email})
    if user:
        # Generate new password
        new_password = generate_temp_password()
        hashed_password = hash_password(new_password)
        
        # Update password in database
        await db.trainees.update_one(
            {"email": email},
            {"$set": {"password": hashed_password}}
        )
        
        # Send password reset email
        from .email_service import send_password_reset_email
        email_success, email_message = send_password_reset_email(email, user["name"], new_password)
        
        return JSONResponse(content={
            "status": "success",
            "message": "Password reset successfully",
            "email_sent": email_success
        })
    
    raise HTTPException(status_code=404, detail="User not found")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        await db.trainees.find_one()
        return {"status": "healthy", "database": "connected", "ai": "ready"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Maverick Pathfinder API...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)