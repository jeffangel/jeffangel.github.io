(function () {
  'use strict';

  // Estimate reading time based on word count. Defaults to 200 wpm.
  function estimateReadingTime(text, wordsPerMinute) {
    const clean = (text || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = clean ? clean.split(' ').length : 0;
    const wpm = Math.max(60, Number(wordsPerMinute) || 200);
    const minutes = Math.max(1, Math.round(words / wpm));
    return { words, minutes };
  }

  function formatReadingTime(minutes, locale) {
    const lang = (locale || document.documentElement.lang || 'en').toLowerCase();
    if (lang.startsWith('es')) {
      return `Tiempo de lectura: ${minutes} min`;
    }
    return `Reading time: ${minutes} min`;
  }

  function updateReadingTime(options) {
    const {
      targetSelector = '#reading-time',
      contentSelector = 'main article',
      wordsPerMinute = 200,
      locale = document.documentElement.lang,
      // Additional selectors to exclude from word count (always excludes code blocks by default)
      excludeSelectors = []
    } = options || {};

    const target = document.querySelector(targetSelector);
    const content = document.querySelector(contentSelector);
    if (!target || !content) return;

    // Clone content and remove excluded elements (e.g., code blocks)
    const clone = content.cloneNode(true);
    // Merge always-excluded selectors with provided ones
    const excludes = Array.from(new Set(['.blog-code-block', ...excludeSelectors]));
    try {
      excludes.forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove());
      });
    } catch (_) {
      // noop - if selector fails, proceed without exclusion
    }

    const { minutes } = estimateReadingTime(clone.innerHTML, wordsPerMinute);

    // Preserve any icon inside the target and only replace the text node after it
    const icon = target.querySelector('svg');
    const label = formatReadingTime(minutes, locale);

    // Build new content
    const frag = document.createDocumentFragment();
    if (icon) {
      frag.appendChild(icon.cloneNode(true));
    }
    const textNode = document.createElement('span');
    textNode.textContent = label;
    textNode.className = 'ml-1';
    frag.appendChild(textNode);

    // Replace target contents
    target.innerHTML = '';
    target.appendChild(frag);
  }

  function init() {
    // Support attributes via data-*
    const el = document.querySelector('#reading-time');
    if (!el) return;
    const wpmAttr = el.getAttribute('data-wpm');
    const contentSel = el.getAttribute('data-content');
    const excludeAttr = el.getAttribute('data-exclude');
    const extraExcludes = excludeAttr
      ? excludeAttr.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    updateReadingTime({
      targetSelector: '#reading-time',
      contentSelector: contentSel || 'main article',
      wordsPerMinute: wpmAttr ? Number(wpmAttr) : 200,
      excludeSelectors: extraExcludes,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
