"""
Shared parsing utilities for LLM response processing.
Eliminates duplication across quiz_agent.py, pyq_agent.py, and eval_agent.py.
"""

import re


def strip_thinking_tags(raw: str) -> str:
    """
    Strips <think>...</think> tags from LLM responses.
    Some models (like Qwen) wrap their reasoning in these tags.
    """
    if '</think>' in raw:
        return raw.split('</think>')[-1].strip()
    elif '<think>' in raw:
        # If there's an opening tag but no closing tag, try to find the actual content
        # by looking for known section headers
        for header in ['VERDICT', 'QUESTION']:
            match = re.search(rf'\b{header}\s*:', raw, re.IGNORECASE)
            if match:
                return raw[match.start():]
    return raw


def parse_structured_response(raw: str, sections: dict[str, str]) -> dict:
    """
    Generic parser for structured LLM responses with labeled sections.

    Args:
        raw: The raw LLM response text (thinking tags already stripped)
        sections: A dict mapping UPPERCASE section headers to result dict keys.
                  e.g. {"QUESTION": "question", "CORRECT": "correct"}

    Returns:
        A dict with keys from `sections` values, plus 'raw' containing the original text.
    """
    result = {key: "" for key in sections.values()}
    result["raw"] = raw

    current_key = None

    for line in raw.strip().split('\n'):
        line = line.strip()
        if not line:
            continue

        clean_line = line.replace('**', '')
        upper_line = clean_line.upper()

        matched = False
        for header, key in sections.items():
            if upper_line.startswith(f"{header}:"):
                current_key = key
                result[key] = clean_line[len(header) + 1:].strip()
                matched = True
                break

        if not matched and current_key:
            result[current_key] += "\n" + clean_line

    return result


def parse_question_format(raw: str) -> dict:
    """
    Parses the standard question format used by quiz_agent and pyq_agent:
    QUESTION: ...
    A) ...
    B) ...
    C) ...
    D) ...
    CORRECT: ...
    ANSWER_VALUE: ...
    """
    raw = strip_thinking_tags(raw)

    result = {
        "question": "",
        "options": {},
        "correct": "",
        "answer_value": "",
        "raw": raw
    }

    current_key = None

    for line in raw.strip().split('\n'):
        line = line.strip()
        if not line:
            continue

        clean_line = line.replace('**', '')
        upper_line = clean_line.upper()

        if upper_line.startswith("QUESTION:"):
            current_key = "question"
            result["question"] = clean_line[len("QUESTION:"):].strip()
        elif upper_line.startswith("A)"):
            current_key = "A"
            result["options"]["A"] = clean_line[2:].strip()
        elif upper_line.startswith("B)"):
            current_key = "B"
            result["options"]["B"] = clean_line[2:].strip()
        elif upper_line.startswith("C)"):
            current_key = "C"
            result["options"]["C"] = clean_line[2:].strip()
        elif upper_line.startswith("D)"):
            current_key = "D"
            result["options"]["D"] = clean_line[2:].strip()
        elif upper_line.startswith("CORRECT:"):
            current_key = "correct"
            result["correct"] = clean_line[len("CORRECT:"):].strip().upper()
        elif upper_line.startswith("ANSWER_VALUE:"):
            current_key = "answer_value"
            result["answer_value"] = clean_line[len("ANSWER_VALUE:"):].strip()
        elif upper_line.startswith("SOURCE:"):
            current_key = "source_url"
            result["source_url"] = clean_line[len("SOURCE:"):].strip()
        else:
            if current_key == "question":
                result["question"] += "\n" + clean_line
            elif current_key in ["A", "B", "C", "D"]:
                result["options"][current_key] += "\n" + clean_line

    return result


def parse_eval_format(raw: str) -> dict:
    """
    Parses the evaluation response format:
    VERDICT: ...
    EXPLANATION: ...
    BETTER_FORMULA: ...
    TIP: ...
    """
    raw = strip_thinking_tags(raw)

    return parse_structured_response(raw, {
        "VERDICT": "verdict",
        "EXPLANATION": "explanation",
        "BETTER_FORMULA": "better_formula",
        "TIP": "tip",
    })
