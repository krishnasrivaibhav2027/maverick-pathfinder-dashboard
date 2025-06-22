from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from bson import ObjectId
import asyncio
import uuid
from datetime import datetime

from .db import get_database, test_db_connection, ensure_indexes
from .models import (
    Trainee, Admin, DashboardStats, WeeklyProgress, 
    PhaseDistribution, Training, Task, LoginRequest
)
from .ai_agent import create_trainee_profile, test_ollama_connection, generate_training_recommendations
from .email_service import send_welcome_email, test_smtp_connection
from .config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Training Dashboard Backend API"
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = get_database()

def serialize_doc(doc):
    """Serialize MongoDB document for JSON response"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Starting Maverick Pathfinder Backend...")
    
    # Ensure database indexes
    await ensure_indexes()
    
    # Test all services
    db_status, db_message = await test_db_connection()
    ollama_status, ollama_message = await test_ollama_connection()
    smtp_status, smtp_message = test_smtp_connection()
    
    print(f"📊 Database: {'✅' if db_status else '❌'} {db_message}")
    print(f"🤖 Ollama: {'✅' if ollama_status else '❌'} {ollama_message}")
    print(f"📧 Gmail SMTP: {'✅' if smtp_status else '❌'} {smtp_message}")
    
    if db_status and smtp_status:
        print("🎉 Critical services are ready!")
    else:
        print("⚠️  Some critical services are not ready. Check the configuration.")

@app.get("/")
async def read_root():
    """Health check endpoint that tests all services"""
    db_status, db_message = await test_db_connection()
    ollama_status, ollama_message = await test_ollama_connection()
    smtp_status, smtp_message = test_smtp_connection()

    overall_status = "ok" if db_status and smtp_status else "error"

    return JSONResponse(content={
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": overall_status,
        "services": {
            "database": {"status": "ok" if db_status else "error", "message": db_message},
            "ollama": {"status": "ok" if ollama_status else "error", "message": ollama_message},
            "gmail_smtp": {"status": "ok" if smtp_status else "error", "message": smtp_message},
        }
    })

@app.get("/health-check")
async def health_check():
    """Alternative health check endpoint"""
    return await read_root()

@app.post("/auth/login")
async def login(login_request: LoginRequest):
    """Handle user login with AI-generated profile creation for new trainees"""
    try:
        user_collection = db[f"{login_request.role}s"]
        user = await user_collection.find_one({"email": login_request.email})

        if user:
            # Existing user login
            if user.get("password") == login_request.password:
                # Update last login time
                await user_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"last_login": datetime.now().isoformat()}}
                )
                return JSONResponse(content={
                    "status": "success", 
                    "user": serialize_doc(user),
                    "message": "Login successful"
                })
            else:
                raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # New trainee registration
        if login_request.role == 'trainee':
            try:
                print(f"Creating new trainee profile for: {login_request.email}")
                
                # Generate AI profile with credentials
                profile = await create_trainee_profile(login_request.email)
                
                # Create trainee document
                new_trainee = Trainee(
                    name=profile["name"],
                    email=login_request.email,
                    password=profile["password"],
                    empId=profile["empId"],
                    phase=1,
                    progress=0,
                    score=0,
                    status="active",
                    specialization="Pending",
                    created_at=datetime.now().isoformat(),
                    last_login=datetime.now().isoformat()
                )
                
                # Store in database
                result = await db.trainees.insert_one(new_trainee.dict())
            
                if result.inserted_id:
                    print(f"✅ Trainee profile created successfully: {profile['empId']}")
                    
                    # Send welcome email with credentials
                    email_sent, email_message = send_welcome_email(
                        login_request.email, 
                        profile["name"], 
                        profile["empId"], 
                        profile["password"]
                    )
            
                    if not email_sent:
                        # Log the error but still create the account
                        print(f"⚠️  Email Warning: {email_message}")
                        return JSONResponse(
                            content={
                                "status": "account_created_email_failed",
                                "message": "Account created, but failed to send welcome email. Please contact an admin.",
                                "detail": email_message
                            },
                            status_code=201
                        )

                    # Return success message
                    return JSONResponse(content={
                        "status": "account_created", 
                        "message": "Account created successfully. Please check your email for login credentials."
                    })
                else:
                    raise HTTPException(status_code=500, detail="Failed to create trainee account")
                    
            except Exception as e:
                print(f"❌ Error creating trainee profile: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to create trainee profile: {str(e)}")

        # Admin registration not allowed
        raise HTTPException(status_code=404, detail="Admin not found or new admin registration is not allowed.")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Basic CRUD for trainees
@app.get("/trainees")
async def get_trainees():
    """Get all trainees"""
    try:
        data = []
        cursor = db["trainees"].find()
        async for document in cursor:
            data.append(serialize_doc(document))
        return JSONResponse(content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trainees: {str(e)}")

@app.get("/trainees/{emp_id}")
async def get_trainee_by_empid(emp_id: str):
    """Get trainee by employee ID"""
    try:
        trainee = await db["trainees"].find_one({"empId": emp_id})
        if trainee:
            return JSONResponse(content=serialize_doc(trainee))
        raise HTTPException(status_code=404, detail="Trainee not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trainee: {str(e)}")

@app.get("/trainees/email/{email}")
async def get_trainee_by_email(email: str):
    """Get trainee by email"""
    try:
        trainee = await db["trainees"].find_one({"email": email})
        if trainee:
            return JSONResponse(content=serialize_doc(trainee))
        raise HTTPException(status_code=404, detail="Trainee not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trainee: {str(e)}")

@app.post("/trainees/{emp_id}/recommendations")
async def get_trainee_recommendations(emp_id: str):
    """Get AI-generated training recommendations for a trainee"""
    try:
        trainee = await db["trainees"].find_one({"empId": emp_id})
        if not trainee:
            raise HTTPException(status_code=404, detail="Trainee not found")
        
        recommendations = await generate_training_recommendations(trainee)
        return JSONResponse(content=recommendations)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@app.put("/trainees/{emp_id}/progress")
async def update_trainee_progress(emp_id: str, progress_data: dict):
    """Update trainee progress and scores"""
    try:
        update_data = {
            "progress": progress_data.get("progress", 0),
            "score": progress_data.get("score", 0),
            "phase": progress_data.get("phase", 1),
            "specialization": progress_data.get("specialization", "Pending")
        }
        
        result = await db["trainees"].update_one(
            {"empId": emp_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return JSONResponse(content={"message": "Progress updated successfully"})
        else:
            raise HTTPException(status_code=404, detail="Trainee not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating progress: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)