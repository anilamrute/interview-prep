let recognition = null;
let isListening = false;

function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Web Speech API not supported in this browser. Please use Chrome or Edge.');
    return null;
  }
  const r = new SpeechRecognition();
  r.continuous = true;
  r.interimResults = true;
  r.lang = 'en-US';
  return r;
}

function toggleSpeech() {
  const btn = document.getElementById('speakBtn');
  const box = document.getElementById('transcriptBox');
  if (!recognition) recognition = initRecognition();
  if (!recognition) return;

  if (isListening) {
    recognition.stop();
    isListening = false;
    btn.textContent = '🎙️ Speak Answer';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-primary');
  } else {
    if (box.textContent.startsWith('Click')) box.textContent = '';
    recognition.start();
    isListening = true;
    btn.textContent = '⏹️ Stop Recording';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-danger');
  }

  recognition.onresult = (event) => {
    let final = '';
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += transcript + ' ';
      else interim += transcript;
    }
    const current = box.textContent.replace(/\.{3}$/, '');
    const base = current.endsWith('...') ? current.slice(0, -3) : current;
    box.textContent = (base + ' ' + final + interim).trim() + (interim ? '...' : '');
  };

  recognition.onerror = (e) => {
    console.error('Speech error', e);
    if (e.error !== 'aborted') alert('Speech error: ' + e.error);
    isListening = false;
    btn.textContent = '🎙️ Speak Answer';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-primary');
  };

  recognition.onend = () => {
    if (isListening) {
      recognition.start();
    } else {
      btn.textContent = '🎙️ Speak Answer';
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-primary');
    }
  };
}

window.toggleSpeech = toggleSpeech;
