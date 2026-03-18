import { formatAuthors, formatIsbn, formatYear, statusLabel } from './formatters.js';
import { BOOK_STATUSES } from './constants.js';
import { createElement, createEmptyState, createFragment, createRailSection, escapeHtml } from './dom.js';

function createCoverMarkup(book, tone = 'warm') {
  const imageMarkup = book.coverUrl
    ? `<img class="book-cover has-image" src="${escapeHtml(book.coverUrl)}" alt="${escapeHtml(book.title)} cover" />`
    : '';

  return `
    <div class="book-cover-wrap ${tone}">
      ${imageMarkup}
      <div class="cover-fallback" ${book.coverUrl ? 'hidden' : ''}>No cover</div>
    </div>
  `;
}

function createCardOverlay(book) {
  return `
    <div class="card-overlay" aria-hidden="true">
      <p class="overlay-title">${escapeHtml(book.title)}</p>
      <p class="overlay-author">${escapeHtml(formatAuthors(book.authors))}</p>
      <a class="button button-primary overlay-detail-btn" href="#/books/${book.id}">Ver detalles</a>
    </div>
  `;
}

function createPosterMeta(book) {
  return `
    <div class="book-inline-meta poster-meta">
      <span>${escapeHtml(formatYear(book.publishedYear))}</span>
      <span>${escapeHtml(formatIsbn(book.isbn))}</span>
    </div>
  `;
}

function createBrowseBookCard(book, options = {}) {
  const badge = options.badge || statusLabel(book.status);
  const actionLabel = options.actionLabel || 'Open details';
  const index = options.index ?? 0;

  const card = createElement(`
    <article class="book-card poster-card browse-card" style="--i: ${index}">
      ${createCoverMarkup(book, options.tone || 'cool')}
      <div class="book-content">
        <div class="book-heading-block">
          <div class="book-card-topline">
            <span class="status-pill subtle">${escapeHtml(badge)}</span>
          </div>
          <h3 class="book-title">${escapeHtml(book.title)}</h3>
          <p class="book-meta">${escapeHtml(formatAuthors(book.authors))}</p>
        </div>
        ${createPosterMeta(book)}
        <div class="book-actions compact-actions">
          <a class="button button-secondary" href="#/books/${book.id}">${escapeHtml(actionLabel)}</a>
        </div>
      </div>
      ${createCardOverlay(book)}
    </article>
  `);

  if (typeof options.onOpen === 'function') {
    card.querySelector('.book-actions a').addEventListener('click', (event) => {
      event.preventDefault();
      options.onOpen(book.id);
    });
    const overlayBtn = card.querySelector('.overlay-detail-btn');
    if (overlayBtn) {
      overlayBtn.addEventListener('click', (event) => {
        event.preventDefault();
        options.onOpen(book.id);
      });
    }
  }

  return card;
}

function createSearchResultCard(book, onSave, index = 0) {
  const card = createElement(`
    <article class="book-card poster-card search-card" style="--i: ${index}">
      ${createCoverMarkup(book, 'cool')}
      <div class="book-content">
        <div class="book-heading-block">
          <div class="book-card-topline">
            <span class="status-pill subtle">Search result</span>
          </div>
          <h3 class="book-title">${escapeHtml(book.title)}</h3>
          <p class="book-meta">${escapeHtml(formatAuthors(book.authors))}</p>
        </div>
        ${createPosterMeta(book)}
        <div class="book-actions">
          <button type="button" class="button button-primary">Save to library</button>
        </div>
      </div>
      ${createCardOverlay(book)}
    </article>
  `);

  const saveButton = card.querySelector('button');

  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
      await onSave(book);
      saveButton.textContent = 'Saved';
    } catch (error) {
      saveButton.disabled = false;
      saveButton.textContent = 'Save to library';
    }
  });

  return card;
}

function createStatusOptions(currentStatus) {
  return BOOK_STATUSES.map(
    (status) => `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${statusLabel(status)}</option>`
  ).join('');
}

