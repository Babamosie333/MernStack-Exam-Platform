(async function () {
  await requireAuth();
  const subjectFilter = document.getElementById('subjectFilter');
  const testFilter = document.getElementById('testFilter');
  const passFilter = document.getElementById('passFilter');
  const searchInput = document.getElementById('searchInput');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const exportBtn = document.getElementById('exportBtn');
  const tableBody = document.getElementById('tableBody');

  const subjects = await apiRequest('/api/subjects');
  subjectFilter.innerHTML +=
    subjects.map((s) => `<option value="${s._id}">${s.name}</option>`).join('');

  const tests = await apiRequest('/api/tests');
  testFilter.innerHTML +=
    tests.map((t) => `<option value="${t._id}">${t.title}</option>`).join('');

  function buildUrl(base) {
    const params = new URLSearchParams();
    if (subjectFilter.value) params.set('subjectId', subjectFilter.value);
    if (testFilter.value) params.set('chapterId', testFilter.value);
    if (passFilter.value) params.set('passed', passFilter.value);
    if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
    if (fromDate.value) params.set('from', fromDate.value);
    if (toDate.value) params.set('to', toDate.value);
    const q = params.toString();
    return q ? `${base}?${q}` : base;
  }

  async function load() {
    const results = await apiRequest(buildUrl('/api/results/admin'));
    tableBody.innerHTML =
      results.length > 0
        ? results
            .map(
              (r) => `
        <tr class="clickable-row" data-id="${r.id}">
          <td>${r.studentName}</td>
          <td>${r.phone}</td>
          <td>${r.subject}</td>
          <td>${r.chapter}</td>
          <td>${r.obtainedMarks}/${r.totalMarks}</td>
          <td>${r.percentage}%</td>
          <td><span class="badge ${r.passed ? 'badge-active' : 'badge-inactive'}">${r.passed ? 'Pass' : 'Fail'}</span></td>
          <td>${formatDate(r.date)}</td>
        </tr>`
            )
            .join('')
        : '<tr><td colspan="8">No results found</td></tr>';

    tableBody.querySelectorAll('.clickable-row').forEach((row) => {
      row.addEventListener('click', async () => {
        const detail = await apiRequest(`/api/results/admin/${row.dataset.id}`);
        alert(
          `${detail.studentName} — ${detail.chapter}\nScore: ${detail.obtainedMarks}/${detail.totalMarks} (${detail.percentage}%)\n${detail.passed ? 'PASS' : 'FAIL'}`
        );
      });
    });
  }

  [subjectFilter, testFilter, passFilter, fromDate, toDate].forEach((el) => {
    el.addEventListener('change', load);
  });
  searchInput.addEventListener('input', () => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(load, 300);
  });

  exportBtn.addEventListener('click', () => {
    const token = getAdminToken();
    const url = buildUrl('/api/results/admin/export/csv');
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'exam-results.csv';
        a.click();
      });
  });

  load();
})();
