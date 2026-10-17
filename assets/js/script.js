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
      var btnLang = btn.getAttribute('data-lang-btn') || btn.getAttribute('data-lang');
      var isActive = (btnLang === lang);
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
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

  // Global event listener for language toggling
  function handleLangClick(e) {
    var target = e.target;
    while (target && target !== document.body) {
      if (target.matches && target.matches('.lang-toggle button')) {
        var targetLang = target.getAttribute('data-lang-btn') || target.getAttribute('data-lang');
        var current = htmlEl.getAttribute('lang') || 'en';
        // If clicking the button that is already active, toggle to the other language!
        // If clicking the inactive button, switch to that button's language.
        var nextLang = (targetLang === current) ? (current === 'en' ? 'ne' : 'en') : (targetLang || (current === 'en' ? 'ne' : 'en'));
        e.preventDefault();
        e.stopPropagation();
        setLang(nextLang);
        return;
      }
      if (target.matches && target.matches('.lang-toggle')) {
        var current = htmlEl.getAttribute('lang') || 'en';
        e.preventDefault();
        e.stopPropagation();
        setLang(current === 'en' ? 'ne' : 'en');
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

  // ── Google Forms Headless Contact Intake ────────────────────────
  // Configured via scripts/setup_google_form_trigger.gs
  // Run setupNabinContactForm() in script.google.com under nabintmr@gmail.com
  // and paste the logged output values below:
  var GOOGLE_FORM = {
    actionUrl: '',
    entries: {
      name: '',
      phone: '',
      email: '',
      message: '',
    },
    enabled: false,
  };

  // Expose on window for easy verification/override if needed
  window.NABIN_GOOGLE_FORM = GOOGLE_FORM;

  // Contact Form Submission Handler
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var btn = document.getElementById('form-btn');
      var btnText = document.getElementById('btn-text');
      var status = document.getElementById('form-status');
      var nameInput = document.getElementById('name');
      var phoneInput = document.getElementById('phone');
      var emailInput = document.getElementById('email');
      var messageInput = document.getElementById('message');
      var hpInput = document.getElementById('form-hp');

      // Bot honeypot trap: silently fake success without dispatch
      if (hpInput && hpInput.value.trim()) {
        btn.disabled = true;
        btnText.innerHTML = '<span data-lang="en">Sending...</span><span data-lang="ne">पठाउँदै...</span>';
        setTimeout(function () {
          status.innerHTML = '<div class="form-status-badge success"><span>✓</span><div><span data-lang="en">Message sent successfully! I will contact you soon.</span><span data-lang="ne">सन्देश सफलतापूर्वक पठाइयो! म चाँडै सम्पर्क गर्नेछु।</span></div></div>';
          contactForm.reset();
          btn.disabled = false;
          btnText.innerHTML = '<span data-lang="en">Send Message</span><span data-lang="ne">सन्देश पठाउनुहोस्</span>';
        }, 600);
        return;
      }

      var nameVal = (nameInput && nameInput.value) ? nameInput.value.trim() : '';
      var phoneVal = (phoneInput && phoneInput.value) ? phoneInput.value.trim() : '';
      var emailVal = (emailInput && emailInput.value) ? emailInput.value.trim() : '';
      var messageVal = (messageInput && messageInput.value) ? messageInput.value.trim() : '';

      // Validation
      if (!nameVal) {
        status.innerHTML = '<div class="form-status-badge error"><span>⚠</span><div><span data-lang="en">Please enter your name.</span><span data-lang="ne">कृपया तपाईंको पुरा नाम लेख्नुहोस्।</span></div></div>';
        if (nameInput) nameInput.focus();
        return;
      }

      if (!phoneVal) {
        status.innerHTML = '<div class="form-status-badge error"><span>⚠</span><div><span data-lang="en">Please enter your contact phone number.</span><span data-lang="ne">कृपया तपाईंको सम्पर्क नम्बर लेख्नुहोस्।</span></div></div>';
        if (phoneInput) phoneInput.focus();
        return;
      }

      if (emailVal && emailInput && !emailInput.checkValidity()) {
        status.innerHTML = '<div class="form-status-badge error"><span>⚠</span><div><span data-lang="en">Please enter a valid email address.</span><span data-lang="ne">कृपया मान्य इमेल ठेगाना लेख्नुहोस्।</span></div></div>';
        emailInput.focus();
        return;
      }

      if (!messageVal) {
        status.innerHTML = '<div class="form-status-badge error"><span>⚠</span><div><span data-lang="en">Please enter your message.</span><span data-lang="ne">कृपया आफ्नो सन्देश / विवरण लेख्नुहोस्।</span></div></div>';
        if (messageInput) messageInput.focus();
        return;
      }

      // UI Sending State
      btn.disabled = true;
      btnText.innerHTML = '<span data-lang="en">Sending...</span><span data-lang="ne">पठाउँदै...</span>';
      status.innerHTML = '';

      // Check if Google Forms is active
      if (GOOGLE_FORM.enabled && GOOGLE_FORM.actionUrl) {
        try {
          var gfData = new FormData();
          if (GOOGLE_FORM.entries.name) gfData.append(GOOGLE_FORM.entries.name, nameVal);
          if (GOOGLE_FORM.entries.phone) gfData.append(GOOGLE_FORM.entries.phone, phoneVal);
          if (GOOGLE_FORM.entries.email) gfData.append(GOOGLE_FORM.entries.email, emailVal);
          if (GOOGLE_FORM.entries.message) gfData.append(GOOGLE_FORM.entries.message, messageVal);

          await fetch(GOOGLE_FORM.actionUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: gfData,
          });

          status.innerHTML = '<div class="form-status-badge success"><span>✓</span><div><span data-lang="en">Message sent successfully! I will contact you soon.</span><span data-lang="ne">सन्देश सफलतापूर्वक पठाइयो! म चाँडै सम्पर्क गर्नेछु।</span></div></div>';
          contactForm.reset();
        } catch (err) {
          console.warn('Google Form submission failed:', err);
          status.innerHTML = '<div class="form-status-badge error"><span>⚠</span><div><span data-lang="en">Submission failed. Please message via <a href="https://wa.me/9779842649491" target="_blank" rel="noopener">WhatsApp</a> or call +977 984-2649491.</span><span data-lang="ne">सन्देश पठाउन सकिएन। कृपया <a href="https://wa.me/9779842649491" target="_blank" rel="noopener">ह्वाट्सएप</a> वा +९७७ ९८४२६४९४९१ मा सम्पर्क गर्नुहोस्।</span></div></div>';
        }
      } else {
        // Fallback when Google Form is not yet configured: direct WhatsApp
        var encodedMsg = encodeURIComponent('Namaste Nabin dai,\n\nName: ' + nameVal + '\nPhone: ' + phoneVal + (emailVal ? '\nEmail: ' + emailVal : '') + '\n\nMessage:\n' + messageVal);
        var waUrl = 'https://wa.me/9779842649491?text=' + encodedMsg;
        window.open(waUrl, '_blank');
        status.innerHTML = '<div class="form-status-badge warning"><span>ℹ</span><div><span data-lang="en">Opening WhatsApp with your pre-filled message...</span><span data-lang="ne">तपाईंको सन्देशसहित ह्वाट्सएप खुल्दैछ...</span></div></div>';
      }

      btn.disabled = false;
      btnText.innerHTML = '<span data-lang="en">Send Message</span><span data-lang="ne">सन्देश पठाउनुहोस्</span>';
    });
  }
})();
