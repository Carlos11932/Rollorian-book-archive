function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createElement(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

function createFragment(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content;
}

function setFeedback(element, message, tone = '') {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `feedback ${tone}`.trim();
}

function createEmptyState(title, copy) {
  return createElement(`
    <article class="empty-state">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(copy)}</p>
    </article>
  `);
}

export {
  escapeHtml,
  createElement,
  createFragment,
  createEmptyState,
  setFeedback
};
