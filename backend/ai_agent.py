from langchain_ollama import ChatOllama
from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from .db import get_database
import re

# It's recommended to load the API key from environment variables
# For example, using python-dotenv and a .env file
# from dotenv import load_dotenv
# load_dotenv()

# Initialize the Ollama Language Model
# This requires Ollama to be running locally on your machine.
# You can change the model to any other model you have, e.g., "mistral"
llm = ChatOllama(model="llama3", temperature=0.7)

db = get_database()

async def get_next_employee_id():
    """Get the next sequential employee ID (MAV-0001, MAV-0002, etc.)"""
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

def generate_trainee_profile(email: str) -> dict:
    """
    Uses a LangChain agent with a local Ollama model to generate a 
    professional name and a unique password based on an email address.
    """
    name_generation_prompt = PromptTemplate.from_template(
        "You are a helpful HR assistant. Based on the email address '{email}', "
        "invent a plausible and professional-sounding full name. "
        "Return only the full name and nothing else."
    )
    password_generation_prompt = PromptTemplate.from_template(
        "You are a secure password generator. Generate a unique, strong, temporary password for a new employee. "
        "It should be at least 10 characters, include uppercase, lowercase, numbers, and a symbol. "
        "Return only the password and nothing else."
    )
    name_chain = name_generation_prompt | llm | StrOutputParser()
    password_chain = password_generation_prompt | llm | StrOutputParser()
    # Generate the name
    generated_name = name_chain.invoke({"email": email})
    # Generate the password
    generated_password = password_chain.invoke({})
    return {
        "name": generated_name.strip(),
        "password": generated_password.strip()
    }

async def create_trainee_profile(email: str) -> dict:
    """
    Complete function to create a trainee profile with sequential ID and AI-generated password
    """
    # Generate name and password using AI
    profile = generate_trainee_profile(email)
    # Get next sequential employee ID
    emp_id = await get_next_employee_id()
    return {
        "name": profile["name"],
        "empId": emp_id,
        "password": profile["password"]
    } 