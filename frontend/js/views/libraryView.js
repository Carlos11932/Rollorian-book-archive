import { getBooks, removeBook, updateBook } from '../shared/api.js';
import { createBookRailSection, createLibraryBookCard } from '../shared/bookCard.js';
import { BOOK_STATUSES } from '../shared/constants.js';
import { createElement, escapeHtml, setFeedback } from '../shared/dom.js';
import { statusLabel } from '../shared/formatters.js';

function normalizeStatus(value) {
  return BOOK_STATUSES.includes(value) ? value : 'all';
}

function groupByStatus(items) {
  return BOOK_STATUSES.reduce((groups, status) => {
    groups[status] = items.filter((book) => book.status === status);
    return groups;
  }, {});
}

function libraryRailCopy(status) {
  return {
    wishlist: 'Prospects worth keeping visible until they earn a stronger commitment.',
    to_read: 'Confirmed next reads waiting for their turn.',
    reading: 'Books currently in motion.',
    read: 'Completed titles with notes and history preserved.'
  }[status];
}

async function renderLibraryView(context, route) {
  const activeStatus = normalizeStatus(route.query.status);
  const initialQuery = route.query.q || '';
  const flash = context.consumeFlash();

  const view = createElement(`
    <section class="view-stack library-view">
      <section class="panel stack-gap library-command-panel">
        <div class="panel-header aligned-start">
          <div>
            <p class="eyebrow">Library</p>
            <h1>Your archive, split into rails that match reading intent.</h1>
            <p class="hero-text">Filter by title, lock to a single status, or keep everything visible and scroll each shelf horizontally.</p>
          </div>
          <button class="button button-secondary" type="button" data-refresh>Refresh</button>
        </div>

        <form class="filters-panel">
          <label class="field search-field-wide">
            <span>Filter by title</span>
            <input id="library-query" name="q" type="search" value="${escapeHtml(initialQuery)}" placeholder="Filter saved books by title" />
          </label>
          <div class="actions-row wrap-start">
            <button type="submit" class="button button-primary">Apply filters</button>
            <button type="button" class="button button-secondary" data-clear-filters>Reset</button>
          </div>
        </form>

        <div class="status-tabs" role="tablist" aria-label="Library statuses">
          <button type="button" class="status-tab ${activeStatus === 'all' ? 'is-active' : ''}" data-status-tab="all">All</button>
          ${BOOK_STATUSES.map((status) => `
            <button
              type="button"
              class="status-tab ${status === activeStatus ? 'is-active' : ''}"
              data-status-tab="${status}"
            >${statusLabel(status)}</button>
          `).join('')}
        </div>

        <p class="feedback ${flash?.tone || ''}" aria-live="polite">${flash?.message || ''}</p>
      </section>

      <section class="library-sections" data-library-sections></section>
    </section>
  `);

  const feedback = view.querySelector('.feedback');
  const sectionsHost = view.querySelector('[data-library-sections]');
  const form = view.querySelector('.filters-panel');
  const queryInput = view.querySelector('#library-query');
  const refreshButton = view.querySelector('[data-refresh]');
  const clearFiltersButton = view.querySelector('[data-clear-filters]');

  async function loadBooks(message = flash?.message || '', tone = flash?.tone || '') {
    setFeedback(feedback, message || 'Loading library...');
    sectionsHost.innerHTML = '';

    try {
      const payload = await getBooks({
        q: queryInput.value.trim(),
        status: activeStatus
      });
      const items = payload.items || [];
      const groupedItems = groupByStatus(items);
      const sectionsToRender = activeStatus === 'all'
        ? BOOK_STATUSES.map((status) => ({ status, items: groupedItems[status] }))
        : [{ status: activeStatus, items }];

      if (items.length === 0 && activeStatus === 'all' && !queryInput.value.trim()) {
        sectionsHost.appendChild(
          createElement(`
            <section class="panel stack-gap onboarding-panel">
              <p class="eyebrow">Empty library</p>
              <h2>No saved books yet.</h2>
              <p class="hero-text">Search the external catalog, save a title, and the rails will start filling by status.</p>
              <div class="hero-actions">
                <a class="button button-primary" href="#/search">Go to search</a>
              </div>
            </section>
          `)
        );
      }

      sectionsToRender.forEach(({ status, items: sectionItems }) => {
        sectionsHost.appendChild(
          createBookRailSection({
            eyebrow: statusLabel(status),
            title: `${sectionItems.length} ${sectionItems.length === 1 ? 'book' : 'books'}`,
            copy: activeStatus === 'all'
              ? libraryRailCopy(status)
              : `Filtered to ${statusLabel(status).toLowerCase()} with the current title query applied.`,
            sectionClass: `library-status-section library-status-${status}`,
            items: sectionItems,
            emptyTitle: `No ${statusLabel(status).toLowerCase()} books`,
            emptyCopy: activeStatus === 'all'
              ? 'That shelf is empty right now.'
              : 'Try another filter or save something from Search.',
            renderCard: (book, index) => createLibraryBookCard(book, {
              onSave: async (id, changes) => {
                await updateBook(id, changes);
                await loadBooks(`Updated "${book.title}".`, 'success');
              },
              onDelete: async (id) => {
                await removeBook(id);
                await loadBooks(`Removed "${book.title}" from your library.`, 'success');
              },
              onOpen: (id) => {
                context.navigate(`/books/${id}`);
              }
            }, index)
          })
        );
      });

      if (items.length > 0) {
        setFeedback(feedback, message || `Showing ${items.length} saved book${items.length === 1 ? '' : 's'}.`, tone || 'success');
      } else if (!message) {
        setFeedback(feedback, 'No books match this filter.');
      }
    } catch (error) {
      setFeedback(feedback, error.message, 'error');
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    context.navigate('/library', {
      query: {
        q: queryInput.value.trim(),
        status: activeStatus
      },
      replace: true
    });
  });

  clearFiltersButton.addEventListener('click', () => {
    context.navigate('/library', { replace: true });
  });

  refreshButton.addEventListener('click', () => {
    loadBooks('Library refreshed.', 'success');
  });

  view.querySelectorAll('[data-status-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      context.navigate('/library', {
        query: {
          q: queryInput.value.trim(),
          status: button.dataset.statusTab
        }
      });
    });
  });

  await loadBooks(flash?.message || '', flash?.tone || '');
  return view;
}

export {
  normalizeStatus,
  groupByStatus,
  renderLibraryView
};
