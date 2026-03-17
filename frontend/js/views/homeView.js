import { getBooks } from '../shared/api.js';
import { BOOK_STATUSES } from '../shared/constants.js';
import { createMiniBookList, createStatusSummary } from '../shared/bookCard.js';
import { createElement, createEmptyState, escapeHtml } from '../shared/dom.js';
import { statusLabel } from '../shared/formatters.js';

function getCounts(books) {
  return books.reduce(
    (counts, book) => {
      counts[book.status] = (counts[book.status] || 0) + 1;
      return counts;
    },
    { wishlist: 0, to_read: 0, reading: 0, read: 0 }
  );
}

async function renderHomeView(context) {
  const booksPayload = await getBooks();
  const books = booksPayload.items || [];
  const counts = getCounts(books);
  const recentBooks = books.slice(0, 4);
  const currentlyReading = books.filter((book) => book.status === 'reading').slice(0, 3);

  const section = createElement(`
    <section class="view-stack home-view">
      <section class="hero-panel">
        <div class="hero-copy-block">
          <p class="eyebrow">Front-end evolution</p>
          <h1>From MVP screen to an archive you can actually navigate.</h1>
          <p class="hero-text">
            Search externally, save locally, and move through your personal library with focused views instead of one giant dumping ground.
          </p>
          <div class="hero-actions">
            <a class="button button-primary" href="#/search">Search books</a>
            <a class="button button-secondary" href="#/library">Open library</a>
          </div>
        </div>
        <aside class="hero-aside">
          <p class="eyebrow">Archive pulse</p>
          <strong>${books.length}</strong>
          <span>${books.length === 1 ? 'saved book' : 'saved books'}</span>
          <p>${counts.reading > 0 ? `You're actively reading ${counts.reading} right now.` : 'Nothing marked as reading yet. Fix that.'}</p>
        </aside>
      </section>

      <section class="panel stack-gap">
        <div class="panel-header aligned-start">
          <div>
            <p class="eyebrow">Library overview</p>
            <h2>Status map</h2>
          </div>
          <a class="inline-link" href="#/library">Manage statuses</a>
        </div>
        <div class="summary-grid"></div>
      </section>

      <section class="dashboard-grid">
        <section class="panel stack-gap">
          <div class="panel-header aligned-start">
            <div>
              <p class="eyebrow">Recent activity</p>
              <h2>Last updated books</h2>
            </div>
            <a class="inline-link" href="#/library">See whole library</a>
          </div>
          <div class="recent-books"></div>
        </section>

        <section class="panel stack-gap">
          <div class="panel-header aligned-start">
            <div>
              <p class="eyebrow">Reading lane</p>
              <h2>What is in motion</h2>
            </div>
          </div>
          <div class="reading-focus">
            <div class="reading-focus-list"></div>
          </div>
        </section>
      </section>

      <section class="panel stack-gap">
        <div class="panel-header aligned-start">
          <div>
            <p class="eyebrow">Fast routes</p>
            <h2>Jump straight into work</h2>
          </div>
        </div>
        <div class="route-cards">
          <button class="route-card" type="button" data-go="/search">
            <span class="eyebrow">Search</span>
            <strong>Find a new book</strong>
            <p>Keep the improved Google Books search flow, but give it a proper screen.</p>
          </button>
          <button class="route-card" type="button" data-go="/library" data-status="wishlist">
            <span class="eyebrow">Wishlist</span>
            <strong>${counts.wishlist} waiting</strong>
            <p>${escapeHtml(`Wishlist stays inside Library where it belongs, not floating around like a design accident.`)}</p>
          </button>
          <button class="route-card" type="button" data-go="/library" data-status="${counts.reading > 0 ? 'reading' : 'to_read'}">
            <span class="eyebrow">Next action</span>
            <strong>${counts.reading > 0 ? 'Continue reading' : 'Pick a next book'}</strong>
            <p>${escapeHtml(`Focus the archive by status instead of mixing every state into one flat list.`)}</p>
          </button>
        </div>
      </section>
    </section>
  `);

  section.querySelector('.summary-grid').appendChild(createStatusSummary(counts));
  section.querySelector('.recent-books').appendChild(
    recentBooks.length > 0 ? createMiniBookList(recentBooks) : createEmptyState('No archive yet', 'Save a book from Search and the archive starts to make sense.')
  );

  const readingListHost = section.querySelector('.reading-focus-list');

  if (currentlyReading.length > 0) {
    readingListHost.appendChild(createMiniBookList(currentlyReading));
  } else {
    readingListHost.appendChild(
      createEmptyState('Nothing marked as reading', `Move one of your ${statusLabel('to_read')} books into ${statusLabel('reading')} when you're ready.`)
    );
  }

  section.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => {
      const path = button.dataset.go;
      const status = button.dataset.status;

      context.navigate(path, {
        query: status && BOOK_STATUSES.includes(status) ? { status } : undefined
      });
    });
  });

  return section;
}

export {
  renderHomeView
};
