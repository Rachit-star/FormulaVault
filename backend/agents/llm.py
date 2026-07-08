import os
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

def get_llm(temperature: float = 0.7):
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if groq_key:
        return ChatGroq(
            api_key=groq_key,
            model="qwen/qwen3-32b",
            temperature=temperature,
        )
    elif gemini_key:
        return ChatGoogleGenerativeAI(
            google_api_key=gemini_key,
            model="gemini-2.0-flash",
            temperature=temperature,
        )
    else:
        raise ValueError("No LLM API key found. Set GROQ_API_KEY or GEMINI_API_KEY.")