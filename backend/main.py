from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from bson import ObjectId
import asyncio
import uuid
from datetime import datetime
from pydantic import BaseModel

from db import get_database, test_db_connection, ensure_indexes
from models import (
    Trainee, Admin, DashboardStats, WeeklyProgress, 
    PhaseDistribution, Training, Task, LoginRequest, SetPasswordRequest,
    ChangePasswordRequest, Batch
)
from ai_agent import create_trainee_profile, test_ollama_connection, generate_training_recommendations
from email_service import test_emailjs_connection, prepare_welcome_email_data
from config import settings

app = FastAPI(
    title="Maverick Dashboard",
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
    print("🚀 Starting Maverick Dashboard Backend...")
    
    # Try to ensure database indexes (non-critical)
    try:
        index_success = await ensure_indexes()
        if index_success:
            print("✅ Database indexes setup completed")
        else:
            print("⚠️  Database indexes setup skipped - server will work without optimal indexes")
    except Exception as e:
        print(f"⚠️  Database indexes setup error: {e} - continuing without indexes")
    
    # Test all services
    db_status, db_message = await test_db_connection()
    ollama_status, ollama_message = await test_ollama_connection()
    emailjs_status, emailjs_message = test_emailjs_connection()
    
    print(f"📊 Database: {'✅' if db_status else '❌'} {db_message}")
    print(f"🤖 Ollama: {'✅' if ollama_status else '❌'} {ollama_message}")
    print(f"📧 EmailJS: {'✅' if emailjs_status else '❌'} {emailjs_message} (Note: EmailJS emails are sent from the frontend, not backend)")
    
    if db_status and emailjs_status:
        print("🎉 Critical services are ready!")
    else:
        print("⚠️  Some critical services are not ready. Check the configuration.")

@app.get("/")
async def read_root():
    """Health check endpoint that tests all services"""
    db_status, db_message = await test_db_connection()
    ollama_status, ollama_message = await test_ollama_connection()
    emailjs_status, emailjs_message = test_emailjs_connection()

    overall_status = "ok" if db_status and emailjs_status else "error"

    html_content = f"""
    <html>
    <head>
        <title>Maverick Dashboard - Health Check</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            table {{ border-collapse: collapse; width: 100%; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
            .status-ok {{ color: green; }}
            .status-error {{ color: red; }}
        </style>
    </head>
    <body>
        <h1>🚀 Maverick Dashboard</h1>
        <p><strong>Version:</strong> {settings.APP_VERSION}</p>
        <p><strong>Status:</strong> <span class="{'status-ok' if overall_status == 'ok' else 'status-error'}">{overall_status}</span></p>
        
        <h2>📊 Services Status</h2>
        <table>
            <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Message</th>
            </tr>
            <tr>
                <td>📊 Database</td>
                <td class="{'status-ok' if db_status else 'status-error'}">{'✅ OK' if db_status else '❌ Error'}</td>
                <td>{db_message}</td>
            </tr>
            <tr>
                <td>🤖 Ollama</td>
                <td class="{'status-ok' if ollama_status else 'status-error'}">{'✅ OK' if ollama_status else '❌ Error'}</td>
                <td>{ollama_message}</td>
            </tr>
            <tr>
                <td>📧 EmailJS</td>
                <td class="{'status-ok' if emailjs_status else 'status-error'}">{'✅ Configured' if emailjs_status else '❌ Error'}</td>
                <td>{emailjs_message} <br><em>Note: EmailJS emails are sent from the frontend using the provided data. Backend does not send emails directly.</em></td>
            </tr>
        </table>
        
        <h2>🔗 API Endpoints</h2>
        <ul>
            <li><a href="/health-check">/health-check</a> - JSON health check</li>
            <li><a href="/trainees">/trainees</a> - List all trainees</li>
            <li><a href="/admins">/admins</a> - List all admins</li>
        </ul>
        
        <p><em>Frontend is available at: <a href="http://localhost:8080">http://localhost:8080</a></em></p>
        <p><strong>ℹ️ EmailJS Integration:</strong> The backend only prepares email data for the frontend. Actual email sending is performed by the frontend using EmailJS's JavaScript SDK. If you want to confirm email delivery, consider implementing a callback from the frontend to the backend after sending.</p>
        <p><em>© 2025 Hexaware Technologies. All rights reserved.</em></p>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

@app.get("/health-check")
async def health_check():
    """Alternative health check endpoint"""
    return await read_root()

@app.post("/auth/login")
async def login(login_request: LoginRequest):
    """Handle user login with AI-generated profile creation for new trainees"""
    try:
        user_collection = db[f"{login_request.role}s"]
        # Support login by empId or email
        user = None
        if hasattr(login_request, 'empId') and login_request.empId:
            user = await user_collection.find_one({"empId": login_request.empId})
        elif login_request.email:
            user = await user_collection.find_one({"email": login_request.email})

        if user:
            # User exists - this is a login attempt
            if not login_request.password:
                # User exists but no password provided - this is invalid
                raise HTTPException(status_code=400, detail="User already exists. Please login with your password.")
            # Existing user login with password
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
        else:
            # Only allow registration if both name and email are provided
            if login_request.role == 'trainee' and login_request.name and login_request.email:
                try:
                    print(f"Creating new trainee profile for: {login_request.email} - {login_request.name}")
                    # Generate AI profile with credentials (but use provided name)
                    profile = await create_trainee_profile(login_request.email)
                    # Create trainee document using provided name
                    new_trainee = Trainee(
                        name=login_request.name,  # Use provided name instead of AI-generated
                        email=login_request.email,
                        password=profile["password"],
                        empId=profile["empId"],
                        phase=1,
                        progress=0,
                        score=0,
                        status="active",
                        specialization="Pending",
                        batch=getattr(login_request, 'batch', 'Batch 1'),
                        created_at=datetime.now().isoformat(),
                        last_login=datetime.now().isoformat()
                    )
                    # Store in database
                    result = await db.trainees.insert_one(new_trainee.model_dump())
                    if result.inserted_id:
                        print(f"✅ Trainee profile created successfully: {profile['empId']}")
                        # Prepare email data for frontend to send via EmailJS
                        email_data = prepare_welcome_email_data(
                            login_request.email,
                            login_request.name,
                            profile["empId"],
                            profile["password"]
                        )
                        return JSONResponse(content={
                            "status": "account_created",
                            "user": serialize_doc(new_trainee.dict()),
                            "message": "Account created successfully",
                            "emailData": email_data
                        })
                    else:
                        raise HTTPException(status_code=500, detail="Failed to create trainee account.")
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Error creating trainee: {str(e)}")
            else:
                raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@app.post("/api/user/set-password")
async def set_password(request: SetPasswordRequest):
    """Set a new password for a user and mark it as not temporary."""
    try:
        # For now, we only support trainees changing passwords this way
        user_collection = db.trainees
        
        # In a real app, you'd hash the password here.
        # For now, storing plaintext to match existing logic.
        new_password = request.new_password

        result = await user_collection.update_one(
            {"email": request.email},
            {"$set": {
                "password": new_password,
                "password_is_temporary": False
            }}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        if result.modified_count == 0:
            # This could happen if the user provides the same password
            # We'll still mark it as not temporary if needed
            await user_collection.update_one(
                {"email": request.email},
                {"$set": {"password_is_temporary": False}}
            )

        return JSONResponse(content={"status": "success", "message": "Password updated successfully"})

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Set Password error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/user/change-password")
async def change_password(request: ChangePasswordRequest):
    """Allow a logged-in user to change their password."""
    try:
        user_collection = db.trainees
        user = await user_collection.find_one({"email": request.email})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify old password
        if user.get("password") != request.old_password:
            raise HTTPException(status_code=401, detail="Incorrect old password")
            
        # Update to new password
        result = await user_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": request.new_password}}
        )
        
        if result.modified_count == 0:
            # This can happen if the new password is the same as the old one
            raise HTTPException(status_code=400, detail="New password cannot be the same as the old password.")

        return JSONResponse(content={"status": "success", "message": "Password changed successfully"})

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Change Password error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/admins")
async def get_admins():
    """Get all admins (without passwords for security)"""
    try:
        data = []
        cursor = db["admins"].find({}, {"password": 0})  # Exclude passwords
        async for document in cursor:
            data.append(serialize_doc(document))
        return JSONResponse(content={
            "admins": data,
            "count": len(data)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching admins: {str(e)}")

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

@app.post("/api/admin/bulk-create-trainees")
async def bulk_create_trainees(trainees_data: list = Body(...)):
    """Bulk create trainee accounts from admin upload"""
    try:
        print(f"🚀 Bulk creation request received for {len(trainees_data)} trainees")
        created_trainees = []
        failed_trainees = []
        
        for i, trainee_info in enumerate(trainees_data):
            try:
                print(f"📝 Processing trainee {i+1}/{len(trainees_data)}: {trainee_info.get('name', 'Unknown')}")
                
                # Validate required fields
                if not trainee_info.get("name") or not trainee_info.get("email"):
                    print(f"❌ Validation failed for trainee {i+1}: Missing name or email")
                    failed_trainees.append({
                        "name": trainee_info.get("name", "Unknown"),
                        "email": trainee_info.get("email", "Unknown"),
                        "error": "Name and email are required"
                    })
                    continue
                
                # Check if trainee already exists
                existing_trainee = await db.trainees.find_one({"email": trainee_info["email"]})
                if existing_trainee:
                    print(f"⚠️ Trainee already exists: {trainee_info['email']}")
                    failed_trainees.append({
                        "name": trainee_info["name"],
                        "email": trainee_info["email"],
                        "error": "Trainee already exists"
                    })
                    continue
                
                # Generate AI profile
                print(f"🤖 Generating profile for {trainee_info['email']}")
                profile = await create_trainee_profile(trainee_info["email"])
                
                # Create trainee document
                new_trainee = Trainee(
                    name=trainee_info["name"],  # Use provided name
                    email=trainee_info["email"],
                    password=profile["password"],
                    empId=profile["empId"],
                    phase=1,
                    progress=0,
                    score=0,
                    status="active",
                    specialization="Pending",
                    batch=getattr(trainee_info, 'batch', 'Batch 1'),
                    created_at=datetime.now().isoformat(),
                    last_login=datetime.now().isoformat()
                )
                
                # Store in database
                print(f"💾 Storing trainee in database: {profile['empId']}")
                result = await db.trainees.insert_one(new_trainee.model_dump())
                if result.inserted_id:
                    # Prepare email data for frontend to send via EmailJS
                    print(f"📧 Preparing email data for {trainee_info['email']}")
                    email_data = prepare_welcome_email_data(
                        trainee_info["email"],
                        trainee_info["name"],
                        profile["empId"],
                        profile["password"]
                    )
                    
                    created_trainees.append({
                        "name": trainee_info["name"],
                        "email": trainee_info["email"],
                        "empId": profile["empId"],
                        "password": profile["password"],
                        "emailData": email_data
                    })
                    
                    print(f"✅ Trainee created successfully: {profile['empId']} - {trainee_info['name']}")
                else:
                    print(f"❌ Database insertion failed for {trainee_info['email']}")
                    failed_trainees.append({
                        "name": trainee_info["name"],
                        "email": trainee_info["email"],
                        "error": "Failed to create trainee account"
                    })
                    
            except Exception as e:
                print(f"❌ Error processing trainee {i+1}: {str(e)}")
                failed_trainees.append({
                    "name": trainee_info.get("name", "Unknown"),
                    "email": trainee_info.get("email", "Unknown"),
                    "error": str(e)
                })
        
        print(f"🎉 Bulk creation completed: {len(created_trainees)} created, {len(failed_trainees)} failed")
        
        response_data = {
            "status": "success",
            "message": f"Bulk trainee creation completed. {len(created_trainees)} created, {len(failed_trainees)} failed.",
            "created_trainees": created_trainees,
            "failed_trainees": failed_trainees,
            "summary": {
                "total_requested": len(trainees_data),
                "successful": len(created_trainees),
                "failed": len(failed_trainees)
            }
        }
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        print(f"❌ Bulk creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk creation error: {str(e)}")

@app.post("/batches")
async def create_batch(batch: Batch):
    batch_dict = batch.dict()
    batch_dict['created_at'] = datetime.now().isoformat()
    result = await db.batches.insert_one(batch_dict)
    batch_dict['id'] = str(result.inserted_id)
    return JSONResponse(content=batch_dict)

@app.get("/batches")
async def list_batches():
    batches = []
    cursor = db.batches.find()
    async for document in cursor:
        document['id'] = str(document['_id'])
        batches.append(document)
    return JSONResponse(content=batches)

@app.get("/batches/{batch_id}")
async def get_batch(batch_id: str):
    batch = await db.batches.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch['id'] = str(batch['_id'])
    return JSONResponse(content=batch)

@app.put("/batches/{batch_id}")
async def update_batch(batch_id: str, batch: Batch):
    batch_dict = {k: v for k, v in batch.dict().items() if v is not None}
    await db.batches.update_one({"_id": ObjectId(batch_id)}, {"$set": batch_dict})
    updated = await db.batches.find_one({"_id": ObjectId(batch_id)})
    updated['id'] = str(updated['_id'])
    return JSONResponse(content=updated)

@app.delete("/batches/{batch_id}")
async def delete_batch(batch_id: str):
    result = await db.batches.delete_one({"_id": ObjectId(batch_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
    return JSONResponse(content={"status": "deleted"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