function createLibraryBookCard(book, handlers, index = 0) {
  const card = createElement(`
    <article class="book-card poster-card library-card" style="--i: ${index}">
      ${createCoverMarkup(book)}
      <div class="book-content">
        <div class="book-heading-row">
          <div class="book-heading-block">
            <div class="book-card-topline">
              <span class="status-pill subtle">${escapeHtml(statusLabel(book.status))}</span>
            </div>
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-meta">${escapeHtml(formatAuthors(book.authors))}</p>
          </div>
          <a class="inline-link" href="#/books/${book.id}">Details</a>
        </div>
        ${createPosterMeta(book)}
        <div class="library-card-controls">
          <label class="field status-select">
            <span>Status</span>
            <select>${createStatusOptions(book.status)}</select>
          </label>
          <label class="field notes-field">
            <span>Notes</span>
            <textarea class="book-notes" placeholder="Capture a useful thought, not lorem ipsum.">${escapeHtml(book.notes || '')}</textarea>
          </label>
        </div>
        <div class="book-actions">
          <button type="button" class="button button-primary save-button">Save changes</button>
          <button type="button" class="button button-secondary open-button">Open detail</button>
          <button type="button" class="button button-danger delete-button">Remove</button>
        </div>
      </div>
    </article>
  `);

  const statusSelect = card.querySelector('select');
  const notesInput = card.querySelector('.book-notes');
  const saveButton = card.querySelector('.save-button');
  const openButton = card.querySelector('.open-button');
  const deleteButton = card.querySelector('.delete-button');

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

  openButton.addEventListener('click', () => {
    handlers.onOpen(book.id);
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

function createStatusSummary(itemsByStatus) {
  const fragment = document.createDocumentFragment();

  BOOK_STATUSES.forEach((status) => {
    const count = itemsByStatus[status] || 0;
    fragment.appendChild(
      createElement(`
        <article class="summary-card stat-card">
          <p class="eyebrow">${escapeHtml(statusLabel(status))}</p>
          <strong>${count}</strong>
          <span>${count === 1 ? 'book' : 'books'}</span>
        </article>
      `)
    );
  });

  return fragment;
}

function createMiniBookList(items) {
  if (items.length === 0) {
    return createElement('<div class="mini-list-empty">No saved books yet.</div>');
  }

  const list = createElement('<div class="mini-book-list"></div>');

  items.forEach((book) => {
    list.appendChild(
      createElement(`
        <a class="mini-book-card" href="#/books/${book.id}">
          ${createCoverMarkup(book, 'cool')}
          <div>
            <h3>${escapeHtml(book.title)}</h3>
            <p>${escapeHtml(formatAuthors(book.authors))}</p>
            <span>${escapeHtml(statusLabel(book.status))}</span>
          </div>
        </a>
      `)
    );
  });

  return list;
}

function createBookFacts(book) {
  return createFragment(`
    <dl class="detail-facts">
      <div>
        <dt>Authors</dt>
        <dd>${escapeHtml(formatAuthors(book.authors))}</dd>
      </div>
      <div>
        <dt>Published</dt>
        <dd>${escapeHtml(formatYear(book.publishedYear))}</dd>
      </div>
      <div>
        <dt>ISBN</dt>
        <dd>${escapeHtml(formatIsbn(book.isbn))}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>${escapeHtml(statusLabel(book.status))}</dd>
      </div>
    </dl>
  `);
}

function createBookRailSection(config) {
  const rail = createRailSection({
    eyebrow: config.eyebrow,
    title: config.title,
    copy: config.copy,
    actionMarkup: config.actionMarkup,
    sectionClass: config.sectionClass,
    trackClass: config.trackClass || 'rail-track'
  });
  const track = rail.querySelector('[data-rail-track]');

  if (!config.items || config.items.length === 0) {
    track.appendChild(createEmptyState(config.emptyTitle, config.emptyCopy));
    track.classList.add('is-empty');
    return rail;
  }

  config.items.forEach((item, index) => {
    track.appendChild(config.renderCard(item, index));
  });

  // Add overflow detection for fade edges
  requestAnimationFrame(() => {
    if (track.scrollWidth > track.clientWidth) {
      rail.classList.add('has-overflow');
    }
  });

  return rail;
}

export {
  createBookFacts,
  createBookRailSection,
  createBrowseBookCard,
  createLibraryBookCard,
  createMiniBookList,
  createSearchResultCard,
  createStatusSummary
};
