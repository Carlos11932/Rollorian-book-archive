import { createRouter } from './router.js';
import { renderHomeView } from './views/homeView.js';
import { renderSearchView } from './views/searchView.js';
import { renderLibraryView } from './views/libraryView.js';
import { renderBookDetailView } from './views/bookDetailView.js';
import { renderNotFoundView } from './views/notFoundView.js';

const appRoot = document.querySelector('#app');
const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
const shellRoot = document.querySelector('[data-shell]');
const shellKicker = document.querySelector('#shell-route-kicker');
const shellTitle = document.querySelector('#shell-route-title');
const shellCopy = document.querySelector('#shell-route-copy');

const routeShellContent = {
  home: {
    kicker: 'Featured collection',
    title: 'A Netflix-style reading archive, minus the nonsense.',
    copy: 'Scan your saved books as rails, jump between routes through the existing hash navigation, and keep the whole experience feeling deliberate.'
  },
  search: {
    kicker: 'Discovery mode',
    title: 'Search the external catalog without leaving your own app.',
    copy: 'Keep the backend-owned search flow, then drop promising books straight into your local archive from a poster-first results screen.'
  },
  library: {
    kicker: 'Library rails',
    title: 'Browse by reading status instead of drowning in one flat list.',
    copy: 'Wishlist, to-read, reading, and read each get their own shelf so the archive feels sortable at a glance on desktop and mobile.'
  },
  'book-detail': {
    kicker: 'Archive detail',
    title: 'Manage one book without losing the cinematic frame.',
    copy: 'Status updates, notes, and removal still live on the same route model, now with a stronger detail presentation and feedback loop.'
  },
  'not-found': {
    kicker: 'Wrong route',
    title: 'That path is fiction.',
    copy: 'The shell stays intact even when the route does not. Use the navigation to get back to a real screen.'
  }
};

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

function setRouteClass(element, routeName) {
  if (!element) {
    return;
  }

  const routeClasses = Array.from(element.classList).filter((className) => className.startsWith('route-'));
  routeClasses.forEach((className) => element.classList.remove(className));
  element.classList.add(`route-${routeName}`);
  element.dataset.route = routeName;
}

function applyShellState(routeMatch) {
  const shellContent = routeShellContent[routeMatch.name] || routeShellContent['not-found'];

  setActiveNavigation(routeMatch.path);
  setRouteClass(document.body, routeMatch.name);
  setRouteClass(shellRoot, routeMatch.name);
  setRouteClass(appRoot, routeMatch.name);

  if (shellKicker) {
    shellKicker.textContent = shellContent.kicker;
  }

  if (shellTitle) {
    shellTitle.textContent = shellContent.title;
  }

  if (shellCopy) {
    shellCopy.textContent = shellContent.copy;
  }

  document.title = `Rollorian Book Archive - ${shellContent.kicker}`;
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
  applyShellState(routeMatch);
  appRoot.innerHTML = '';

  try {
    const view = await routeMatch.render(appContext, routeMatch);
    appRoot.appendChild(view);
  } catch (error) {
    const fallback = document.createElement('section');
    fallback.className = 'panel empty-route route-error-panel';
    fallback.innerHTML = `
      <p class="eyebrow">Route error</p>
      <h1>Could not load this view.</h1>
      <p>${error.message}</p>
      <div class="hero-actions">
        <a class="button button-primary" href="#/library">Back to library</a>
        <a class="button button-secondary" href="#/">Go home</a>
      </div>
    `;
    appRoot.appendChild(fallback);
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

router.start(render);
