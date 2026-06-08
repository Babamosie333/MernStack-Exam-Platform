(function () {
  if (!requireStudent()) return;

  const chapterId = getQueryParam('chapterId');
  if (!chapterId) {
    window.location.href = '/dashboard.html';
    return;
  }

  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.getElementById('tabWarning').classList.remove('hidden');
    }
  });

  const examTitle = document.getElementById('examTitle');
  const examProgress = document.getElementById('examProgress');
  const timerDisplay = document.getElementById('timerDisplay');
  const questionNav = document.getElementById('questionNav');
  const questionArea = document.getElementById('questionArea');
  const alertEl = document.getElementById('alert');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const markBtn = document.getElementById('markBtn');
  const submitBtn = document.getElementById('submitBtn');

  let examData = null;
  let currentIndex = 0;
  const answers = {};
  const marked = new Set();
  let endTime = null;
  let timerInterval = null;
  let submitting = false;
  const startedAt = Date.now();

  function showError(msg) {
    alertEl.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  }

  function updateTimer() {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      timerDisplay.textContent = '00:00';
      timerDisplay.classList.add('danger');
      submitExam(true);
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timerDisplay.classList.toggle('danger', remaining < 60000);
  }

  function renderNav() {
    questionNav.innerHTML = examData.questions
      .map((q, i) => {
        const answered = answers[q._id];
        const review = marked.has(q._id);
        const active = i === currentIndex ? 'active' : '';
        const status = answered ? 'answered' : review ? 'review' : '';
        return `<button type="button" class="q-nav-btn ${active} ${status}" data-index="${i}">${i + 1}</button>`;
      })
      .join('');

    questionNav.querySelectorAll('.q-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentIndex = Number(btn.dataset.index);
        renderQuestion();
        renderNav();
      });
    });
  }

  function renderQuestion() {
    const q = examData.questions[currentIndex];
    examProgress.textContent = `Q ${currentIndex + 1}/${examData.questions.length}`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === examData.questions.length - 1;
    markBtn.textContent = marked.has(q._id) ? 'Unmark Review' : 'Mark for Review';

    const selected = answers[q._id];
    questionArea.innerHTML = `
      <div class="question-card">
        <p class="question-marks">${q.marks} mark(s)</p>
        <h2>${q.questionText}</h2>
        <div class="option-cards">
          ${['A', 'B', 'C', 'D']
            .map(
              (key) => `
            <label class="option-card ${selected === key ? 'selected' : ''}">
              <input type="radio" name="answer" value="${key}" ${selected === key ? 'checked' : ''} />
              <span class="option-key">${key}</span>
              <span class="option-text">${q.options[key]}</span>
            </label>`
            )
            .join('')}
        </div>
      </div>`;

    questionArea.querySelectorAll('input[type=radio]').forEach((input) => {
      input.addEventListener('change', () => {
        answers[q._id] = input.value;
        renderNav();
      });
    });
  }

  async function submitExam(auto = false) {
    if (submitting) return;
    if (!auto && !confirm('Submit your exam now? Unanswered questions will be marked incorrect.')) {
      return;
    }

    submitting = true;
    clearInterval(timerInterval);

    try {
      const timeTakenSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const result = await apiRequest('/api/exam/submit', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: examData.attemptId,
          answers,
          timeTakenSeconds,
        }),
      });
      sessionStorage.setItem('lastResult', JSON.stringify(result));
      window.location.href = `/result.html?attemptId=${examData.attemptId}`;
    } catch (err) {
      submitting = false;
      showError(`${err.message}. Please try again.`);
      timerInterval = setInterval(updateTimer, 1000);
    }
  }

  markBtn.addEventListener('click', () => {
    const q = examData.questions[currentIndex];
    if (marked.has(q._id)) marked.delete(q._id);
    else marked.add(q._id);
    renderNav();
    renderQuestion();
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderQuestion();
      renderNav();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < examData.questions.length - 1) {
      currentIndex += 1;
      renderQuestion();
      renderNav();
    }
  });

  submitBtn.addEventListener('click', () => submitExam(false));

  apiRequest(`/api/exam/${chapterId}`)
    .then((data) => {
      examData = data;
      examTitle.textContent = data.title;
      endTime = Date.now() + data.durationMinutes * 60 * 1000;
      timerInterval = setInterval(updateTimer, 1000);
      updateTimer();
      renderNav();
      renderQuestion();
    })
    .catch((err) => {
      showError(err.message);
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 2000);
    });
})();
