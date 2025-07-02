# Maverick Pathfinder Dashboard

A full-stack application with a FastAPI backend and a React frontend.

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB
- Tesseract OCR
- Git

---

## Manual Setup

### Backend
```sh
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
# or
source venv/bin/activate  # On Mac/Linux
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env  # Edit .env as needed
uvicorn app.main:app --reload
```

### Frontend
```sh
cd frontend
npm install
npm run dev
```

---

## Docker Setup (Recommended)

1. Copy and edit environment variables:
   ```sh
   cp backend/.env.example backend/.env
   # Edit backend/.env as needed
   ```
2. Build and start all services:
   ```sh
   docker-compose up --build
   ```
3. Access the frontend at [http://localhost:3000](http://localhost:3000)
4. The backend API will be at [http://localhost:8000](http://localhost:8000)

---

## Project Structure

```
backend/    # FastAPI app
frontend/   # React app
```

---

## Troubleshooting
- Ensure MongoDB and Tesseract are installed or running (or use Docker Compose for both).
- For any issues, check the logs with `docker-compose logs`.
