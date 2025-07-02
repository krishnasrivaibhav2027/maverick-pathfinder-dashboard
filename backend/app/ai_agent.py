import random
import string
from db import get_database
from config import settings
import re
import asyncio
import json
import io
import fitz  # PyMuPDF
from docx import Document

# Keep Ollama only for training recommendations where AI adds value
from langchain_ollama import ChatOllama
from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser

# Initialize the Ollama Language Model with configuration (only for recommendations)
llm = ChatOllama(
    model=settings.OLLAMA_MODEL, 
    temperature=settings.OLLAMA_TEMPERATURE,
    base_url=settings.OLLAMA_BASE_URL
)

db = get_database()

# Sample data for name generation
FIRST_NAMES = [
    "John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Jessica",
    "William", "Ashley", "James", "Amanda", "Christopher", "Stephanie", "Daniel",
    "Nicole", "Matthew", "Elizabeth", "Anthony", "Helen", "Mark", "Deborah",
    "Donald", "Rachel", "Steven", "Carolyn", "Paul", "Janet", "Andrew", "Catherine",
    "Joshua", "Maria", "Kenneth", "Heather", "Kevin", "Diane", "Brian", "Julie",
    "George", "Joyce", "Timothy", "Victoria", "Ronald", "Kelly", "Jason", "Christine",
    "Edward", "Joan", "Jeffrey", "Evelyn", "Ryan", "Lauren", "Jacob", "Judith",
    "Gary", "Megan", "Nicholas", "Cheryl", "Eric", "Andrea", "Jonathan", "Jacqueline",
    "Stephen", "Martha", "Larry", "Frances", "Justin", "Gloria", "Scott", "Ann",
    "Brandon", "Teresa", "Benjamin", "Kathryn", "Samuel", "Samantha", "Gregory", "Christina",
    "Frank", "Beverly", "Alexander", "Denise", "Raymond", "Marilyn", "Patrick", "Charlotte",
    "Jack", "Florence", "Dennis", "Irene", "Jerry", "Jean", "Tyler", "Lisa", "Aaron", "Theresa"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
    "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
    "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson",
    "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
    "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster"
]

def generate_secure_password(length=12):
    """Generate a secure password with specified requirements"""
    # Ensure we have at least 2 of each required character type
    password = []
    
    # Add 2 uppercase letters
    password.extend(random.choices(string.ascii_uppercase, k=2))
    
    # Add 2 lowercase letters
    password.extend(random.choices(string.ascii_lowercase, k=2))
    
    # Add 2 numbers
    password.extend(random.choices(string.digits, k=2))
    
    # Add 2 special characters
    special_chars = "!@#$%^&*"
    password.extend(random.choices(special_chars, k=2))
    
    # Fill the rest with random characters
    remaining_length = length - 8
    all_chars = string.ascii_letters + string.digits + special_chars
    password.extend(random.choices(all_chars, k=remaining_length))
    
    # Shuffle the password
    random.shuffle(password)
    
    return ''.join(password)

def generate_name_from_email(email: str) -> str:
    """Generate a professional name based on email or use random selection"""
    try:
        # Try to extract name from email first
        email_parts = email.split('@')[0]
        if '.' in email_parts:
            # If email has dots, try to use them as name parts
            name_parts = email_parts.split('.')
            if len(name_parts) >= 2:
                first_name = name_parts[0].title()
                last_name = name_parts[1].title()
                return f"{first_name} {last_name}"
        
        # If email extraction doesn't work well, use random selection
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        return f"{first_name} {last_name}"
        
    except Exception as e:
        print(f"Error generating name from email: {e}")
        # Fallback to random selection
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        return f"{first_name} {last_name}"

def generate_trainee_profile(email: str) -> dict:
    """
    Generate a professional name and secure password using efficient Python functions
    """
    try:
        # Generate name efficiently
        generated_name = generate_name_from_email(email)
        
        # Generate secure password efficiently
        generated_password = generate_secure_password(12)
        
        return {
            "name": generated_name,
            "password": generated_password
        }
    except Exception as e:
        print(f"Error generating profile: {e}")
        # Fallback: generate basic profile
        email_parts = email.split('@')[0]
        name = email_parts.replace('.', ' ').title()
        return {
            "name": name,
            "password": "TempPass123!"
        }

async def get_next_employee_id():
    """Get the next sequential employee ID (MAV-0001, MAV-0002, etc.)"""
    try:
        # Find the highest existing employee ID
        pipeline = [
            {
                "$match": {
                    "empId": {"$regex": "^MAV-\\d{4}$"}
                }
            },
            {
                "$addFields": {
                    "idNumber": {
                        "$toInt": {
                            "$substr": ["$empId", 4, 4]
                        }
                    }
                }
            },
            {
                "$sort": {"idNumber": -1}
            },
            {
                "$limit": 1
            }
        ]
        
        result = await db.trainees.aggregate(pipeline).to_list(1)
        
        if result:
            last_id = result[0]["idNumber"]
            next_id = last_id + 1
        else:
            next_id = 1
        
        return f"MAV-{next_id:04d}"
    except Exception as e:
        print(f"Error generating employee ID: {e}")
        # Fallback: generate a random ID
        return f"MAV-{random.randint(1000, 9999)}"

