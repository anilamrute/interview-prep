import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")

if LLM_PROVIDER == "ollama":
    BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:11434/v1")
    LLM_MODEL = os.getenv("LLM_MODEL", "llama3")
elif LLM_PROVIDER == "openrouter":
    BASE_URL = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
    LLM_MODEL = os.getenv("LLM_MODEL", "meta-llama/llama-3-70b-instruct")
elif LLM_PROVIDER == "gemini":
    BASE_URL = os.getenv("LLM_BASE_URL", "https://generativelanguage.googleapis.com/v1beta")
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-flash")
