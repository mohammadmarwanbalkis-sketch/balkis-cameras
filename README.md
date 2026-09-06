# Balkis CCTV Cameras — website

Static site. No build step, no framework, no dependencies to install.
ES modules need a server, so run:

```bash
node serve.js
```
Then visit http://localhost:4321

---

## What's in here

```
index.html          the whole page (8 sections)
css/style.css       all styling (design tokens live at the top in :root)
js/main.js          scroll engine, reveals, cursor, lightbox, form
assets/             logo files + favicons
assets/photos/      the 43 photos used on the site (optimised WebP)
_originals/         your untouched originals — NOT part of the website
```

`_originals/` holds every photo, the video and the logo PDF exactly as you sent them.
Nothing links to it, so you can leave it, delete it, or keep it out of your upload.

### Page order

1. **Hero** — big logo, headline, WhatsApp + quote buttons, layered photo stack
2. **Stats band** — four numbers on brand blue
3. **Services** — six cards; each reveals a real job photo on hover
4. **Live View** — six real camera stills inside an NVR multiview frame
5. **Our Work** — 13-photo gallery with a lightbox
6. **Why Balkis + Service Area** — proof points, city list, one testimonial
7. **FAQ** — six questions
8. **Get a quote** — WhatsApp buttons + a form that hands off to WhatsApp

---

## Things you'll want to change

| What | Where |
|---|---|
| Phone / WhatsApp number | search `17542710952` in `index.html` and `js/main.js` |
| Brand colours | `css/style.css` → `:root` (`--blue`, `--orange`) |
| Domain (for SEO tags) | `index.html` → `<link rel="canonical">`, `og:*` and the JSON-LD block |
| Business hours / service radius | `index.html` → the JSON-LD block and the service-area card |
| Stats (750+, 140+, …) | `index.html` → `data-count` attributes in the stats section |
| Testimonial | `index.html` → `.area-quote` in the Why section |

### Quote form

Submitting opens WhatsApp with all the details pre-typed.
If you also want a copy by email, sign up at formspree.io and add the endpoint:

```html
<form class="quote-form" id="quoteForm" data-endpoint="https://formspree.io/f/YOURID" novalidate>
```

It will then POST to Formspree **and** still open WhatsApp.

### Swapping a photo

Every photo is a `.webp` in `assets/photos/`. Replace the file (keep the name) and it
updates everywhere. To convert a new one:

```bash
cwebp -q 80 -resize 1300 0 photo.jpg -o assets/photos/photo.webp
```

The gallery is a 4-column grid where one tile is tall and two are wide — that's
13 photos filling 16 cells exactly. If you add or remove photos, keep the total at
16 cells (plain tiles = 1, wide = 2, tall = 2) or the last row will have gaps.

---

## Deploying

Plain static files — drag the folder (minus `_originals/`) onto Netlify Drop,
Vercel, Cloudflare Pages, or upload it to any host's `public_html`.

---

## Notes

- Photos are WebP (every browser since ~2020). About 5 MB of images total, all
  lazy-loaded below the fold.
- Everything respects `prefers-reduced-motion` — animations switch off for
  visitors who've asked their OS for less motion.
- No third-party scripts, no trackers, no cookie banner needed.
