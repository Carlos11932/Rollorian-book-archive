import { createElement } from '../shared/dom.js';

function renderNotFoundView() {
  return createElement(`
    <section class="panel empty-route cinematic-empty-route">
      <p class="eyebrow">Wrong turn</p>
      <h1>That route does not exist.</h1>
      <p>The shell is still here, but the screen you asked for is fiction. Use a real route and keep moving.</p>
      <div class="hero-actions">
        <a class="button button-primary" href="#/">Back home</a>
        <a class="button button-secondary" href="#/library">Open library</a>
      </div>
    </section>
  `);
}

export {
  renderNotFoundView
};