async def create_trainee_profile(email: str) -> dict:
    """
    Complete function to create a trainee profile with sequential ID and AI-generated credentials
    """
    try:
        # Generate name and password using AI
        profile = generate_trainee_profile(email)
        # Get next sequential employee ID
        emp_id = await get_next_employee_id()
        
        return {
            "name": profile["name"],
            "empId": emp_id,
            "password": profile["password"]
        }
    except Exception as e:
        print(f"Error creating trainee profile: {e}")
        # Fallback profile
        email_parts = email.split('@')[0]
        name = email_parts.replace('.', ' ').title()
        emp_id = await get_next_employee_id()
        
        return {
            "name": name,
            "empId": emp_id,
            "password": "TempPass123!"
        }

async def test_ollama_connection():
    """Test the connection to Ollama service (used only for training recommendations)"""
    try:
        # A simple invocation to check if the ollama service is responsive
        response = llm.invoke("hello")
        return True, "Ollama connection successful (for training recommendations)."
    except Exception as e:
        return False, f"Ollama connection failed: {e}"

async def generate_training_recommendations(trainee_data: dict) -> dict:
    """
    Generate personalized training recommendations based on trainee data
    """
    try:
        recommendation_prompt = PromptTemplate.from_template(
            "Based on the trainee profile: Name: {name}, Email: {email}, Phase: {phase}, "
            "Current Score: {score}, generate personalized training recommendations. "
            "Return a JSON format with: "
            "1. recommended_next_topics (list of 3-5 topics)"
            "2. estimated_completion_time (in weeks)"
            "3. difficulty_level (beginner/intermediate/advanced)"
            "4. motivational_message (encouraging message)"
        )
        
        chain = recommendation_prompt | llm | StrOutputParser()
        
        response = chain.invoke({
            "name": trainee_data.get("name", ""),
            "email": trainee_data.get("email", ""),
            "phase": trainee_data.get("phase", 1),
            "score": trainee_data.get("score", 0)
        })
        
        return {
            "recommendations": response,
            "generated_at": "2024-01-01"  # You can add proper timestamp
        }
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return {
            "recommendations": "Continue with current training phase",
            "generated_at": "2024-01-01"
        }

async def extract_resume_fields_with_llama(resume_text: str) -> dict:
    """
    Use Llama3 (Ollama) to extract name, email, and skills from resume text.
    """
    prompt = (
        "Extract the candidate's full name, email address, and a list of skills from the following resume text. "
        "Respond in JSON format with keys: name, email, skills.\n\n"
        f"Resume:\n{resume_text}"
    )
    try:
        response = await llm.ainvoke(prompt)
        data = json.loads(response)
        if not all(k in data for k in ("name", "email", "skills")):
            raise ValueError("Missing keys in Llama response")
        return data
    except Exception as e:
        print(f"Llama extraction failed: {e}")
        return None

def extract_text_from_pdf(pdf_bytes):
    """Extract text from PDF bytes using PyMuPDF."""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        text = "\n".join(page.get_text() for page in doc)
    return text

def extract_text_from_docx(docx_bytes):
    """Extract text from DOCX bytes using python-docx."""
    doc = Document(io.BytesIO(docx_bytes))
    text = "\n".join(para.text for para in doc.paragraphs)
    return text

def fast_extract_resume_fields(text: str, skill_priority=None) -> dict:
    """
    Fast extraction of name, email, and skills using regex and heuristics.
    Returns None if extraction is not confident.
    """
    if not text or not text.strip():
        return None
    # Email extraction
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    email = email_match.group(0) if email_match else None
    # Name extraction: use first non-empty line, or generate from email
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = None
    if lines:
        # Heuristic: skip lines with 'resume', 'curriculum', or email
        for line in lines:
            if (len(line.split()) >= 2 and
                'resume' not in line.lower() and
                'curriculum' not in line.lower() and
                '@' not in line):
                name = line
                break
    if not name and email:
        name = generate_name_from_email(email)
    # Skill extraction
    found_skill = None
    if skill_priority:
        text_lower = text.lower()
        for skill in skill_priority:
            if skill in text_lower:
                found_skill = skill
                break
    # If all fields found, return
    if name and email and found_skill:
        return {"name": name, "email": email, "skills": [found_skill]}
    # If at least email and skill found, return (name can fallback to LLM)
    if email and found_skill:
        return {"name": name, "email": email, "skills": [found_skill]}
    return None
