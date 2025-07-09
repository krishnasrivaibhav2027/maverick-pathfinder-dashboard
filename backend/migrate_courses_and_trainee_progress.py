import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

EXAMPLE_COURSES = [
    {
        "course_id": "1",
        "title": "Programming Fundamentals",
        "description": "Core programming concepts.",
        "subcourses": [
            {"subcourse_id": "1-1", "title": "Variables & Data Types"},
            {"subcourse_id": "1-2", "title": "Control Structures"},
            {"subcourse_id": "1-3", "title": "Functions & Modules"},
            {"subcourse_id": "1-4", "title": "Input & Output"},
            {"subcourse_id": "1-5", "title": "Error Handling"},
            {"subcourse_id": "1-6", "title": "Loops & Iteration"},
            {"subcourse_id": "1-7", "title": "Basic Algorithms"},
        ]
    },
    {
        "course_id": "2",
        "title": "Object-Oriented Programming (OOP) Concepts",
        "description": "OOP principles and design.",
        "subcourses": [
            {"subcourse_id": "2-1", "title": "Classes & Objects"},
            {"subcourse_id": "2-2", "title": "Inheritance & Polymorphism"},
            {"subcourse_id": "2-3", "title": "Encapsulation"},
            {"subcourse_id": "2-4", "title": "Abstraction"},
            {"subcourse_id": "2-5", "title": "Interfaces & Abstract Classes"},
            {"subcourse_id": "2-6", "title": "Composition vs Inheritance"},
            {"subcourse_id": "2-7", "title": "OOP Design Patterns"},
        ]
    },
    {
        "course_id": "3",
        "title": "Version Control with Git & GitHub",
        "description": "Source control and collaboration.",
        "subcourses": [
            {"subcourse_id": "3-1", "title": "Git Basics"},
            {"subcourse_id": "3-2", "title": "Collaboration with GitHub"},
            {"subcourse_id": "3-3", "title": "Branching & Merging"},
            {"subcourse_id": "3-4", "title": "Resolving Conflicts"},
            {"subcourse_id": "3-5", "title": "Rebasing & Cherry-pick"},
            {"subcourse_id": "3-6", "title": "Git Workflows"},
            {"subcourse_id": "3-7", "title": "Tagging & Releases"},
        ]
    },
    {
        "course_id": "4",
        "title": "Database Fundamentals",
        "description": "Introduction to databases.",
        "subcourses": [
            {"subcourse_id": "4-1", "title": "Introduction"},
            {"subcourse_id": "4-2", "title": "Core Concepts"},
            {"subcourse_id": "4-3", "title": "Practical Examples"},
            {"subcourse_id": "4-4", "title": "Common Pitfalls"},
            {"subcourse_id": "4-5", "title": "Best Practices"},
            {"subcourse_id": "4-6", "title": "Mini Project"},
            {"subcourse_id": "4-7", "title": "Quiz & Assessment"},
        ]
    },
    {
        "course_id": "5",
        "title": "Software Development Lifecycle & Agile Basics",
        "description": "SDLC and Agile methodologies.",
        "subcourses": [
            {"subcourse_id": "5-1", "title": "Introduction"},
            {"subcourse_id": "5-2", "title": "Core Concepts"},
            {"subcourse_id": "5-3", "title": "Practical Examples"},
            {"subcourse_id": "5-4", "title": "Common Pitfalls"},
            {"subcourse_id": "5-5", "title": "Best Practices"},
            {"subcourse_id": "5-6", "title": "Mini Project"},
            {"subcourse_id": "5-7", "title": "Quiz & Assessment"},
        ]
    },
    {
        "course_id": "6",
        "title": "Basic Data Structures & Algorithms",
        "description": "Foundations of data structures and algorithms.",
        "subcourses": [
            {"subcourse_id": "6-1", "title": "Introduction"},
            {"subcourse_id": "6-2", "title": "Core Concepts"},
            {"subcourse_id": "6-3", "title": "Practical Examples"},
            {"subcourse_id": "6-4", "title": "Common Pitfalls"},
            {"subcourse_id": "6-5", "title": "Best Practices"},
            {"subcourse_id": "6-6", "title": "Mini Project"},
            {"subcourse_id": "6-7", "title": "Quiz & Assessment"},
        ]
    },
    {
        "course_id": "7",
        "title": "Debugging & Problem Solving",
        "description": "Debugging techniques and problem solving skills.",
        "subcourses": [
            {"subcourse_id": "7-1", "title": "Introduction"},
            {"subcourse_id": "7-2", "title": "Core Concepts"},
            {"subcourse_id": "7-3", "title": "Practical Examples"},
            {"subcourse_id": "7-4", "title": "Common Pitfalls"},
            {"subcourse_id": "7-5", "title": "Best Practices"},
            {"subcourse_id": "7-6", "title": "Mini Project"},
            {"subcourse_id": "7-7", "title": "Quiz & Assessment"},
        ]
    },
    {
        "course_id": "101",
        "title": "Python Programming Essentials",
        "description": "Python basics and libraries.",
        "subcourses": [
            {"subcourse_id": "101-1", "title": "Python Syntax & Variables"},
            {"subcourse_id": "101-2", "title": "Control Flow in Python"},
            {"subcourse_id": "101-3", "title": "Functions & Modules"},
            {"subcourse_id": "101-4", "title": "File I/O"},
            {"subcourse_id": "101-5", "title": "Error Handling in Python"},
            {"subcourse_id": "101-6", "title": "Python Data Structures"},
            {"subcourse_id": "101-7", "title": "Simple Python Project"},
        ]
    },
    {
        "course_id": "102",
        "title": "Intro to Python Libraries (NumPy, Pandas, Requests, Matplotlib)",
        "description": "Popular Python libraries for data and web.",
        "subcourses": [
            {"subcourse_id": "102-1", "title": "NumPy Basics"},
            {"subcourse_id": "102-2", "title": "Pandas DataFrames"},
            {"subcourse_id": "102-3", "title": "Requests Library"},
            {"subcourse_id": "102-4", "title": "Matplotlib Plotting"},
            {"subcourse_id": "102-5", "title": "Data Analysis Workflow"},
            {"subcourse_id": "102-6", "title": "Mini Data Project"},
            {"subcourse_id": "102-7", "title": "Quiz & Assessment"},
        ]
    },
    {
        "course_id": "201",
        "title": "Java Programming Essentials",
        "description": "Java basics and libraries.",
        "subcourses": [
            {"subcourse_id": "201-1", "title": "Java Syntax & Variables"},
            {"subcourse_id": "201-2", "title": "Control Flow in Java"},
            {"subcourse_id": "201-3", "title": "Functions & Modules"},
            {"subcourse_id": "201-4", "title": "File I/O"},
            {"subcourse_id": "201-5", "title": "Error Handling in Java"},
            {"subcourse_id": "201-6", "title": "Java Data Structures"},
            {"subcourse_id": "201-7", "title": "Simple Java Project"},
        ]
    },
    {
        "course_id": "202",
        "title": "Intro to Java Libraries (Standard Library, JUnit)",
        "description": "Popular Java libraries for development.",
        "subcourses": [
            {"subcourse_id": "202-1", "title": "Standard Library Overview"},
            {"subcourse_id": "202-2", "title": "JUnit Testing"},
            {"subcourse_id": "202-3", "title": "Collections Framework"},
            {"subcourse_id": "202-4", "title": "File I/O in Java"},
            {"subcourse_id": "202-5", "title": "Java Streams"},
            {"subcourse_id": "202-6", "title": "Mini Java Project"},
            {"subcourse_id": "202-7", "title": "Quiz & Assessment"},
        ]
    },
    {
        "course_id": "301",
        "title": "C# Programming Essentials",
        "description": "C# basics and .NET libraries.",
        "subcourses": [
            {"subcourse_id": "301-1", "title": "C# Syntax & Variables"},
            {"subcourse_id": "301-2", "title": "Control Flow in C#"},
            {"subcourse_id": "301-3", "title": "Functions & Modules"},
            {"subcourse_id": "301-4", "title": "File I/O"},
            {"subcourse_id": "301-5", "title": "Error Handling in C#"},
            {"subcourse_id": "301-6", "title": "C# Data Structures"},
            {"subcourse_id": "301-7", "title": "Simple C# Project"},
        ]
    },
    {
        "course_id": "302",
        "title": "Intro to .NET Libraries (LINQ, File I/O, NUnit/xUnit)",
        "description": ".NET libraries for development.",
        "subcourses": [
            {"subcourse_id": "302-1", "title": "LINQ Basics"},
            {"subcourse_id": "302-2", "title": "File I/O in .NET"},
            {"subcourse_id": "302-3", "title": "NUnit/xUnit Testing"},
            {"subcourse_id": "302-4", "title": ".NET Collections"},
            {"subcourse_id": "302-5", "title": "Mini .NET Project"},
            {"subcourse_id": "302-6", "title": "Quiz & Assessment"},
        ]
    },
]

