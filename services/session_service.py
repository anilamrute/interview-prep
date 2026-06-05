import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
SESSIONS_FILE = DATA_DIR / "sessions.json"


def _load():
    if SESSIONS_FILE.exists():
        with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}


def _save(data):
    with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def create_session(jd: str, resume: str, questions: list, interviewer_questions: list) -> str:
    data = _load()
    sid = str(uuid.uuid4())
    data[sid] = {
        "id": sid,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "jd": jd,
        "resume": resume,
        "questions": questions,
        "interviewer_questions": interviewer_questions,
    }
    _save(data)
    return sid


def get_session(sid: str):
    return _load().get(sid)


def list_sessions():
    return list(_load().values())


def update_session(sid: str, qid: str, answer_obj: dict):
    data = _load()
    session = data.get(sid)
    if not session:
        return False
    for q in session.get("questions", []):
        if q.get("id") == qid:
            q["user_answer"] = answer_obj
            break
    _save(data)
    return True
