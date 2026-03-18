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

function createSectionHeading({ eyebrow = '', title, copy = '', actionMarkup = '' }) {
  return `
    <div class="section-heading">
      <div class="section-heading-copy">
        ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        <h2>${escapeHtml(title)}</h2>
        ${copy ? `<p>${escapeHtml(copy)}</p>` : ''}
      </div>
      ${actionMarkup ? `<div class="section-heading-actions">${actionMarkup}</div>` : ''}
    </div>
  `;
}

function createRailSection({ eyebrow = '', title, copy = '', actionMarkup = '', sectionClass = '', trackClass = 'rail-track' }) {
  return createElement(`
    <section class="rail-section ${escapeHtml(sectionClass).trim()}">
      ${createSectionHeading({ eyebrow, title, copy, actionMarkup })}
      <div class="${escapeHtml(trackClass)}" data-rail-track></div>
    </section>
  `);
}

export {
  escapeHtml,
  createElement,
  createFragment,
  createEmptyState,
  createRailSection,
  createSectionHeading,
  setFeedback
};
