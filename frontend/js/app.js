import { mountSearchFeature } from './features/search.js';
import { mountCollectionFeature } from './features/collection.js';

const template = document.querySelector('#book-card-template');

const collection = mountCollectionFeature({
  queryInput: document.querySelector('#collection-query'),
  statusInput: document.querySelector('#collection-status'),
  refreshButton: document.querySelector('#refresh-collection'),
  feedback: document.querySelector('#collection-feedback'),
  results: document.querySelector('#collection-results'),
  template
});

mountSearchFeature(
  {
    form: document.querySelector('#search-form'),
    input: document.querySelector('#search-input'),
    feedback: document.querySelector('#search-feedback'),
    results: document.querySelector('#search-results'),
    template
  },
  {
    onBookSaved: async () => {
      await collection.loadBooks('Collection refreshed after save.');
    }
  }
);

collection.loadBooks();
