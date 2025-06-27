from fastapi import FastAPI, HTTPException, Body, UploadFile, File, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from bson import ObjectId
import asyncio
import uuid
from datetime import datetime
from pydantic import BaseModel
import zipfile
import io
import re
from PyPDF2 import PdfReader
from fastapi import Depends
import os
import requests
import time
import logging

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

router = APIRouter()

BATCH_SIZE = 50
SKILL_PRIORITY = ["python", "java", ".net", "dotnet"]

def serialize_doc(doc):
    """Serialize MongoDB document for JSON response"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def collapse_single_letters(line):
    # If line is mostly single letters separated by spaces, collapse them
    if re.match(r'^([A-Za-z] ?)+$', line):
        # Collapse multiple spaces, then split and join letters into words
        words = [''.join(g) for g in re.findall(r'(?:[A-Za-z] ?)+', line)]
        return ' '.join([w.replace(' ', '') for w in words])
    return line

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

@router.post("/onboarding/upload-resumes")
async def upload_resumes(file: UploadFile = File(...)):
    # Read zip file
    zip_content = await file.read()
    trainees = []
    
    try:
        with zipfile.ZipFile(io.BytesIO(zip_content)) as zip_file:
            pdf_files = [f for f in zip_file.namelist() if f.lower().endswith('.pdf')]
            
            if not pdf_files:
                raise HTTPException(status_code=400, detail="No PDF files found in zip")
            
            print(f"Processing {len(pdf_files)} PDF files...")
            
            for pdf_name in pdf_files:
                try:
                    pdf_bytes = zip_file.read(pdf_name)
                    print(f"Processing: {pdf_name}")
                    
                    # Use PyPDF2 as primary method (more reliable)
                    text = extract_text_from_pdf_pypdf2(pdf_bytes)
                    
                    if not text.strip():
                        print(f"Warning: No text extracted from {pdf_name}")
                        continue
                    
                    print(f"Extracted {len(text)} characters from {pdf_name}")
                    print(f"First 200 chars: {text[:200]}...")
                    
                    # Parse name and email
                    lines = text.split('\n')
                    name = None
                    email = None
                    
                    # Name extraction (improved)
                    for line in lines[:20]:  # Check first 20 lines
                        line = line.strip()
                        if not line:
                            continue
                        
                        # Handle "Name: ..." format
                        if line.lower().startswith('name:'):
                            name = line[5:].strip()
                            break
                        # Handle capitalized names (likely to be the person's name)
                        elif line and line[0].isupper() and len(line.split()) <= 4:
                            # Skip if it's clearly not a name
                            if any(word.lower() in ['resume', 'cv', 'curriculum', 'vitae', 'phone', 'email', 'address'] for word in line.split()):
                                continue
                            name = line
                            break
                    
                    # If no name found, try to extract from filename
                    if not name:
                        name = pdf_name.replace('.pdf', '').replace('_', ' ').replace('-', ' ').title()
                    
                    # Email extraction (improved)
                    for line in lines:
                        line = line.strip()
                        if not line:
                            continue
                        
                        # Look for lines containing "email" or "@"
                        if 'email' in line.lower() or '@' in line:
                            # Extract email using regex
                            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', line, re.IGNORECASE)
                            if email_match:
                                email = email_match.group(0)
                                break
                    
                    # If no email found, generate one from name
                    if not email:
                        email = f"{name.lower().replace(' ', '.')}@example.com"
                    
                    # Skill detection
                    text_lower = text.lower()
                    found_skill = None
                    for skill in SKILL_PRIORITY:
                        if skill in text_lower:
                            found_skill = skill
                            break
                    
                    # Clean up name (handle split letters)
                    if name:
                        name = collapse_single_letters(name)
                    
                    trainees.append({
                        'name': name,
                        'email': email,
                        'skill': found_skill or 'unknown',
                        'pdf': pdf_name
                    })
                    
                except Exception as e:
                    print(f"Error processing {pdf_name}: {e}")
                    continue
                    
        if not trainees:
            logging.warning("No trainees parsed from uploaded resumes. Check extraction and parsing logic.")
            raise HTTPException(status_code=400, detail="No valid resumes could be processed")
            
        print(f"Successfully processed {len(trainees)} trainees")
        
    except Exception as e:
        print(f"Error processing zip file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing zip file: {str(e)}")
    
    # Batch allocation
    batches = {'python': [], 'java': [], '.net': [], 'next_batch': []}
    batch_lists = {'python': [], 'java': [], '.net': []}  # List of lists for each batch
    for t in trainees:
        skill = t['skill']
        if skill not in ['python', 'java', '.net']:
            batches['next_batch'].append(t)
            continue
        # Find the first batch with space
        placed = False
        for idx, batch in enumerate(batch_lists[skill]):
            if len(batch) < BATCH_SIZE:
                batch.append(t)
                placed = True
                break
        if not placed:
            if len(batch_lists[skill]) == 0 or len(batch_lists[skill][-1]) >= BATCH_SIZE:
                batch_lists[skill].append([])
            batch_lists[skill][-1].append(t)
    
    # Save batches to DB
    batch_ids = []
    now = datetime.now().isoformat()
    for skill in ['python', 'java', '.net']:
        for i, batch in enumerate(batch_lists[skill]):
            batch_doc = Batch(
                batch_number=i+1,
                skill=skill,
                phase=1,
                is_next_batch=False,
                trainees=batch,
                created_at=now
            )
            result = await db.batches.insert_one(batch_doc.model_dump())
            batch_ids.append(str(result.inserted_id))
    
    # Save next_batch if any
    if batches['next_batch']:
        next_batch_doc = Batch(
            batch_number=0,
            skill='mixed',
            phase=1,
            is_next_batch=True,
            trainees=batches['next_batch'],
            created_at=now
        )
        result = await db.batches.insert_one(next_batch_doc.model_dump())
        batch_ids.append(str(result.inserted_id))
    
    return {"batch_ids": batch_ids, "summary": {
        "python_batches": len(batch_lists['python']),
        "java_batches": len(batch_lists['java']),
        ".net_batches": len(batch_lists['.net']),
        "next_batch_count": len(batches['next_batch']),
        "total_trainees": len(trainees)
    }}

@router.post("/onboarding/create-accounts-for-batch")
async def create_accounts_for_batch(batch_id: str):
    # Fetch batch from DB
    batch = await db.batches.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    if batch.get("accounts_created"):
        return {"status": "already_created", "message": "Accounts already created for this batch."}
    created_trainees = []
    failed_trainees = []
    for trainee in batch["trainees"]:
        # Skip if trainee already exists
        existing = await db.trainees.find_one({"email": trainee["email"]})
        if existing:
            failed_trainees.append({
                "name": trainee["name"],
                "email": trainee["email"],
                "error": "Trainee already exists"
            })
            continue
        # Generate Employee ID and password
        profile = await create_trainee_profile(trainee["email"])
        new_trainee = Trainee(
            name=trainee["name"],
            email=trainee["email"],
            password=profile["password"],
            empId=profile["empId"],
            phase=batch.get("phase", 1),
            progress=0,
            score=0,
            status="active",
            specialization=batch.get("skill", "Pending"),
            created_at=datetime.now().isoformat(),
            last_login=datetime.now().isoformat()
        )
        result = await db.trainees.insert_one(new_trainee.model_dump())
        if result.inserted_id:
            email_data = prepare_welcome_email_data(
                trainee["email"],
                trainee["name"],
                profile["empId"],
                profile["password"]
            )
            created_trainees.append({
                "name": trainee["name"],
                "email": trainee["email"],
                "empId": profile["empId"],
                "password": profile["password"],
                "emailData": email_data
            })
        else:
            failed_trainees.append({
                "name": trainee["name"],
                "email": trainee["email"],
                "error": "Failed to create trainee account"
            })
    # Mark batch as accounts_created
    await db.batches.update_one({"_id": ObjectId(batch_id)}, {"$set": {"accounts_created": True}})
    return {
        "status": "success",
        "created_trainees": created_trainees,
        "failed_trainees": failed_trainees,
        "summary": {
            "total": len(batch["trainees"]),
            "created": len(created_trainees),
            "failed": len(failed_trainees)
        }
    }

@router.get("/batch/{batch_id}")
async def get_batch(batch_id: str):
    batch = await db.batches.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch["_id"] = str(batch["_id"])
    return batch

@router.get("/batches")
async def list_batches():
    batches = []
    cursor = db.batches.find()
    async for batch in cursor:
        batch["_id"] = str(batch["_id"])
        batches.append(batch)
    return batches

@router.get("/batches/phase/{phase}")
async def list_batches_by_phase(phase: int):
    batches = []
    cursor = db.batches.find({"phase": phase})
    async for batch in cursor:
        batch["_id"] = str(batch["_id"])
        batches.append(batch)
    return batches

@router.get("/batches/grouped")
async def grouped_batches():
    # Group batches by phase and batch_number, then by skill
    batches = []
    cursor = db.batches.find()
    async for batch in cursor:
        batch["_id"] = str(batch["_id"])
        batches.append(batch)
    grouped = {}
    for batch in batches:
        phase = batch.get("phase", 1)
        batch_number = batch.get("batch_number", 0)
        skill = batch.get("skill", "mixed")
        if phase not in grouped:
            grouped[phase] = {}
        if batch_number not in grouped[phase]:
            grouped[phase][batch_number] = {}
        grouped[phase][batch_number][skill] = batch
    return grouped

app.include_router(router)

def get_adobe_access_token(client_id: str, client_secret: str) -> str:
    """Get Adobe PDF Services access token using OAuth2 client credentials flow"""
    try:
        token_url = "https://ims-na1.adobelogin.com/ims/token/v3"
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": "https://pdf-services.adobe.io/extractpdf https://pdf-services.adobe.io/readpdf"
        }
        
        print(f"Requesting Adobe access token with client_id: {client_id[:8]}...")
        response = requests.post(token_url, headers=headers, data=data)
        
        if response.status_code != 200:
            print(f"Adobe token request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
        token_data = response.json()
        access_token = token_data.get("access_token")
        if access_token:
            print("Successfully obtained Adobe access token")
            return access_token
        else:
            print("No access token in response")
            print(f"Response: {token_data}")
            return None
            
    except Exception as e:
        print(f"Error getting Adobe access token: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return None

def submit_pdf_for_extraction(pdf_bytes: bytes, access_token: str, client_id: str) -> str:
    """Submit PDF for text extraction and return job URL"""
    try:
        # Create a unique job ID
        job_id = str(uuid.uuid4())
        
        # Submit the job using the correct Adobe PDF Services API endpoint
        submit_url = f"https://pdf-services.adobe.io/assets/{job_id}/operations/extractpdf"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "x-api-key": client_id,
            "Content-Type": "application/pdf"
        }
        
        # Add the operation parameters
        operation_params = {
            "targetFormat": "application/json"
        }
        
        # First, create the operation
        create_url = f"https://pdf-services.adobe.io/assets/{job_id}/operations/extractpdf"
        create_response = requests.put(create_url, headers=headers, json=operation_params)
        create_response.raise_for_status()
        
        # Then upload the PDF
        upload_url = f"https://pdf-services.adobe.io/assets/{job_id}/operations/extractpdf/input"
        upload_response = requests.put(upload_url, headers=headers, data=pdf_bytes)
        upload_response.raise_for_status()
        
        # Return the job URL for polling
        return f"https://pdf-services.adobe.io/assets/{job_id}/operations/extractpdf"
    except Exception as e:
        print(f"Error submitting PDF for extraction: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return None

def poll_job_status(job_url: str, access_token: str) -> str:
    """Poll job status until complete and return result URL"""
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        max_attempts = 30  # 30 seconds max
        for attempt in range(max_attempts):
            response = requests.get(job_url, headers=headers)
            response.raise_for_status()
            
            job_status = response.json()
            status = job_status.get("status")
            
            if status == "done":
                # Get the result URL
                result_url = job_status.get("result", {}).get("downloadUri")
                return result_url
            elif status == "failed":
                print(f"PDF extraction job failed: {job_status}")
                return None
            
            # Wait 1 second before next poll
            time.sleep(1)
        
        print("PDF extraction job timed out")
        return None
    except Exception as e:
        print(f"Error polling job status: {e}")
        return None

def download_and_extract_text(result_url: str, access_token: str) -> str:
    """Download the result zip and extract text from the JSON file"""
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        # Download the result zip
        response = requests.get(result_url, headers=headers)
        response.raise_for_status()
        
        # Extract the zip file
        with zipfile.ZipFile(io.BytesIO(response.content)) as zip_file:
            # Find the JSON file with extracted text
            json_files = [f for f in zip_file.namelist() if f.endswith('.json')]
            if not json_files:
                print("No JSON file found in extraction result")
                return ""
            
            # Read the first JSON file
            with zip_file.open(json_files[0]) as json_file:
                import json
                data = json.load(json_file)
                
                # Extract text from the JSON structure
                text_parts = []
                if "elements" in data:
                    for element in data["elements"]:
                        if "Text" in element:
                            text_parts.append(element["Text"])
                
                return " ".join(text_parts)
    except Exception as e:
        print(f"Error downloading and extracting text: {e}")
        return ""

def extract_text_from_pdf_adobe_rest(pdf_bytes):
    # Hardcoded credentials for local development
    client_id = "0ff63adad92845c098995a716a1f2d79"
    client_secret = "p8e-Y_xrG75PWKJJiUJ83vQRgSM0cWfCxY6v"
    if not client_id or not client_secret:
        print("Adobe PDF credentials not set.")
        return ""
    
    try:
        print("Attempting Adobe PDF Services API extraction...")
        token = get_adobe_access_token(client_id, client_secret)
        if not token:
            print("Failed to get Adobe access token, falling back to PyPDF2")
            return extract_text_from_pdf_pypdf2(pdf_bytes)
        
        print("Got Adobe access token, submitting PDF for extraction...")
        job_url = submit_pdf_for_extraction(pdf_bytes, token, client_id)
        if not job_url:
            print("Failed to submit PDF to Adobe, falling back to PyPDF2")
            return extract_text_from_pdf_pypdf2(pdf_bytes)
        
        print("PDF submitted, polling for results...")
        result_url = poll_job_status(job_url, token)
        if not result_url:
            print("Failed to get Adobe extraction results, falling back to PyPDF2")
            return extract_text_from_pdf_pypdf2(pdf_bytes)
        
        print("Downloading and extracting text from Adobe results...")
        text = download_and_extract_text(result_url, token)
        if text:
            print("Adobe PDF extraction successful")
            return text
        else:
            print("Adobe extraction returned empty text, falling back to PyPDF2")
            return extract_text_from_pdf_pypdf2(pdf_bytes)
            
    except Exception as e:
        print(f"Adobe PDF REST extraction failed: {e}")
        print("Falling back to PyPDF2")
        return extract_text_from_pdf_pypdf2(pdf_bytes)

def extract_text_from_pdf_pypdf2(pdf_bytes):
    """Fallback PDF text extraction using PyPDF2"""
    try:
        pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"PyPDF2 extraction also failed: {e}")
        return ""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
