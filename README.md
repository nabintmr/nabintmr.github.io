# nabintmr.github.io

Personal/business profile site for Nabin Tamrakar — Nepal Life Insurance,
LIONS Club, and share market guidance. Built for general (non-technical)
visitors: fast, mobile-first, bilingual (English/Nepali toggle), simple
navigation.

## Structure
- `index.html`, `services.html`, `about.html`, `gallery.html`,
  `testimonials.html`, `contact.html` — the 6 pages
- `assets/css/` — `tokens.css` (design tokens), `base.css` (reset/type),
  `components.css` (nav, cards, forms, footer, etc.)
- `assets/js/script.js` — mobile nav toggle + language toggle
- `scripts/verify.py` — pre-commit structural integrity check
- `sync.ps1` — pull / verify / commit / push workflow

## Still needed before launch (placeholders in the code)
- Real photos (gallery images) replacing the gray placeholder boxes — hero/about photo added
- Real bio text on About page
- Real testimonial quotes (with permission to publish)
- Contact form needs a backend (e.g. Formspree) to actually send messages
- Nepali (ने) translations — the language toggle exists but Nepali text
  content still needs to be written in and marked with `data-lang="ne"`

## Contact channels (live)
- WhatsApp: +977 984-2649491
- Email: nabintmr@gmail.com
- Facebook: facebook.com/nabintmr
(No phone/Call option — WhatsApp and email only, by request.)

## Workflow
```powershell
.\sync.ps1                          # pull, verify, commit, push
.\sync.ps1 -m "content: update bio" # with custom commit message
.\sync.ps1 -PullOnly                # just pull
```
