async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Request failed');
  }

  return payload;
}

function searchBooks(query) {
  return request(`/api/search/books?q=${encodeURIComponent(query)}`);
}

function getBooks(filters = {}) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set('q', filters.q);
  }

  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }

  const query = params.toString();
  return request(`/api/books${query ? `?${query}` : ''}`);
}

function saveBook(book) {
  return request('/api/books', {
    method: 'POST',
    body: JSON.stringify(book)
  });
}

function updateBook(id, changes) {
  return request(`/api/books/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes)
  });
}

function removeBook(id) {
  return request(`/api/books/${id}`, {
    method: 'DELETE'
  });
}

export {
  searchBooks,
  getBooks,
  saveBook,
  updateBook,
  removeBook
};
