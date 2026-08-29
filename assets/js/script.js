(function () {
  'use strict';

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // Bilingual toggle (English / Nepali), persisted
  var STORAGE_KEY = 'site-lang';
  var htmlEl = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === 'en' || saved === 'ne') {
    htmlEl.setAttribute('lang', saved);
  }

  function setLang(lang) {
    htmlEl.setAttribute('lang', lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.querySelectorAll('.lang-toggle button').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  document.querySelectorAll('.lang-toggle button').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.dataset.lang); });
    btn.classList.toggle('active', btn.dataset.lang === (htmlEl.getAttribute('lang') || 'en'));
  });

  // Number-key shortcuts: 1=Home 2=Services 3=About 4=Gallery 5=Testimonials 6=Contact
  var PAGE_MAP = {
    '1': 'index.html',
    '2': 'services.html',
    '3': 'about.html',
    '4': 'gallery.html',
    '5': 'testimonials.html',
    '6': 'contact.html'
  };
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var target = e.target;
    var tag = target && target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (target && target.isContentEditable)) return;
    var dest = PAGE_MAP[e.key];
    if (dest) {
      window.location.href = dest;
    }
  });
})();
