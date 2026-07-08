import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import quiz as quiz_router
from routers import arena as arena_router

load_dotenv()

app = FastAPI(title="FormulaForge API")

# CORS: configurable via FRONTEND_URL env var, defaults to localhost:3000
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quiz_router.router)
app.include_router(arena_router.router)

@app.get("/")
def root():
    return {"status": "FormulaForge API running"}

@app.get("/health")
def health():
    return {"status": "ok"}