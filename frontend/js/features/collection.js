import { getBooks, removeBook, updateBook } from '../shared/api.js';
import { formatAuthors, formatYear, formatIsbn, statusLabel } from '../shared/formatters.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setFeedback(element, message, tone = '') {
  element.textContent = message;
  element.className = `feedback ${tone}`.trim();
}

function createStatusOptions(currentStatus) {
  const statuses = ['wishlist', 'to_read', 'reading', 'read'];

  return statuses
    .map(
      (status) => `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${statusLabel(status)}</option>`
    )
    .join('');
}

function createCollectionCard(template, book, handlers) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector('.book-card');
  const cover = fragment.querySelector('.book-cover');
  const fallback = fragment.querySelector('.cover-fallback');
  const content = fragment.querySelector('.book-content');

  if (book.coverUrl) {
    cover.src = book.coverUrl;
    cover.alt = `${book.title} cover`;
    cover.classList.add('has-image');
    fallback.hidden = true;
  }

  content.innerHTML = `
    <h3 class="book-title">${escapeHtml(book.title)}</h3>
    <p class="book-meta">${escapeHtml(formatAuthors(book.authors))}</p>
    <div class="book-inline-meta">
      <span>${escapeHtml(formatYear(book.publishedYear))}</span>
      <span>${escapeHtml(formatIsbn(book.isbn))}</span>
    </div>
    <div class="status-row">
      <label class="field status-select">
        <span>Status</span>
        <select>${createStatusOptions(book.status)}</select>
      </label>
    </div>
    <label class="field">
      <span>Notes</span>
      <textarea class="book-notes" placeholder="Add personal notes">${escapeHtml(book.notes || '')}</textarea>
    </label>
    <div class="book-actions">
      <button type="button" class="button button-primary save-button">Save changes</button>
      <button type="button" class="button button-danger delete-button">Remove</button>
    </div>
  `;

  const statusSelect = content.querySelector('select');
  const notesInput = content.querySelector('.book-notes');
  const saveButton = content.querySelector('.save-button');
  const deleteButton = content.querySelector('.delete-button');

  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
      await handlers.onSave(book.id, {
        status: statusSelect.value,
        notes: notesInput.value
      });
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = 'Save changes';
    }
  });

  deleteButton.addEventListener('click', async () => {
    deleteButton.disabled = true;
    deleteButton.textContent = 'Removing...';

    try {
      await handlers.onDelete(book.id);
    } finally {
      deleteButton.disabled = false;
      deleteButton.textContent = 'Remove';
    }
  });

  return card;
}

function mountCollectionFeature(elements) {
  const { queryInput, statusInput, refreshButton, feedback, results, template } = elements;

  async function loadBooks(message = '') {
    setFeedback(feedback, message || 'Loading collection...');

    try {
      const payload = await getBooks({
        q: queryInput.value.trim(),
        status: statusInput.value
      });

      const items = payload.items || [];
      results.innerHTML = '';

      items.forEach((book) => {
        const card = createCollectionCard(template, book, {
          onSave: async (id, changes) => {
            await updateBook(id, changes);
            await loadBooks(`Updated "${book.title}".`, 'success');
          },
          onDelete: async (id) => {
            await removeBook(id);
            await loadBooks(`Removed "${book.title}" from your collection.`, 'success');
          }
        });

        results.appendChild(card);
      });

      setFeedback(
        feedback,
        items.length === 0 ? 'Your collection is empty for this filter.' : `Showing ${items.length} saved book${items.length === 1 ? '' : 's'}.`,
        items.length === 0 ? '' : 'success'
      );
    } catch (error) {
      setFeedback(feedback, error.message, 'error');
    }
  }

  queryInput.addEventListener('input', () => {
    loadBooks();
  });

  statusInput.addEventListener('change', () => {
    loadBooks();
  });

  refreshButton.addEventListener('click', () => {
    loadBooks();
  });

  return {
    loadBooks
  };
}

export {
  mountCollectionFeature
};
