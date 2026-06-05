const API = window.location.origin;

function getSid() {
  const params = new URLSearchParams(window.location.search);
  return params.get('session') || localStorage.getItem('lastSession');
}

function setSid(sid) {
  localStorage.setItem('lastSession', sid);
}

async function generate() {
  const jd = document.getElementById('jd').value.trim();
  const resume = document.getElementById('resume').value.trim();
  if (!jd || !resume) { alert('Please paste both JD and resume.'); return; }
  const btn = document.getElementById('generateBtn');
  const loading = document.getElementById('loading');
  btn.disabled = true; loading.style.display = 'inline';
  try {
    const res = await fetch(`${API}/api/generate`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({jd, resume})
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setSid(data.session_id);
    window.location.href = `/dashboard?session=${data.session_id}`;
  } catch (e) {
    alert('Error: ' + e.message);
    btn.disabled = false; loading.style.display = 'none';
  }
}

let session = null;
let activeQid = null;
let allCategories = new Set();
let currentFilter = 'All';

async function loadDashboard() {
  const sid = getSid();
  if (!sid) { document.getElementById('noSession').classList.remove('hidden'); return; }
  const res = await fetch(`${API}/api/session/${sid}`);
  if (!res.ok) { document.getElementById('noSession').classList.remove('hidden'); return; }
  session = await res.json();
  document.getElementById('practiceArea').classList.remove('hidden');
  renderCategories();
  renderQuestionList();
  if (session.questions && session.questions.length) selectQuestion(session.questions[0].id);
}

function renderCategories() {
  allCategories = new Set(['All']);
  session.questions.forEach(q => allCategories.add(q.category || 'General'));
  const container = document.getElementById('categories');
  container.innerHTML = '';
  allCategories.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'badge' + (cat === currentFilter ? ' active' : '');
    b.textContent = cat;
    b.onclick = () => { currentFilter = cat; renderCategories(); renderQuestionList(); };
    container.appendChild(b);
  });
}

function renderQuestionList() {
  const container = document.getElementById('questionList');
  container.innerHTML = '';
  (session.questions || []).forEach(q => {
    if (currentFilter !== 'All' && q.category !== currentFilter) return;
    const card = document.createElement('div');
    const answered = q.user_answer ? '✅ ' : '';
    card.className = 'card question-card';
    card.innerHTML = `<div class="flex" style="justify-content:space-between;"><span class="difficulty ${q.difficulty}">${q.difficulty}</span>${q.user_answer ? '<span style="color:var(--success);">✓</span>' : ''}</div><h3>${answered}${q.question.substring(0, 90)}${q.question.length>90?'...':''}</h3>`;
    card.onclick = () => selectQuestion(q.id);
    container.appendChild(card);
  });
}

function selectQuestion(qid) {
  activeQid = qid;
  const q = session.questions.find(x => x.id === qid);
  if (!q) return;
  document.getElementById('qDifficulty').textContent = q.difficulty;
  document.getElementById('qDifficulty').className = 'difficulty ' + q.difficulty;
  document.getElementById('qCategory').textContent = q.category || 'General';
  document.getElementById('qText').textContent = q.question;
  document.getElementById('qLooking').textContent = 'Interviewer is looking for: ' + (q.what_interviewer_wants || '');
  const box = document.getElementById('transcriptBox');
  box.textContent = (q.user_answer && q.user_answer.transcript) ? q.user_answer.transcript : 'Click "Speak Answer" and start talking, or type directly here...';
  document.getElementById('feedbackCard').classList.add('hidden');
  renderQuestionList();
}

async function evaluateAnswer() {
  const sid = getSid();
  const transcript = document.getElementById('transcriptBox').textContent.trim();
  if (!transcript || transcript.startsWith('Click')) { alert('Please speak or type an answer first.'); return; }
  const btn = document.getElementById('evalBtn');
  const loading = document.getElementById('evalLoading');
  btn.disabled = true; loading.style.display = 'inline';
  try {
    const res = await fetch(`${API}/api/evaluate`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({session_id: sid, q_id: activeQid, transcript})
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    showFeedback(data);
    const q = session.questions.find(x => x.id === activeQid);
    if (q) q.user_answer = data;
    renderQuestionList();
  } catch (e) {
    alert('Evaluation error: ' + e.message);
  } finally {
    btn.disabled = false; loading.style.display = 'none';
  }
}

function showFeedback(data) {
  const card = document.getElementById('feedbackCard');
  card.classList.remove('hidden');
  const score = Math.round(data.overall_score || 0);
  document.getElementById('scoreCircle').style.setProperty('--score', score);
  document.getElementById('scoreVal').textContent = score;
  document.getElementById('techAcc').textContent = data.technical_accuracy || 0;
  document.getElementById('compScore').textContent = data.completeness || 0;
  document.getElementById('clarityScore').textContent = data.clarity || 0;
  document.getElementById('whatGood').textContent = data.what_was_good || '';
  document.getElementById('whatMissing').textContent = data.what_was_missing || '';
  document.getElementById('howImprove').textContent = data.how_to_improve || '';
  document.getElementById('modelAnswer').textContent = data.model_answer || '';
  card.scrollIntoView({behavior:'smooth'});
}

async function loadResults() {
  const sid = getSid();
  if (!sid) { document.getElementById('noSession').classList.remove('hidden'); return; }
  const res = await fetch(`${API}/api/session/${sid}`);
  if (!res.ok) { document.getElementById('noSession').classList.remove('hidden'); return; }
  session = await res.json();
  document.getElementById('resultsArea').classList.remove('hidden');
  const qs = session.questions || [];
  const answered = qs.filter(q => q.user_answer);
  const avg = answered.length ? (answered.reduce((s,q) => s + (q.user_answer.score||0),0) / answered.length).toFixed(1) : 0;
  document.getElementById('totalQ').textContent = qs.length;
  document.getElementById('answeredQ').textContent = answered.length;
  document.getElementById('avgScore').textContent = avg;
  const tbody = document.getElementById('resultsTable');
  tbody.innerHTML = '';
  qs.forEach((q, i) => {
    const tr = document.createElement('tr');
    const score = q.user_answer ? (q.user_answer.score || 0) : '-';
    const action = `<a href="/dashboard?session=${session.id}&q=${q.id}">Practice</a>`;
    tr.innerHTML = `<td>${i+1}</td><td>${q.category||'General'}</td><td>${q.question.substring(0,80)}...</td><td>${score}</td><td>${action}</td>`;
    tbody.appendChild(tr);
  });
  const iqContainer = document.getElementById('interviewerQs');
  iqContainer.innerHTML = '';
  (session.interviewer_questions || []).forEach(iq => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<div class="flex" style="justify-content:space-between;"><span class="badge">${iq.category}</span></div><h3 class="mt">${iq.question}</h3><p class="small mt"><strong>Why ask:</strong> ${iq.why_ask}</p><p class="small mt" style="color:var(--danger);"><strong>Red flag:</strong> ${iq.red_flag}</p>`;
    iqContainer.appendChild(div);
  });
}

if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard.html') {
  loadDashboard();
} else if (window.location.pathname === '/results' || window.location.pathname === '/results.html') {
  loadResults();
}

window.generate = generate;
window.evaluateAnswer = evaluateAnswer;
window.selectQuestion = selectQuestion;
