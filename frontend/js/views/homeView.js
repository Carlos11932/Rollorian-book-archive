import { getBooks } from '../shared/api.js';
import { BOOK_STATUSES } from '../shared/constants.js';
import { createBookRailSection, createBrowseBookCard, createStatusSummary } from '../shared/bookCard.js';
import { createElement, escapeHtml } from '../shared/dom.js';
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

function formatAuthorsLabel(book) {
  return Array.isArray(book.authors) && book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author';
}

function formatFeaturedCopy(book) {
  return `${formatAuthorsLabel(book)} - ${statusLabel(book.status)} shelf`;
}

function railCopy(status) {
  return {
    wishlist: 'Future pickups and impulse saves that still need a commitment.',
    to_read: 'The shortlist that deserves a real slot in the queue.',
    reading: 'Active reads with momentum right now.',
    read: 'Finished books worth revisiting or recommending.'
  }[status];
}

function emptyRailCopy(status) {
  return {
    wishlist: 'Use Search to start building a serious wishlist.',
    to_read: 'Promote something from Wishlist when it deserves attention.',
    reading: `Move one of your ${statusLabel('to_read')} books into ${statusLabel('reading')} when you start it.`,
    read: 'Finished books land here once you close the loop.'
  }[status];
}

async function renderHomeView(context) {
  const booksPayload = await getBooks();
  const books = booksPayload.items || [];
  const counts = getCounts(books);
  const featuredBook = books[0] || null;
  const booksByStatus = BOOK_STATUSES.reduce((groups, status) => {
    groups[status] = books.filter((book) => book.status === status);
    return groups;
  }, {});

  const heroBackdropStyle = featuredBook && featuredBook.coverUrl
    ? `background-image: url('${escapeHtml(featuredBook.coverUrl)}')`
    : '';

  const section = createElement(`
    <section class="view-stack home-view">
      <section class="hero-panel">
        <div class="hero-backdrop" ${heroBackdropStyle ? `style="${heroBackdropStyle}"` : ''} aria-hidden="true"></div>
        <div class="hero-copy-block">
          <p class="eyebrow">Tonight in your archive</p>
          <h1>Browse your reading life like a curated catalog, not a spreadsheet accident.</h1>
          <p class="hero-text">
            Search externally, save locally, and move between status rails that keep wishlist, reading momentum, and finished books visually distinct.
          </p>
          <div class="hero-actions">
            <a class="button button-primary" href="#/search">Search books</a>
            <a class="button button-secondary" href="#/library">Open library</a>
          </div>
        </div>
        <aside class="hero-aside">
          <p class="eyebrow">Featured title</p>
          <strong>${featuredBook ? escapeHtml(featuredBook.title) : 'Start the archive'}</strong>
          <span>${featuredBook ? escapeHtml(statusLabel(featuredBook.status)) : 'No saved books yet'}</span>
          <p>${featuredBook ? escapeHtml(formatFeaturedCopy(featuredBook)) : 'Save a first book from Search and the home screen starts acting like a real catalog.'}</p>
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

      <section class="home-rail-stack" data-home-rails></section>

      <section class="dashboard-grid home-dashboard-grid">
        <section class="panel stack-gap spotlight-panel">
          <div class="panel-header aligned-start">
            <div>
              <p class="eyebrow">Collection pulse</p>
              <h2>Why the rails matter</h2>
            </div>
          </div>
          <p class="hero-text">Each status becomes a separate shelf, so browsing the archive feels like browsing intent: what you want, what you owe yourself next, what is active, and what you finished.</p>
        </section>

        <section class="panel stack-gap route-workbench">
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
              <p>Keep the backend-owned search flow, but give discovery a proper screen.</p>
            </button>
            <button class="route-card" type="button" data-go="/library" data-status="wishlist">
              <span class="eyebrow">Wishlist</span>
              <strong>${counts.wishlist} waiting</strong>
              <p>${escapeHtml('Open the queue you have not committed to yet, without mixing it into active reading.')}</p>
            </button>
            <button class="route-card" type="button" data-go="/library" data-status="${counts.reading > 0 ? 'reading' : 'to_read'}">
              <span class="eyebrow">Next action</span>
              <strong>${counts.reading > 0 ? 'Continue reading' : 'Pick the next book'}</strong>
              <p>${escapeHtml('Use status-filtered navigation to jump directly into the shelf that needs attention.')}</p>
            </button>
          </div>
        </section>
      </section>
    </section>
  `);

  section.querySelector('.summary-grid').appendChild(createStatusSummary(counts));

  const railsHost = section.querySelector('[data-home-rails]');

  if (books.length === 0) {
    railsHost.appendChild(
      createElement(`
        <section class="panel stack-gap onboarding-panel">
          <p class="eyebrow">Empty archive</p>
          <h2>Your rails show up after the first save.</h2>
          <p class="hero-text">Search for a title, save it locally, and the status-based shelves start building themselves.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#/search">Go to search</a>
          </div>
        </section>
      `)
    );
  } else {
    BOOK_STATUSES.forEach((status) => {
      railsHost.appendChild(
        createBookRailSection({
          eyebrow: `${statusLabel(status)} shelf`,
          title: statusLabel(status),
          copy: railCopy(status),
          actionMarkup: `<a class="inline-link" href="#/library?status=${status}">Open in library</a>`,
          sectionClass: `home-rail home-rail-${status}`,
          items: booksByStatus[status],
          emptyTitle: `No ${statusLabel(status).toLowerCase()} books`,
          emptyCopy: emptyRailCopy(status),
          renderCard: (book, index) => createBrowseBookCard(book, {
            badge: statusLabel(book.status),
            tone: status === 'reading' ? 'warm' : 'cool',
            index,
            onOpen: (id) => context.navigate(`/books/${id}`)
          })
        })
      );
    });
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
  getCounts,
  renderHomeView
};
