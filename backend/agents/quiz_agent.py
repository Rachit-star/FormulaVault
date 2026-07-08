import random
from langchain_core.prompts import ChatPromptTemplate
from agents.llm import get_llm
from agents.parsing import parse_question_format



TOPIC_ADJACENCY = {
    "percentage": ["profit and loss", "discount", "simple interest"],
    "profit and loss": ["percentage", "discount", "markup"],
    "discount": ["profit and loss", "percentage", "marked price"],
    "simple interest": ["compound interest", "percentage", "time and work"],
    "compound interest": ["simple interest", "percentage"],
    "time and work": ["pipes and cisterns", "simple interest"],
    "pipes and cisterns": ["time and work"],
    "time speed distance": ["relative motion", "boats and streams"],
    "boats and streams": ["time speed distance", "relative motion"],
    "permutation": ["combination", "probability"],
    "combination": ["permutation", "probability"],
    "probability": ["permutation", "combination"],
}

QUIZ_PROMPT = ChatPromptTemplate.from_template("""
You are an expert mathematics coach generating a practice question.

PRIMARY FORMULA:
Title: {formula_title}
Expression: {formula_expression}
Topic: {formula_topic}

{mix_section}

EXAM CONTEXT: {exam_context}

Based on the exam context above, intelligently infer:
- The appropriate difficulty level (college internal, competitive entrance, graduate level, etc.)
- The question style and format typical for that exam
- Any related exams that share a similar style

If the exam context is a well-known exam (CAT, JEE, GATE, GRE, GMAT, XAT, UPSC, etc.), calibrate precisely to that exam's known style.
If it is a college exam, university paper, or custom context, calibrate to a reasonable academic difficulty for that level.

INSTRUCTIONS:
- Generate ONE well-crafted word problem requiring the primary formula to solve
- Make it feel authentic to the exam context provided
- If a mix formula is provided, blend both topics naturally into one problem
- Provide exactly 4 options (A, B, C, D) with only one correct answer
- Keep the problem concise but complete
- Do not mention the formula name explicitly in the problem

RESPOND IN THIS EXACT FORMAT AFTER YOUR THINKING:
QUESTION: [restate the word problem clearly and completely]
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [A/B/C/D]
ANSWER_VALUE: [just the numeric/text answer]
""")

def get_exam_profile(exam_context: str) -> dict:
    return {"exam_context": exam_context or "general mathematics exam"}

def get_adjacent_topic(topic: str) -> str | None:
    if not topic:
        return None
    key = topic.lower().strip()
    adjacent = TOPIC_ADJACENCY.get(key, [])
    if adjacent:
        return random.choice(adjacent)
    return None

async def generate_question(
    formula_title: str,
    formula_expression: str,
    formula_topic: str,
    exam_context: str,
    mix_formula: dict | None = None,
) -> dict:
    llm = get_llm(temperature=0.8)
    profile = get_exam_profile(exam_context)

    mix_section = ""
    if mix_formula:
        mix_section = f"""
MIX FORMULA (blend this topic in too):
Title: {mix_formula.get('title', '')}
Expression: {mix_formula.get('expression', '')}
Topic: {mix_formula.get('topic', '')}
"""

    chain = QUIZ_PROMPT | llm
    response = await chain.ainvoke({
        "formula_title": formula_title,
        "formula_expression": formula_expression,
        "formula_topic": formula_topic,
        "exam_context": exam_context or "general mathematics exam",
        "mix_section": mix_section,
    })

    return parse_question_format(response.content)