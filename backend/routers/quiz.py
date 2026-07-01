from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.quiz_agent import generate_question, get_adjacent_topic
from agents.eval_agent import evaluate_answer


router = APIRouter(prefix="/quiz", tags=["quiz"])

class QuizRequest(BaseModel):
    formula_title: str
    formula_expression: str
    formula_topic: str = ""
    exam_context: str = "CAT"
    mix_formula: dict | None = None
    auto_mix: bool = False

class EvalRequest(BaseModel):
    question: str
    correct_answer: str
    correct_letter: str
    user_answer: str
    formula_title: str
    formula_expression: str
    exam_context: str = "CAT"

@router.post("/generate")
async def generate_quiz(req: QuizRequest):
    try:
        mix = req.mix_formula
        if req.auto_mix and req.formula_topic:
            adjacent = get_adjacent_topic(req.formula_topic)
            if adjacent:
                mix = {
                    "title": adjacent.title(),
                    "expression": "",
                    "topic": adjacent
                }

        result = await generate_question(
            formula_title=req.formula_title,
            formula_expression=req.formula_expression,
            formula_topic=req.formula_topic,
            exam_context=req.exam_context,
            mix_formula=mix,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate")
async def evaluate_quiz(req: EvalRequest):
    try:
        result = await evaluate_answer(
            question=req.question,
            correct_answer=req.correct_answer,
            correct_letter=req.correct_letter,
            user_answer=req.user_answer,
            formula_title=req.formula_title,
            formula_expression=req.formula_expression,
            exam_context=req.exam_context,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))        