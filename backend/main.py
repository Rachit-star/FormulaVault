import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import quiz as quiz_router
from routers import arena as arena_router

load_dotenv()

app = FastAPI(title="FormulaForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://formula-vault-eight.vercel.app",
    ],
    allow_credentials=False,
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