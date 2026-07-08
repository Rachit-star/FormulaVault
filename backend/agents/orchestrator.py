import asyncio
from agents.quiz_agent import generate_question, get_adjacent_topic
from agents.eval_agent import evaluate_answer
from agents.pyq_agent import find_pyq

async def run_quiz_mode(
    formula: dict,
    exam_context: str,
    auto_mix: bool = False,
    include_tips: bool = False,
) -> dict:
    """
    Orchestrates a quick quiz session.
    - Always runs QuizAgent
    - Optionally runs TipsAgent in parallel (when built)
    - Returns unified response
    """
    mix_formula = None
    if auto_mix and formula.get('topic'):
        adjacent = get_adjacent_topic(formula['topic'])
        if adjacent:
            mix_formula = {
                'title': adjacent.title(),
                'expression': '',
                'topic': adjacent,
            }

    # run QuizAgent (TipsAgent will be added here in parallel later)
    question_result = await generate_question(
        formula_title=formula['title'],
        formula_expression=formula['expression'],
        formula_topic=formula.get('topic', ''),
        exam_context=exam_context,
        mix_formula=mix_formula,
    )

    return {
        'mode': 'quick',
        'question': question_result,
        'formula': formula,
        'exam_context': exam_context,
        'tips': None,  # TipsAgent slot — filled in later
    }


async def run_pyq_mode(
    formula: dict,
    exam_context: str,
) -> dict:
    result = await find_pyq(
        formula_title=formula['title'],
        formula_expression=formula['expression'],
        formula_topic=formula.get('topic', ''),
        exam_context=exam_context,
    )

    return {
        'mode': 'pyq',
        'question': result,
        'formula': formula,
        'exam_context': exam_context,
        'source': result.get('source', 'generated'),
        'source_label': result.get('source_label', ''),
        'source_url': result.get('source_url'),
    }


async def run_evaluation(
    question: str,
    correct_answer: str,
    correct_letter: str,
    user_answer: str,
    formula: dict,
    exam_context: str,
) -> dict:
    """
    Orchestrates answer evaluation.
    - Runs EvalAgent
    - Returns verdict + explanation + confidence update signal
    """
    eval_result = await evaluate_answer(
        question=question,
        correct_answer=correct_answer,
        correct_letter=correct_letter,
        user_answer=user_answer,
        formula_title=formula['title'],
        formula_expression=formula['expression'],
        exam_context=exam_context,
    )

    is_correct = eval_result.get('verdict', '').upper() == 'CORRECT'

    return {
        'eval': eval_result,
        'confidence_update': 'solid' if is_correct else 'shaky',
        'formula_id': formula.get('id'),
    }
