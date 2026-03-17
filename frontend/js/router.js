function normalizeHash(rawHash) {
  const value = rawHash.replace(/^#/, '');

  if (!value) {
    return '/';
  }

  return value.startsWith('/') ? value : `/${value}`;
}

function parseLocation() {
  const normalized = normalizeHash(window.location.hash);
  const [path, queryString = ''] = normalized.split('?');

  return {
    path,
    query: Object.fromEntries(new URLSearchParams(queryString).entries()),
    fullPath: normalized
  };
}

function buildHash(path, query = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== '' && value !== 'all') {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return `#${normalizedPath}${queryString ? `?${queryString}` : ''}`;
}

function createRouter(routes, notFoundRenderer) {
  let onRender = null;

  function matchRoute() {
    const locationState = parseLocation();

    for (const route of routes) {
      const params = route.match(locationState.path);

      if (params) {
        return {
          ...locationState,
          name: route.name,
          params,
          render: route.render
        };
      }
    }

    return {
      ...locationState,
      name: 'not-found',
      params: {},
      render: notFoundRenderer
    };
  }

  function renderCurrent() {
    if (!onRender) {
      return;
    }

    return onRender(matchRoute());
  }

  function navigate(path, options = {}) {
    const targetHash = buildHash(path, options.query);

    if (options.replace) {
      window.location.replace(targetHash);
      return;
    }

    if (window.location.hash === targetHash) {
      renderCurrent();
      return;
    }

    window.location.hash = targetHash;
  }

  function start(renderCallback) {
    onRender = renderCallback;
    window.addEventListener('hashchange', renderCurrent);

    if (!window.location.hash) {
      navigate('/', { replace: true });
      return;
    }

    renderCurrent();
  }

  return {
    start,
    navigate,
    renderCurrent,
    getCurrentRoute: matchRoute
  };
}

export {
  normalizeHash,
  buildHash,
  createRouter
};
