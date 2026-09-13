/* ============================================================
   BALKIS CCTV CAMERAS — interaction & motion
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE    = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (FINE) document.body.classList.add('pointer-fine');

  const WA_NUMBER = '17542710952';   // also the call / SMS number

  /* ── 1. PRELOADER ───────────────────────── */
  (function preloader() {
    const el = $('#preloader'), bar = $('#preBar');
    if (!el) return;
    let p = 0, done = false;
    const tick = setInterval(() => {
      p = Math.min(96, p + Math.random() * 15 + 5);
      bar.style.width = p + '%';
    }, 120);
    const finish = () => {
      if (done) return; done = true;
      clearInterval(tick);
      bar.style.width = '100%';
      setTimeout(() => {
        el.classList.add('done');
        document.body.classList.remove('is-locked');
        setTimeout(() => el.remove(), 800);
      }, 300);
    };
    document.body.classList.add('is-locked');
    addEventListener('load', finish);
    setTimeout(finish, 3000);
  })();

  /* ── 2. SMOOTH SCROLL ───────────────────── */
  const SS = {
    on: false, target: 0, current: 0, ease: 0.105, max: 0,
    measure() { this.max = Math.max(0, document.documentElement.scrollHeight - innerHeight); }
  };
  (function smoothScroll() {
    if (REDUCED || !FINE) return;
    SS.on = true;
    document.documentElement.classList.add('has-smooth');
    SS.measure();
    SS.target = SS.current = scrollY;

    addEventListener('wheel', (e) => {
      if (e.ctrlKey || document.body.classList.contains('is-locked')) return;
      e.preventDefault();
      const mult = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? innerHeight : 1;
      SS.target = clamp(SS.target + e.deltaY * mult, 0, SS.max);
    }, { passive: false });

    addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const h = innerHeight;
      const map = { PageDown: h * .88, PageUp: -h * .88, ArrowDown: 120, ArrowUp: -120, Home: -1e9, End: 1e9 };
      let d = map[e.key];
      if (e.key === ' ') d = e.shiftKey ? -h * .88 : h * .88;
      if (d === undefined) return;
      e.preventDefault();
      SS.target = clamp(SS.target + d, 0, SS.max);
    });

    addEventListener('scroll', () => {
      if (Math.abs(scrollY - SS.current) > 8) SS.current = SS.target = scrollY;
    }, { passive: true });
    addEventListener('resize', () => SS.measure());
    new ResizeObserver(() => SS.measure()).observe(document.body);
  })();

  /* ── 3. ANCHORS ─────────────────────────── */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      const y = el.getBoundingClientRect().top + scrollY - (id === '#top' ? 0 : 68);
      if (SS.on) { SS.measure(); SS.target = clamp(y, 0, SS.max); }
      else scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
    });
  });

  /* ── 4. CURSOR ──────────────────────────── */
  (function cursor() {
    if (!FINE) return;
    const el = $('#cursor'), ring = $('.cursor-ring', el), dot = $('.cursor-dot', el), lab = $('.cursor-label', el);
    const c = { x: innerWidth / 2, y: innerHeight / 2, rx: 0, ry: 0, dx: 0, dy: 0 };
    addEventListener('mousemove', (e) => { c.x = e.clientX; c.y = e.clientY; }, { passive: true });

    const hotSel = 'a,button,summary,.tilt,.feed,.g,input,select,textarea,[data-cursor]';
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest(hotSel);
      if (!t || !t.dataset.cursor) { el.classList.remove('is-hot'); return; }
      el.classList.add('is-hot');
      lab.textContent = t.dataset.cursor;
    });
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget || !e.relatedTarget.closest(hotSel)) el.classList.remove('is-hot');
    });

    (function loop() {
      c.rx = lerp(c.rx, c.x, .18); c.ry = lerp(c.ry, c.y, .18);
      c.dx = lerp(c.dx, c.x, .55); c.dy = lerp(c.dy, c.y, .55);
      ring.style.setProperty('--rx', c.rx + 'px'); ring.style.setProperty('--ry', c.ry + 'px');
      lab.style.setProperty('--rx', c.rx + 'px');  lab.style.setProperty('--ry', c.ry + 'px');
      dot.style.setProperty('--dx', c.dx + 'px');  dot.style.setProperty('--dy', c.dy + 'px');
      requestAnimationFrame(loop);
    })();
  })();

  /* ── 5. SPLIT TEXT ──────────────────────── */
  $$('[data-split]').forEach((el) => {
    if (REDUCED) return;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    let i = 0;
    words.forEach((w, wi) => {
      const wd = document.createElement('span');
      wd.className = 'wd';
      for (const ch of w) {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = ch;
        s.style.transitionDelay = (i * 0.024) + 's';
        wd.appendChild(s); i++;
      }
      el.appendChild(wd);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ── 6. REVEAL + COUNTERS ───────────────── */
  function countUp(el) {
    const end = parseFloat(el.dataset.count) || 0;
    const suf = el.dataset.suffix || '';
    if (REDUCED || end === 0) { el.textContent = end + suf; return; }
    const dur = 1800, t0 = performance.now();
    (function step(t) {
      const p = clamp((t - t0) / dur, 0, 1);
      el.textContent = Math.round(end * (1 - Math.pow(2, -10 * p))) + suf;
      if (p < 1) requestAnimationFrame(step); else el.textContent = end + suf;
    })(t0);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      $$('.ch', el).forEach((c) => c.classList.add('in'));
      if (el.dataset.count !== undefined) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal],[data-split],.count,.sec-title,.hero-title,.cta-title').forEach((el) => io.observe(el));

  /* ── 7. TILT + MAGNETIC ─────────────────── */
  if (FINE && !REDUCED) {
    $$('.tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transition = 'transform .12s linear, box-shadow .6s cubic-bezier(.22,1,.36,1)';
        card.style.transform =
          `perspective(1400px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg) translateY(-7px) scale(1.012)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1), box-shadow .6s cubic-bezier(.22,1,.36,1)';
        card.style.transform = 'perspective(1400px) rotateX(0) rotateY(0) translateY(0) scale(1)';
      });
    });
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform =
          `translate(${(e.clientX - (r.left + r.width / 2)) * .22}px, ${(e.clientY - (r.top + r.height / 2)) * .34}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ── 8. HEADER / NAV ────────────────────── */
  const header = $('#header'), navLinks = $$('[data-nav]'), pill = $('#navPill'), navEl = $('#nav');
  let navHovered = false, lastY = 0;
  function movePill(t) {
    if (!pill || !t) return;
    pill.style.width = t.offsetWidth + 'px';
    pill.style.transform = `translateX(${t.offsetLeft}px)`;
    pill.style.opacity = '1';
  }
  navLinks.forEach((a) => a.addEventListener('mouseenter', () => { navHovered = true; movePill(a); }));
  navEl && navEl.addEventListener('mouseleave', () => {
    navHovered = false;
    const act = $('[data-nav].active');
    act ? movePill(act) : (pill.style.opacity = '0');
  });

  /* ── 9. MOBILE MENU ─────────────────────── */
  const burger = $('#burger'), mmenu = $('#mobileMenu');
  function closeMenu() {
    if (!mmenu) return;
    mmenu.classList.remove('open');
    burger && burger.setAttribute('aria-expanded', 'false');
    mmenu.setAttribute('aria-hidden', 'true');
  }
  burger && burger.addEventListener('click', () => {
    const open = mmenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    mmenu.setAttribute('aria-hidden', String(!open));
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

  /* ── 10. ACCORDION (one open) ───────────── */
  const accs = $$('#acc .ac');
  accs.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) accs.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ── 11. GALLERY LIGHTBOX ───────────────── */
  (function lightbox() {
    const figs = $$('#gal .g'); if (!figs.length) return;
    const box = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap');
    let i = 0;
    function open(n) {
      i = (n + figs.length) % figs.length;
      const src = $('img', figs[i]);
      img.src = src.src; img.alt = src.alt;
      const b = figs[i].querySelector('figcaption b');
      cap.textContent = (b ? b.textContent.toUpperCase() : '') + '   ·   ' + (i + 1) + ' / ' + figs.length;
      box.classList.add('open'); box.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
    }
    function close() {
      box.classList.remove('open'); box.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
    }
    figs.forEach((f, n) => {
      f.setAttribute('tabindex', '0'); f.setAttribute('role', 'button');
      f.addEventListener('click', () => open(n));
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); } });
    });
    $('#lbClose').addEventListener('click', close);
    $('#lbNext').addEventListener('click', () => open(i + 1));
    $('#lbPrev').addEventListener('click', () => open(i - 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    addEventListener('keydown', (e) => {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') open(i + 1);
      if (e.key === 'ArrowLeft') open(i - 1);
    });
  })();

  /* ── 12. CLOCK + YEAR ───────────────────── */
  (function clock() {
    const n = $('#nvrClock');
    const tick = () => { if (n) n.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }); };
    tick(); setInterval(tick, 1000);
    const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();
  })();

  /* ── 13. QUOTE FORM → text message (or WhatsApp) ── */
  (function form() {
    const f = $('#quoteForm'); if (!f) return;
    const ok = $('#formOk');
    // Optional: add data-endpoint="https://formspree.io/f/XXXX" to the <form> to also POST a copy.
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      ['name', 'phone'].forEach((n) => {
        const el = f.elements[n];
        const bad = !el.value.trim();
        el.classList.toggle('err', bad);
        if (bad) valid = false;
      });
      if (!valid) { f.elements.name.focus(); return; }

      const via = (e.submitter && e.submitter.value) || 'sms';
      const d = new FormData(f);
      if (f.dataset.endpoint) {
        try { await fetch(f.dataset.endpoint, { method: 'POST', body: d, headers: { Accept: 'application/json' } }); }
        catch (_) { /* non-fatal — the message handoff below still runs */ }
      }
      const msg = [
        'Free survey request — Balkis Cameras', '',
        'Name: ' + d.get('name'),
        'Phone: ' + d.get('phone'),
        'Business: ' + (d.get('business') || '—'),
        'Property type: ' + d.get('type'),
        'Cameras needed: ' + d.get('cameras'),
        'Notes: ' + (d.get('notes') || '—')
      ].join('\n');

      if (via === 'wa') {
        window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      } else {
        // "?&body=" is the form both iOS and Android Messages accept
        location.href = 'sms:+' + WA_NUMBER + '?&body=' + encodeURIComponent(msg);
      }
      ok.hidden = false;
      ok.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
    });
    f.querySelectorAll('input,select,textarea').forEach((el) =>
      el.addEventListener('input', () => el.classList.remove('err')));
  })();

  /* ── 14. MASTER RAF ─────────────────────── */
  const bar = $('#scrollBar');
  const parallax = $$('[data-parallax]');
  const darkSections = $$('[data-dark]');
  const sections = ['services', 'live', 'work', 'faq'].map((id) => document.getElementById(id));

  function frame() {
    if (SS.on && Math.abs(SS.target - SS.current) > 0.05) {
      SS.current = lerp(SS.current, SS.target, SS.ease);
      if (Math.abs(SS.target - SS.current) < 0.12) SS.current = SS.target;
      scrollTo(0, SS.current);
    }
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? clamp(y / max, 0, 1) * 100 : 0) + '%';

    if (header) {
      header.classList.toggle('scrolled', y > 40);
      header.classList.toggle('hide', y > 620 && y > lastY + 4 && !mmenu.classList.contains('open'));
      if (Math.abs(y - lastY) > 3) lastY = y;
      const band = header.offsetHeight * 0.55;
      let dark = false;
      for (const s of darkSections) {
        const r = s.getBoundingClientRect();
        if (r.top <= band && r.bottom >= band) { dark = true; break; }
      }
      header.classList.toggle('on-dark', dark);
    }

    for (const el of parallax) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const mid = r.top + r.height / 2 - innerHeight / 2;
      el.style.translate = `0 ${(-mid * parseFloat(el.dataset.parallax)).toFixed(2)}px`;
    }

    let activeId = null;
    for (const s of sections) {
      if (!s) continue;
      const r = s.getBoundingClientRect();
      if (r.top <= innerHeight * 0.42 && r.bottom >= innerHeight * 0.42) { activeId = s.id; break; }
    }
    navLinks.forEach((a) => {
      const on = activeId && a.getAttribute('href') === '#' + activeId;
      a.classList.toggle('active', !!on);
      if (on && !navHovered) movePill(a);
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
