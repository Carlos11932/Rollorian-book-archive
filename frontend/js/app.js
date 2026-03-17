import { createRouter } from './router.js';
import { renderHomeView } from './views/homeView.js';
import { renderSearchView } from './views/searchView.js';
import { renderLibraryView } from './views/libraryView.js';
import { renderBookDetailView } from './views/bookDetailView.js';
import { renderNotFoundView } from './views/notFoundView.js';

const appRoot = document.querySelector('#app');
const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));

const flashState = {
  current: null
};

const routes = [
  {
    name: 'home',
    match: (path) => (path === '/' ? {} : null),
    render: renderHomeView
  },
  {
    name: 'search',
    match: (path) => (path === '/search' ? {} : null),
    render: renderSearchView
  },
  {
    name: 'library',
    match: (path) => (path === '/library' ? {} : null),
    render: renderLibraryView
  },
  {
    name: 'book-detail',
    match: (path) => {
      const matched = path.match(/^\/books\/(\d+)$/);
      return matched ? { id: matched[1] } : null;
    },
    render: renderBookDetailView
  }
];

function setActiveNavigation(path) {
  const activePath = path.startsWith('/books/') ? '/library' : path;

  navLinks.forEach((link) => {
    const isActive = link.dataset.navLink === activePath;
    link.classList.toggle('is-active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function setFlash(message, tone = 'success') {
  flashState.current = { message, tone };
}

function consumeFlash() {
  const value = flashState.current;
  flashState.current = null;
  return value;
}

const router = createRouter(routes, renderNotFoundView);

const appContext = {
  navigate: router.navigate,
  setFlash,
  consumeFlash,
  rerender: () => router.renderCurrent(),
  getCurrentRoute: () => router.getCurrentRoute()
};

async function render(routeMatch) {
  setActiveNavigation(routeMatch.path);
  appRoot.innerHTML = '';

  try {
    const view = await routeMatch.render(appContext, routeMatch);
    appRoot.appendChild(view);
  } catch (error) {
    const fallback = document.createElement('section');
    fallback.className = 'panel empty-route';
    fallback.innerHTML = `
      <p class="eyebrow">Route error</p>
      <h1>Could not load this view.</h1>
      <p>${error.message}</p>
      <a class="button button-primary" href="#/library">Back to library</a>
    `;
    appRoot.appendChild(fallback);
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

router.start(render);
