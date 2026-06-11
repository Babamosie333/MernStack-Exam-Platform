(async function () {
  await requireAuth();
  const tableBody = document.getElementById('tableBody');
  const modal = document.getElementById('modal');
  const alertEl = document.getElementById('alert');

  async function load() {
    const subjects = await apiRequest('/api/subjects');

    tableBody.innerHTML =
      subjects.length > 0
        ? subjects
            .map(
              (s) => `
      <tr>
        <td>${s.name}</td>
        <td>${s.description || '-'}</td>
        <td>
          <button type="button" class="status-toggle ${s.isActive ? 'is-active' : 'is-inactive'}" data-toggle="${s._id}">
            <span class="badge ${s.isActive ? 'badge-active' : 'badge-inactive'}">
              ${s.isActive ? 'Active' : 'Inactive'}
            </span>
          </button>
        </td>
        <td class="table-actions">
          <button class="btn btn-secondary btn-sm" data-edit="${s._id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete="${s._id}">Delete</button>
        </td>
      </tr>`
            )
            .join('')
        : '<tr><td colspan="4">No subjects yet</td></tr>';

    tableBody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => openEdit(btn.dataset.edit, subjects));
    });

    tableBody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => deleteSubject(btn.dataset.delete));
    });

    tableBody.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => toggleStatus(btn.dataset.toggle, subjects));
    });
  }

  function openAdd() {
    document.getElementById('modalTitle').textContent = 'Add Subject';
    document.getElementById('subjectId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('description').value = '';
    document.getElementById('icon').value = '📚';
    document.getElementById('color').value = '#4f46e5';
    document.getElementById('isActive').checked = true;
    modal.classList.remove('hidden');
  }

  function openEdit(id, subjects) {
    const s = subjects.find((x) => x._id === id);
    if (!s) return;

    document.getElementById('modalTitle').textContent = 'Edit Subject';
    document.getElementById('subjectId').value = s._id;
    document.getElementById('name').value = s.name || '';
    document.getElementById('description').value = s.description || '';
    document.getElementById('icon').value = s.icon || '📚';
    document.getElementById('color').value = s.color || '#4f46e5';
    document.getElementById('isActive').checked = Boolean(s.isActive);
    modal.classList.remove('hidden');
  }

  async function toggleStatus(id, subjects) {
    const s = subjects.find((x) => x._id === id);
    if (!s) return;

    try {
      await apiRequest(`/api/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: s.name,
          description: s.description || '',
          icon: s.icon || '📚',
          color: s.color || '#4f46e5',
          isActive: !Boolean(s.isActive),
        }),
      });
      showAlert(alertEl, 'Subject status updated', 'success');
      load();
    } catch (err) {
      showAlert(alertEl, err.message);
    }
  }

  async function deleteSubject(id) {
    if (!confirm('Delete this subject and related tests/questions?')) return;
    try {
      await apiRequest(`/api/subjects/${id}`, { method: 'DELETE' });
      showAlert(alertEl, 'Subject deleted', 'success');
      load();
    } catch (err) {
      showAlert(alertEl, err.message);
    }
  }

  document.getElementById('addBtn').addEventListener('click', openAdd);
  document.getElementById('cancelBtn').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('cancelBtnBottom').addEventListener('click', () => modal.classList.add('hidden'));

  document.getElementById('subjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('subjectId').value;
    const body = {
      name: document.getElementById('name').value.trim(),
      description: document.getElementById('description').value.trim(),
      icon: document.getElementById('icon').value.trim(),
      color: document.getElementById('color').value,
      isActive: document.getElementById('isActive').checked,
    };

    try {
      if (id) {
        await apiRequest(`/api/subjects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiRequest('/api/subjects', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      modal.classList.add('hidden');
      showAlert(alertEl, 'Subject saved', 'success');
      load();
    } catch (err) {
      showAlert(alertEl, err.message);
    }
  });

  load();
})();