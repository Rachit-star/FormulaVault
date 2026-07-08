from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.orchestrator import run_quiz_mode, run_pyq_mode, run_evaluation
import traceback

router = APIRouter(prefix="/arena", tags=["arena"])

class ArenaRequest(BaseModel):
    mode: str  # 'quick' or 'pyq'
    formula: dict
    exam_context: str = "CAT"
    auto_mix: bool = False

class EvalRequest(BaseModel):
    question: str
    correct_answer: str
    correct_letter: str
    user_answer: str
    formula: dict
    exam_context: str = "CAT"

@router.post("/run")
async def run_arena(req: ArenaRequest):
    try:
        if req.mode == 'quick':
            result = await run_quiz_mode(
                formula=req.formula,
                exam_context=req.exam_context,
                auto_mix=req.auto_mix,
            )
        elif req.mode == 'pyq':
            result = await run_pyq_mode(
                formula=req.formula,
                exam_context=req.exam_context,
            )
        else:
            raise ValueError(f"Unknown mode: {req.mode}")

        return {"success": True, "data": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate")
async def evaluate_arena(req: EvalRequest):
    try:
        result = await run_evaluation(
            question=req.question,
            correct_answer=req.correct_answer,
            correct_letter=req.correct_letter,
            user_answer=req.user_answer,
            formula=req.formula,
            exam_context=req.exam_context,
        )
        return {"success": True, "data": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
