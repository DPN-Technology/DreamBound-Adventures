(() => {
'use strict';

/*
 * DreamBound DOM Collection Bridge
 *
 * Legacy DreamBound modules sometimes call collection methods on the result of
 * document.querySelector() through the local $() helper. querySelector returns
 * one Element, not a collection. This bridge records the selector associated
 * with each returned Element and provides narrowly-scoped collection methods
 * that replay against querySelectorAll().
 *
 * It adds no network capability and stores no user data.
 */
const selectorFor = new WeakMap();
const nativeQuerySelector = Document.prototype.querySelector;
const nativeQuerySelectorAll = Document.prototype.querySelectorAll;

Document.prototype.querySelector = function(selector) {
  const element = nativeQuerySelector.call(this, selector);
  if (element && typeof selector === 'string') selectorFor.set(element, selector);
  return element;
};

function collectionFor(element) {
  const selector = selectorFor.get(element);
  if (!selector) return [element];
  try {
    return Array.from(nativeQuerySelectorAll.call(element.ownerDocument || document, selector));
  } catch {
    return [element];
  }
}

const methods = {
  forEach(element, callback, thisArg) {
    return collectionFor(element).forEach(callback, thisArg);
  },
  map(element, callback, thisArg) {
    return collectionFor(element).map(callback, thisArg);
  },
  filter(element, callback, thisArg) {
    return collectionFor(element).filter(callback, thisArg);
  },
  some(element, callback, thisArg) {
    return collectionFor(element).some(callback, thisArg);
  },
  every(element, callback, thisArg) {
    return collectionFor(element).every(callback, thisArg);
  },
  reduce(element, callback, initialValue) {
    const list = collectionFor(element);
    return arguments.length >= 3 ? list.reduce(callback, initialValue) : list.reduce(callback);
  }
};

for (const [name, run] of Object.entries(methods)) {
  if (Object.prototype.hasOwnProperty.call(Element.prototype, name)) continue;
  Object.defineProperty(Element.prototype, name, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: function(...args) {
      return run(this, ...args);
    }
  });
}
})();
