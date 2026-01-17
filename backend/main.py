from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import engine, Base
from routers import tweets, users

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Imitation API",
    description="Backend API for the Imitation Twitter-like application",
    version="1.0.0"
)

# Configure CORS
settings = get_settings()
origins = settings.api_cors_origins.split(",") if settings.api_cors_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tweets.router)
app.include_router(users.router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "app": "imitation-api"}


@app.get("/health")
def health_check():
    """Health check for deployment readiness."""
    return {"status": "healthy"}
