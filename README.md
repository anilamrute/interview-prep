# 🎯 VW DevOps Interview Prep App

A local web app that generates tailored interview questions for your **Volkswagen Group Digital Solutions India — AWS DevOps Engineer** interview.

Paste your JD + resume → Get AI-generated questions → Practice verbal answers with speech-to-text → Get instant AI scoring + feedback → Review & improve.

---

## ✨ Features

- **AI Question Generation** — 15–20 categorized questions tailored to your resume + JD
- **Model Answers** — Each question shows what the interviewer wants + a strong model answer
- **Speech-to-Text Practice** — Click "Speak Answer" and practice verbally (Chrome/Edge)
- **AI Evaluation** — Get scored 0-10 with strengths, gaps, and improvement tips
- **Questions to Ask Them** — AI-generated smart questions to ask your interviewer
- **Session History** — All sessions saved locally in JSON for review
- **Zero Frontend Build** — Vanilla JS, runs in any browser
- **Free LLM Only** — Works with Groq free tier, Ollama local, OpenRouter, or Gemini

---

## 🚀 Quick Start

### 1. Clone / Download

```bash
cd interview-prep-app
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

> **Windows users:** Use `py -m pip install -r requirements.txt` or `python -m pip install -r requirements.txt`

### 3. Get a free LLM API key

**Recommended: Groq (fastest, easiest)**
1. Go to [console.groq.com](https://console.groq.com/keys)
2. Sign up (free, no credit card)
3. Create an API key
4. Copy it

**Alternative: Ollama (completely free, local, no API key needed)**
1. Install Ollama: [ollama.com/download](https://ollama.com/download)
2. Pull a model: `ollama pull llama3`
3. Skip to Step 5 — leave API key empty

**Alternative: OpenRouter / Gemini**
- OpenRouter: [openrouter.ai](https://openrouter.ai/) → get free key
- Gemini: [aistudio.google.com](https://aistudio.google.com/app/apikey) → get free key

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your key:

```bash
# Groq (recommended)
LLM_PROVIDER=groq
LLM_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
LLM_MODEL=llama3-70b-8192

# OR Ollama (local, no key needed)
# LLM_PROVIDER=ollama
# LLM_API_KEY=
# LLM_MODEL=llama3
```

### 5. Launch the app

```bash
python -m uvicorn main:app --reload
```

### 6. Open in browser

Go to: [http://localhost:8000](http://localhost:8000)

The **JD and your resume are already pre-filled**! Just click **"Generate Questions"**.

---

## 📋 How to Use

### Input Page (`/`)
- Your VW JD and resume are pre-filled
- Click **✨ Generate Questions** → waits 10-30 seconds for AI
- Redirects to Practice page automatically

### Practice Page (`/dashboard`)
- **Left sidebar** — filter questions by category (AWS, K8s, CI/CD, etc.)
- **Click any question** — sees the question + what interviewer wants
- **🎙️ Speak Answer** — start talking, your speech is transcribed live
- Click **⏹️ Stop Recording** when done
- Edit the transcript if needed
- Click **✅ Get Feedback** — AI scores you + shows model answer

### Review Page (`/results`)
- See total questions, answered count, average score
- Expand any question for model answer
- **💡 Questions to Ask Interviewer** — smart questions tailored to your profile

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'fastapi'` | Run `pip install -r requirements.txt` |
| `RuntimeError: LLM_API_KEY is required` | Add your API key to `.env` file |
| "Web Speech API not supported" | Use **Chrome or Edge**. Firefox/Safari don't support speech recognition. |
| Questions fail to generate | Check your internet connection and API key. Try switching provider in `.env` |
| Slow generation | Groq is fastest. Ollama on CPU is slower but free. |

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.10+, FastAPI, Uvicorn |
| HTTP Client | httpx (async) |
| AI/LLM | Groq / Ollama / OpenRouter / Gemini |
| Frontend | Vanilla JS, CSS3 |
| Speech | Web Speech API (browser-native) |
| Storage | JSON file (`data/sessions.json`) |

---

## 📂 Project Structure

```
interview-prep-app/
├── main.py                      # FastAPI app + API routes
├── config.py                    # LLM provider config
├── requirements.txt             # Python deps
├── .env.example                 # Env template
├── prompts/
│   ├── generate_questions.txt   # Prompt for Q generation
│   ├── evaluate_answer.txt      # Prompt for scoring
│   └── interviewer_questions.txt# Prompt for Qs to ask them
├── services/
│   ├── llm_service.py           # LLM client wrapper
│   └── session_service.py       # JSON persistence
├── static/
│   ├── index.html               # Input screen
│   ├── dashboard.html           # Practice screen
│   ├── results.html             # Review screen
│   ├── css/style.css            # Dark theme + responsive
│   └── js/
│       ├── app.js               # Main logic
│       └── speech.js            # Speech-to-text
└── data/
    └── sessions.json            # Saved sessions
```

---

## 📝 License & Disclaimer

Built for **personal interview preparation** only. Do not share proprietary JD content publicly. All processing happens locally or via your own LLM API key.

**Good luck with your Volkswagen interview! 🚗🚀**
