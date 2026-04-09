from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.config import settings
from app.routers import auth, submissions, diagnoses, dashboard, websocket

app = FastAPI(title="CodePathology", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["submissions"])
app.include_router(diagnoses.router, prefix="/api/diagnoses", tags=["diagnoses"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(websocket.router, tags=["websocket"])

# Lambda handler
handler = Mangum(app, lifespan="off")
