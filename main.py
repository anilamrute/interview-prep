import json, re, uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.llm_service import chat_completion
from services import session_service

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

BASE_DIR = Path(__file__).parent


def _load_prompt(name: str) -> str:
    path = BASE_DIR / "prompts" / f"{name}.txt"
    return path.read_text(encoding="utf-8")


def _extract_json(text: str):
    text = text.strip()
    if text.startswith("```"):
        m = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
        if m:
            text = m.group(1)
    elif text.startswith("[") or text.startswith("{"):
        pass
    else:
        m = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
        if m:
            text = m.group(1)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON. Please try again.")


class GeneratePayload(BaseModel):
    jd: str
    resume: str


class EvaluatePayload(BaseModel):
    session_id: str
    q_id: str
    transcript: str


@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.get("/dashboard")
async def dashboard():
    return FileResponse("static/dashboard.html")


@app.get("/results")
async def results():
    return FileResponse("static/results.html")


@app.post("/api/generate")
async def generate_questions(payload: GeneratePayload):
    try:
        prompt = _load_prompt("generate_questions")
        prompt = prompt.replace("{jd}", payload.jd).replace("{resume}", payload.resume)
        raw = await chat_completion([{"role": "user", "content": prompt}])
        questions = _extract_json(raw)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    for i, q in enumerate(questions):
        q["id"] = q.get("id", f"q{i+1}")
        q.setdefault("user_answer", None)

    try:
        iq_prompt = _load_prompt("interviewer_questions")
        iq_prompt = iq_prompt.replace("{jd}", payload.jd).replace("{resume}", payload.resume)
        raw_iq = await chat_completion([{"role": "user", "content": iq_prompt}])
        interviewer_questions = _extract_json(raw_iq)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    for i, q in enumerate(interviewer_questions):
        q["id"] = q.get("id", f"iq{i+1}")

    sid = session_service.create_session(
        jd=payload.jd,
        resume=payload.resume,
        questions=questions,
        interviewer_questions=interviewer_questions,
    )
    return {"session_id": sid, "questions": questions, "interviewer_questions": interviewer_questions}


@app.post("/api/evaluate")
async def evaluate_answer(payload: EvaluatePayload):
    session = session_service.get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    question = next((q for q in session.get("questions", []) if q.get("id") == payload.q_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    prompt = _load_prompt("evaluate_answer")
    prompt = (
        prompt.replace("{question}", question.get("question", ""))
        .replace("{model_answer}", question.get("model_answer", ""))
        .replace("{transcript}", payload.transcript)
    )
    try:
        raw = await chat_completion([{"role": "user", "content": prompt}], temperature=0.5)
        feedback = _extract_json(raw)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    answer_obj = {
        "transcript": payload.transcript,
        "score": feedback.get("overall_score", 0),
        "technical_accuracy": feedback.get("technical_accuracy", 0),
        "completeness": feedback.get("completeness", 0),
        "clarity": feedback.get("clarity", 0),
        "what_was_good": feedback.get("what_was_good", ""),
        "what_was_missing": feedback.get("what_was_missing", ""),
        "how_to_improve": feedback.get("how_to_improve", ""),
        "model_answer": feedback.get("model_answer", question.get("model_answer", "")),
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }
    session_service.update_session(payload.session_id, payload.q_id, answer_obj)
    return feedback


@app.get("/api/session/{sid}")
async def get_session(sid: str):
    session = session_service.get_session(sid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/api/sessions")
async def list_sessions():
    return session_service.list_sessions()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
