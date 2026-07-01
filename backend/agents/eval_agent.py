from langchain_core.prompts import ChatPromptTemplate
from agents.llm import get_llm

EVAL_PROMPT = ChatPromptTemplate.from_template("""
You are an expert exam coach evaluating a student's answer.

QUESTION: {question}
CORRECT ANSWER: {correct_letter}) {correct_answer}
STUDENT'S ANSWER: {user_answer}
FORMULA USED: {formula_title} — {formula_expression}
EXAM: {exam_context}

Evaluate the student's answer and respond in this EXACT format:

VERDICT: [CORRECT/INCORRECT]
EXPLANATION: [Step by step solution in 3-5 lines. Be clear and concise.]
BETTER_FORMULA: [If a faster approach exists for this exam, mention it. Otherwise write NONE.]
TIP: [One sharp exam-specific tip for this type of problem.]
""")

async def evaluate_answer(
    question: str,
    correct_answer: str,
    correct_letter: str,
    user_answer: str,
    formula_title: str,
    formula_expression: str,
    exam_context: str,
) -> dict:
    llm = get_llm(temperature=0.3)

    chain = EVAL_PROMPT | llm
    response = await chain.ainvoke({
        "question": question,
        "correct_answer": correct_answer,
        "correct_letter": correct_letter,
        "user_answer": user_answer,
        "formula_title": formula_title,
        "formula_expression": formula_expression,
        "exam_context": exam_context,
    })

    return parse_eval(response.content)

def parse_eval(raw: str) -> dict:
    if '<think>' in raw and '</think>' in raw:
        raw = raw.split('</think>')[-1].strip()

    lines = raw.strip().split('\n')
    result = {
        "verdict": "",
        "explanation": "",
        "better_formula": "",
        "tip": "",
        "raw": raw
    }

    for line in lines:
        line = line.strip()
        if line.startswith("VERDICT:"):
            result["verdict"] = line.replace("VERDICT:", "").strip()
        elif line.startswith("EXPLANATION:"):
            result["explanation"] = line.replace("EXPLANATION:", "").strip()
        elif line.startswith("BETTER_FORMULA:"):
            result["better_formula"] = line.replace("BETTER_FORMULA:", "").strip()
        elif line.startswith("TIP:"):
            result["tip"] = line.replace("TIP:", "").strip()

    return result