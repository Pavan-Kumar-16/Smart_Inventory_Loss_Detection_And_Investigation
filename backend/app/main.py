
from fastapi import FastAPI, HTTPException
from app.routers import dashboard
from app.routers import detection
from app.routers import investigations
from fastapi.middleware.cors import CORSMiddleware
from app.database import check_database_connection

app = FastAPI(
    title="Smart Inventory Loss Detection API",
    description="Backend API for inventory monitoring and shrinkage detection.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(dashboard.router)
app.include_router(detection.router)
app.include_router(investigations.router)

@app.get("/")
def home():
    return {
        "message": "Smart Inventory Loss Detection API is running!"
    }


@app.get("/health")
def health_check():
    try:
        database_name = check_database_connection()

        return {
            "status": "healthy",
            "database": database_name,
            "database_status": "connected"
        }

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(error)}"
        )
