import { searchBooks, saveBook } from '../shared/api.js';
import { formatAuthors, formatYear, formatIsbn } from '../shared/formatters.js';

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

function createSearchCard(template, book, onSave) {
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
    <div class="book-actions">
      <button type="button" class="button button-primary">Save to collection</button>
    </div>
  `;

  const saveButton = content.querySelector('button');
  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
      await onSave(book);
      saveButton.textContent = 'Saved';
    } catch (error) {
      saveButton.disabled = false;
      saveButton.textContent = 'Save to collection';
      window.dispatchEvent(
        new CustomEvent('rollorian:search-save-error', {
          detail: error.message
        })
      );
    }
  });

  return card;
}

function mountSearchFeature(elements, callbacks) {
  const { form, input, feedback, results, template } = elements;

  window.addEventListener('rollorian:search-save-error', (event) => {
    setFeedback(feedback, event.detail, 'error');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();

    setFeedback(feedback, 'Searching...');
    results.innerHTML = '';

    try {
      const payload = await searchBooks(query);
      const items = payload.items || [];

      if (items.length === 0) {
        setFeedback(feedback, 'No matching books found.');
        return;
      }

      items.forEach((book) => {
        const card = createSearchCard(template, book, async (selectedBook) => {
          const savedPayload = await saveBook(selectedBook);
          callbacks.onBookSaved(savedPayload.item);
          setFeedback(feedback, `Saved "${selectedBook.title}" to your collection.`, 'success');
        });

        results.appendChild(card);
      });

      setFeedback(feedback, `Found ${items.length} result${items.length === 1 ? '' : 's'}.`, 'success');
    } catch (error) {
      setFeedback(feedback, error.message, 'error');
    }
  });
}

export {
  mountSearchFeature
};
