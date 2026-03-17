import { createElement } from '../shared/dom.js';

function renderNotFoundView() {
  return createElement(`
    <section class="panel empty-route">
      <p class="eyebrow">Wrong turn</p>
      <h1>That route does not exist.</h1>
      <p>Use the main navigation and stop inventing URLs.</p>
      <a class="button button-primary" href="#/">Back home</a>
    </section>
  `);
}

export {
  renderNotFoundView
};
