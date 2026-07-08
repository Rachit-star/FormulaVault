import os
import re
from tavily import TavilyClient
from langchain_core.prompts import ChatPromptTemplate
from agents.quiz_agent import generate_question
from agents.llm import get_llm
from agents.parsing import parse_question_format, strip_thinking_tags

PYQ_FORMAT_PROMPT = ChatPromptTemplate.from_template("""
You are an expert exam coach. Below is a real past year question (PYQ) found from {exam_context}.

RAW QUESTION TEXT:
{raw_question}

FORMULA CONTEXT:
Title: {formula_title}
Expression: {formula_expression}

Your job is to extract and format this into a clean MCQ.
If the raw text already has options, extract them.
If not, generate 4 reasonable options where one is correct.
Verify the math before responding.

RESPOND IN THIS EXACT FORMAT:
QUESTION: [the clean question]
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [A/B/C/D]
ANSWER_VALUE: [just the numeric/text answer]
SOURCE: {source_url}
""")

async def find_pyq(
    formula_title: str,
    formula_expression: str,
    formula_topic: str,
    exam_context: str,
) -> dict:
    tavily_key = os.getenv("TAVILY_API_KEY")
    if not tavily_key:
        return await _fallback_generate(formula_title, formula_expression, formula_topic, exam_context)

    client = TavilyClient(api_key=tavily_key)

    # build targeted search queries
    queries = [
        f"{exam_context} past year question {formula_topic} with solution",
        f"{exam_context} PYQ {formula_title} problem",
        f"official {exam_context} question paper {formula_topic}",
    ]

    raw_question = None
    source_url = None

    for query in queries:
        try:
            results = client.search(
                query=query,
                search_depth="advanced",
                max_results=3,
                include_answer=True,
            )
            if results.get('answer') and len(results['answer']) > 50:
                raw_question = results['answer']
                source_url = results['results'][0]['url'] if results.get('results') else None
                break
            elif results.get('results'):
                for r in results['results']:
                    if len(r.get('content', '')) > 100:
                        raw_question = r['content'][:1000]
                        source_url = r['url']
                        break
                if raw_question:
                    break
        except Exception:
            continue

    if not raw_question:
        result = await _fallback_generate(formula_title, formula_expression, formula_topic, exam_context)
        result['source'] = 'generated'
        result['source_label'] = 'PYQ-style (not official)'
        return result

    # format the found question using LLM
    llm = get_llm(temperature=0.2)
    chain = PYQ_FORMAT_PROMPT | llm
    response = await chain.ainvoke({
        "exam_context": exam_context,
        "raw_question": raw_question,
        "formula_title": formula_title,
        "formula_expression": formula_expression,
        "source_url": source_url or "unknown",
    })

    # Parse using shared parser
    result = parse_question_format(response.content)
    result['source'] = 'real'
    result['source_url'] = source_url
    result['source_label'] = f'Found via web search — {exam_context}'
    return result


async def _fallback_generate(formula_title, formula_expression, formula_topic, exam_context):
    result = await generate_question(
        formula_title=formula_title,
        formula_expression=formula_expression,
        formula_topic=formula_topic,
        exam_context=exam_context,
        mix_formula=None,
    )
    result['source'] = 'generated'
    result['source_label'] = 'PYQ-style (not official)'
    return result