async def migrate():
    client = AsyncIOMotorClient('mongodb+srv://gksvaibav99:vaibhu2027@cluster0.rc32pqz.mongodb.net/mydatabase?retryWrites=true&w=majority&tls=true')
    db = client['maverick_dashboard']
    courses_col = db['courses']
    trainees_col = db['trainees']

    # Seed courses collection
    for course in EXAMPLE_COURSES:
        await courses_col.update_one({"course_id": course["course_id"]}, {"$set": course}, upsert=True)
    print(f"Seeded {len(EXAMPLE_COURSES)} courses.")

    # Update all trainees
    first_course_id = EXAMPLE_COURSES[0]["course_id"]
    count = 0
    async for trainee in trainees_col.find({}):
        set_update = {}
        unset_update = {}
        if "current_course_id" not in trainee:
            set_update["current_course_id"] = first_course_id
        if "completed_courses" not in trainee:
            set_update["completed_courses"] = []
        if "progress" not in trainee:
            set_update["progress"] = []
        if "completed_subcourses" in trainee:
            unset_update["completed_subcourses"] = ""
        update_doc = {}
        if set_update:
            update_doc["$set"] = set_update
        if unset_update:
            update_doc["$unset"] = unset_update
        if update_doc:
            await trainees_col.update_one({"_id": trainee["_id"]}, update_doc)
            count += 1
    print(f"Migrated {count} trainees.")

if __name__ == "__main__":
    asyncio.run(migrate()) 