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

  function updateButtons(lang) {
    document.querySelectorAll('.lang-toggle button').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'ne') lang = 'en';
    htmlEl.setAttribute('lang', lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    updateButtons(lang);
  }

  // Expose on window for direct access
  window.setSiteLang = setLang;

  // Read saved language or default to en
  var currentLang = 'en';
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ne') currentLang = saved;
  } catch (e) {}
  setLang(currentLang);

  // Global event listener using pointerdown and click for immediate feedback
  function handleLangClick(e) {
    var target = e.target;
    while (target && target !== document.body) {
      if (target.matches && target.matches('.lang-toggle button')) {
        var lang = target.getAttribute('data-lang');
        if (lang) {
          e.preventDefault();
          e.stopPropagation();
          setLang(lang);
        }
        return;
      }
      target = target.parentElement;
    }
  }

  document.addEventListener('click', handleLangClick, true);

  // Re-sync on DOMContentLoaded if needed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      updateButtons(htmlEl.getAttribute('lang') || 'en');
    });
  } else {
    updateButtons(htmlEl.getAttribute('lang') || 'en');
  }

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

  // Native Dialog Modal Controller (Light-dismiss & trigger binding)
  var licenseModal = document.getElementById('license-modal');
  var openLicenseBtns = document.querySelectorAll('.open-license-modal');
  var closeLicenseBtns = document.querySelectorAll('.close-license-modal');

  if (licenseModal) {
    openLicenseBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof licenseModal.showModal === 'function') {
          licenseModal.showModal();
        } else {
          licenseModal.setAttribute('open', '');
        }
      });
    });

    closeLicenseBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (typeof licenseModal.close === 'function') {
          licenseModal.close();
        } else {
          licenseModal.removeAttribute('open');
        }
      });
    });

    // Light-dismiss: click on backdrop dismisses dialog
    licenseModal.addEventListener('click', function (event) {
      var rect = licenseModal.getBoundingClientRect();
      var isInDialog = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        if (typeof licenseModal.close === 'function') {
          licenseModal.close();
        } else {
          licenseModal.removeAttribute('open');
        }
      }
    });

    // Strict View-Only Guards: disable context menu, image dragging, and saving within modal
    licenseModal.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      return false;
    });
    licenseModal.addEventListener('dragstart', function (e) {
      e.preventDefault();
      return false;
    });
  }
})();
