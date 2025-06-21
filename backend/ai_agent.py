
from langchain_ollama import ChatOllama
from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from db import get_database
from config import settings
import re
import asyncio

# Initialize the Ollama Language Model with configuration
llm = ChatOllama(
    model=settings.OLLAMA_MODEL, 
    temperature=settings.OLLAMA_TEMPERATURE,
    base_url=settings.OLLAMA_BASE_URL
)

db = get_database()

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
        import random
        return f"MAV-{random.randint(1000, 9999)}"

def generate_trainee_profile(email: str) -> dict:
    """
    Uses a LangChain agent with a local Ollama model to generate a 
    professional name and a unique password based on an email address.
    """
    try:
        name_generation_prompt = PromptTemplate.from_template(
            "You are a helpful HR assistant. Based on the email address '{email}', "
            "generate a realistic and professional-sounding full name that could belong to this email. "
            "The name should be appropriate for a corporate training environment. "
            "Return only the full name (first and last name) and nothing else. "
            "Example format: John Smith"
        )
        
        password_generation_prompt = PromptTemplate.from_template(
            "Generate a secure temporary password for a new employee training account. "
            "The password must be exactly 12 characters long and include: "
            "- At least 2 uppercase letters "
            "- At least 2 lowercase letters "
            "- At least 2 numbers "
            "- At least 2 special characters from: !@#$%^&* "
            "Make it memorable but secure. Return only the password and nothing else."
        )
        
        name_chain = name_generation_prompt | llm | StrOutputParser()
        password_chain = password_generation_prompt | llm | StrOutputParser()
        
        # Generate the name
        generated_name = name_chain.invoke({"email": email})
        # Clean up the name (remove any extra text)
        name_clean = re.sub(r'[^\w\s]', '', generated_name.strip())
        
        # Generate the password
        generated_password = password_chain.invoke({})
        # Clean up the password (remove any extra text, keep only the password)
        password_clean = re.sub(r'[^\w!@#$%^&*]', '', generated_password.strip())
        
        # Ensure password meets minimum requirements
        if len(password_clean) < 8:
            password_clean = "TempPass123!"  # Fallback password
        
        return {
            "name": name_clean,
            "password": password_clean
        }
    except Exception as e:
        print(f"Error generating profile with AI: {e}")
        # Fallback: generate basic profile
        email_parts = email.split('@')[0]
        name = email_parts.replace('.', ' ').title()
        return {
            "name": name,
            "password": "TempPass123!"
        }

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
    """Test the connection to Ollama service"""
    try:
        # A simple invocation to check if the ollama service is responsive
        response = llm.invoke("hello")
        return True, "Ollama connection successful."
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
