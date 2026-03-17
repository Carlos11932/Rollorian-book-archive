function formatAuthors(authors) {
  return Array.isArray(authors) && authors.length > 0 ? authors.join(', ') : 'Unknown author';
}

function formatYear(year) {
  return year || 'Year unknown';
}

function formatIsbn(isbn) {
  return isbn || 'ISBN unavailable';
}

function statusLabel(status) {
  return {
    wishlist: 'Wishlist',
    to_read: 'To read',
    reading: 'Reading',
    read: 'Read'
  }[status] || status;
}

export {
  formatAuthors,
  formatYear,
  formatIsbn,
  statusLabel
};
