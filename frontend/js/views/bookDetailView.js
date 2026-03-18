import { getBook, removeBook, updateBook } from '../shared/api.js';
import { BOOK_STATUSES } from '../shared/constants.js';
import { createBookFacts } from '../shared/bookCard.js';
import { createElement, escapeHtml, setFeedback } from '../shared/dom.js';
import { statusLabel } from '../shared/formatters.js';

function createStatusOptions(currentStatus) {
  return BOOK_STATUSES.map(
    (status) => `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${statusLabel(status)}</option>`
  ).join('');
}

async function renderBookDetailView(context, route) {
  const book = await getBook(route.params.id).then((payload) => payload.item);

  const view = createElement(`
    <section class="view-stack detail-view">
      <section class="detail-header panel cinematic-detail-header">
        <a class="inline-link" href="#/library">Back to library</a>
        <div class="detail-hero">
          <div class="detail-cover-wrap ${book.coverUrl ? 'has-image' : ''}">
            ${book.coverUrl ? `<img class="detail-cover" src="${escapeHtml(book.coverUrl)}" alt="${escapeHtml(book.title)} cover" />` : '<div class="cover-fallback">No cover</div>'}
          </div>
          <div class="detail-copy">
            <p class="eyebrow">Book detail</p>
            <h1>${escapeHtml(book.title)}</h1>
            <div class="detail-status-row">
              <span class="status-pill">${escapeHtml(statusLabel(book.status))}</span>
              <span class="detail-meta-chip">${escapeHtml(book.externalSource)}</span>
            </div>
            <p class="detail-subcopy">Keep status, notes, and metadata in one focused screen without breaking the existing local-library flow.</p>
            <div class="detail-facts-host"></div>
          </div>
        </div>
      </section>

      <section class="dashboard-grid detail-grid">
        <section class="panel stack-gap detail-manage-panel">
          <div class="panel-header aligned-start">
            <div>
              <p class="eyebrow">Manage</p>
              <h2>Update reading state</h2>
            </div>
          </div>

          <form class="detail-form stack-gap">
            <label class="field">
              <span>Status</span>
              <select name="status">${createStatusOptions(book.status)}</select>
            </label>
            <label class="field">
              <span>Notes</span>
              <textarea name="notes" class="book-notes" placeholder="Write something useful about this book.">${escapeHtml(book.notes || '')}</textarea>
            </label>
            <div class="book-actions">
              <button type="submit" class="button button-primary">Save changes</button>
              <button type="button" class="button button-danger" data-remove>Remove book</button>
            </div>
            <p class="feedback" aria-live="polite"></p>
          </form>
        </section>

        <section class="panel stack-gap detail-metadata-panel">
          <div class="panel-header aligned-start">
            <div>
              <p class="eyebrow">Metadata</p>
              <h2>Archive record</h2>
            </div>
          </div>
          <dl class="detail-facts muted-facts">
            <div>
              <dt>External source</dt>
              <dd>${escapeHtml(book.externalSource)}</dd>
            </div>
            <div>
              <dt>External id</dt>
              <dd>${escapeHtml(book.externalId)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>${escapeHtml(new Date(book.createdAt).toLocaleString())}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>${escapeHtml(new Date(book.updatedAt).toLocaleString())}</dd>
            </div>
          </dl>
        </section>
      </section>
    </section>
  `);

  view.querySelector('.detail-facts-host').appendChild(createBookFacts(book));

  const form = view.querySelector('.detail-form');
  const removeButton = view.querySelector('[data-remove]');
  const feedback = view.querySelector('.feedback');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const submitButton = form.querySelector('[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    try {
      const payload = await updateBook(book.id, {
        status: formData.get('status'),
        notes: formData.get('notes')
      });

      setFeedback(feedback, `Updated "${payload.item.title}".`, 'success');
      context.rerender();
    } catch (error) {
      setFeedback(feedback, error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save changes';
    }
  });

  removeButton.addEventListener('click', async () => {
    removeButton.disabled = true;
    removeButton.textContent = 'Removing...';

    try {
      await removeBook(book.id);
      context.setFlash(`Removed "${book.title}" from your library.`, 'success');
      context.navigate('/library');
    } catch (error) {
      setFeedback(feedback, error.message, 'error');
      removeButton.disabled = false;
      removeButton.textContent = 'Remove book';
    }
  });

  return view;
}

export {
  renderBookDetailView
};
