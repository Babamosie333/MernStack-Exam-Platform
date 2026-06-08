(function () {
  if (getToken()) {
    window.location.href = '/dashboard.html';
    return;
  }

  const alertEl = document.getElementById('alert');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      loginForm.classList.toggle('hidden', !isLogin);
      registerForm.classList.toggle('hidden', isLogin);
      alertEl.innerHTML = '';
    });
  });

  function showError(msg) {
    alertEl.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest('/api/student/login', {
        method: 'POST',
        body: JSON.stringify({
          phone: document.getElementById('loginPhone').value.trim(),
          password: document.getElementById('loginPassword').value,
        }),
      });
      setSession(data.token, data.student);
      window.location.href = '/dashboard.html';
    } catch (err) {
      showError(err.message);
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    if (password !== confirm) {
      showError('Passwords do not match');
      return;
    }
    try {
      const data = await apiRequest('/api/student/register', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('regName').value.trim(),
          phone: document.getElementById('regPhone').value.trim(),
          password,
        }),
      });
      setSession(data.token, data.student);
      window.location.href = '/dashboard.html';
    } catch (err) {
      showError(err.message);
    }
  });
})();
