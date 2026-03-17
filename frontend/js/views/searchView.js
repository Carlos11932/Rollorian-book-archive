import { saveBook, searchBooks } from '../shared/api.js';
import { createSearchResultCard } from '../shared/bookCard.js';
import { createElement, escapeHtml, setFeedback } from '../shared/dom.js';

async function renderSearchView(context, route) {
  const initialQuery = route.query.q || '';
  const view = createElement(`
    <section class="view-stack search-view">
      <section class="panel search-panel stack-gap">
        <div class="panel-header aligned-start">
          <div>
            <p class="eyebrow">Search</p>
            <h1>Search the external catalog without leaving your own app.</h1>
          </div>
          <div class="hero-chip">Backend-only Google Books</div>
        </div>

        <form class="search-form stack-gap">
          <label class="field">
            <span>Title, author, or ISBN</span>
            <input id="search-input" name="query" type="search" placeholder="Try Dune, Le Guin, or 9780261103573" value="${escapeHtml(initialQuery)}" required />
          </label>
          <div class="actions-row wrap-start">
            <button type="submit" class="button button-primary">Search</button>
            <button type="button" class="button button-secondary" data-clear>Clear</button>
            <p class="feedback" aria-live="polite"></p>
          </div>
        </form>
      </section>

      <section class="panel stack-gap">
        <div class="panel-header aligned-start">
          <div>
            <p class="eyebrow">Results</p>
            <h2>Candidate books</h2>
          </div>
        </div>
        <div class="card-grid" data-results></div>
      </section>
    </section>
  `);

  const form = view.querySelector('.search-form');
  const input = view.querySelector('#search-input');
  const feedback = view.querySelector('.feedback');
  const results = view.querySelector('[data-results]');
  const clearButton = view.querySelector('[data-clear]');

  async function performSearch(query) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      results.innerHTML = '';
      setFeedback(feedback, 'Type something useful first.');
      return;
    }

    setFeedback(feedback, 'Searching...');
    results.innerHTML = '';

    try {
      const payload = await searchBooks(trimmedQuery);
      const items = payload.items || [];

      if (items.length === 0) {
        setFeedback(feedback, 'No matching books found.');
        return;
      }

      items.forEach((book) => {
        const card = createSearchResultCard(book, async (selectedBook) => {
          try {
            await saveBook(selectedBook);
            setFeedback(feedback, `Saved "${selectedBook.title}" to your library.`, 'success');
          } catch (error) {
            setFeedback(feedback, error.message, 'error');
            throw error;
          }
        });

        results.appendChild(card);
      });

      setFeedback(feedback, `Found ${items.length} result${items.length === 1 ? '' : 's'}.`, 'success');
    } catch (error) {
      setFeedback(feedback, error.message, 'error');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    context.navigate('/search', {
      query: { q: query },
      replace: true
    });
    await performSearch(query);
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    results.innerHTML = '';
    setFeedback(feedback, 'Search cleared.');
    context.navigate('/search', { replace: true });
  });

  if (initialQuery) {
    await performSearch(initialQuery);
  }

  return view;
}

export {
  renderSearchView
};
