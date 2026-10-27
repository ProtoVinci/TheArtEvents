(() => {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     SITE CONFIG — the studio's contact details. Fill these in and
     the contact section and enquiry form will use them.
       whatsapp : country code + number, digits only, e.g. "919876543210"
       email    : e.g. "hello@theartevents.com"
       instagram: handle without @, e.g. "theartevents"
       city     : e.g. "Hyderabad"
     Anything left empty is simply not shown.
     ───────────────────────────────────────────────────────────── */
  const CONFIG = { whatsapp: '', email: '', instagram: '', city: '' };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileNav = matchMedia('(max-width: 960px)');

  /* ───────── Header: compact on scroll, mobile menu ───────── */
  const header = $('.site-header');
  const nav = $('#nav');
  const menuBtn = $('.menu-btn');
  const dock = $('#dock');
  const contactSection = $('#contact');

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 40 || nav.classList.contains('is-open'));
    if (dock) {
      const cTop = contactSection.getBoundingClientRect().top;
      dock.classList.toggle('is-visible', y > window.innerHeight * 0.7 && cTop > window.innerHeight * 0.6);
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    onScroll();
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    $('.menu-btn__label', menuBtn).textContent = open ? 'Close' : 'Menu';
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
  mobileNav.addEventListener('change', (e) => { if (!e.matches) setMenu(false); });

  /* ───────── Reveal on scroll (geometry based, no observer) ───────── */
  let pending = $$('.head, .tile, .pillars li, .steps li, .brand__logo, .svc__item, .palette, .form, .film, .contact__lead, .about__copy, .about__media');
  pending.forEach((el) => el.classList.add('reveal'));
  const checkReveals = () => {
    const limit = window.innerHeight * 0.94;
    pending = pending.filter((el) => {
      if (reduceMotion || el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); return false; }
      return true;
    });
    if (!pending.length) { window.removeEventListener('scroll', onReveal); window.removeEventListener('resize', onReveal); }
  };
  let revealTick = false;
  function onReveal() { if (!revealTick) { revealTick = true; requestAnimationFrame(() => { revealTick = false; checkReveals(); }); } }
  window.addEventListener('scroll', onReveal, { passive: true });
  window.addEventListener('resize', onReveal);
  setTimeout(checkReveals, 0);

  /* ───────── Hero slideshow (landscape set on desktop, portrait set on phones) ───────── */
  const stage = $('#stage');
  const allSlides = $$('.slide', stage);
  const dots = $('.stage__dots');
  let slides = [];
  let idx = 0;
  let timer = null;

  function show(i) {
    idx = (i + slides.length) % slides.length;
    allSlides.forEach((s) => s.classList.remove('is-active'));
    slides[idx].classList.add('is-active');
    $$('button', dots).forEach((b, n) => b.setAttribute('aria-current', String(n === idx)));
    $('#stage-title').textContent = slides[idx].dataset.title;
    $('#stage-kind').textContent = slides[idx].dataset.kind;
  }
  function restart() {
    clearInterval(timer);
    if (!reduceMotion && slides.length > 1) timer = setInterval(() => show(idx + 1), 6000);
  }
  function buildSlides() {
    const visible = allSlides.filter((s) => getComputedStyle(s).display !== 'none');
    if (visible.length && visible[0] === slides[0]) return;
    slides = visible;
    dots.replaceChildren(...slides.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Show ${s.dataset.title}`);
      b.addEventListener('click', () => { show(i); restart(); });
      return b;
    }));
    show(0);
    restart();
  }
  buildSlides();
  window.addEventListener('resize', buildSlides);
  ['mouseenter', 'focusin'].forEach((ev) => $('.hero').addEventListener(ev, () => clearInterval(timer)));
  ['mouseleave', 'focusout'].forEach((ev) => $('.hero').addEventListener(ev, restart));

  /* ───────── Work: masonry rows, filter ───────── */
  const grid = $('#plates');
  const plates = $$('.plate', grid);
  const ROW = 4;

  const layoutPlates = () => {
    plates.forEach((p) => {
      if (p.hidden) return;
      p.style.gridRowEnd = 'span 1';
      p.style.gridRowEnd = `span ${Math.ceil($('.plate__inner', p).getBoundingClientRect().height / ROW)}`;
    });
  };
  let lastW = 0;
  new ResizeObserver(() => {
    const w = grid.clientWidth;
    if (w !== lastW) { lastW = w; layoutPlates(); }
  }).observe(grid);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutPlates);
  window.addEventListener('load', layoutPlates);

  const visiblePlates = () => plates.filter((p) => !p.hidden);
  const inCat = (p, key) => key === 'all' || p.dataset.cat.split(' ').includes(key);

  const applyFilter = (key) => {
    plates.forEach((p) => { p.hidden = !inCat(p, key); });
    $$('.filter').forEach((b) => {
      const on = b.dataset.filter === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    layoutPlates();
  };
  $$('.filter').forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));

  // swatches under each caption + occasion tile counts
  const dot = (hex) => { const i = document.createElement('i'); i.style.background = hex; i.title = hex; return i; };
  $$('.tile').forEach((t) => {
    const n = plates.filter((p) => inCat(p, t.dataset.filter)).length;
    $('.tile__count', t).textContent = `${n} ${n === 1 ? 'set' : 'sets'}`;
    t.addEventListener('click', () => applyFilter(t.dataset.filter));
  });

  /* ───────── Lightbox ───────── */
  const lb = $('#lightbox');
  const lbImg = $('#lb-img');
  let current = null;

  const fillLightbox = (plate) => {
    current = plate;
    const img = $('img', plate);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    $('#lb-tag').textContent = plate.dataset.tag;
    $('#lb-title').textContent = plate.dataset.title;
    $('#lb-kind').textContent = plate.dataset.kind;
    $('#lb-venue').textContent = plate.dataset.venue;
    $('#lb-swatches').replaceChildren(...plate.dataset.palette.split(',').map(dot));
    $('#lb-elements').replaceChildren(...plate.dataset.elements.split('|').map((t) => {
      const li = document.createElement('li');
      li.innerHTML = t; // authored content in index.html
      return li;
    }));
    const multiple = visiblePlates().length > 1;
    $('#lb-prev').hidden = $('#lb-next').hidden = !multiple;
    lb.scrollTop = 0;
    $('.lightbox__body', lb).scrollTop = 0;
  };
  const openPlate = (plate) => {
    if (plate.hidden) applyFilter('all');
    fillLightbox(plate);
    if (!lb.open) { lb.showModal(); document.body.style.overflow = 'hidden'; }
  };
  const step = (dir) => {
    const list = visiblePlates();
    if (list.length < 2) return;
    fillLightbox(list[(list.indexOf(current) + dir + list.length) % list.length]);
  };

  plates.forEach((p) => $('.plate__open', p).addEventListener('click', () => openPlate(p)));
  $('#lb-prev').addEventListener('click', () => step(-1));
  $('#lb-next').addEventListener('click', () => step(1));
  $('.lightbox__close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  lb.addEventListener('close', () => { document.body.style.overflow = ''; });
  $('#lb-cta').addEventListener('click', () => {
    const notes = $('#f-notes');
    if (current && !notes.value.trim()) notes.value = `I loved the “${current.dataset.title}” set — something in this spirit, please.`;
    lb.close();
  });

  /* ───────── Services accordion ───────── */
  const items = $$('.svc__item');
  const media = $$('.svc__media img');
  const openItem = (n) => {
    items.forEach((it, i) => {
      const on = i === n;
      it.classList.toggle('is-open', on);
      $('.svc__btn', it).setAttribute('aria-expanded', String(on));
      media[i].classList.toggle('is-active', on);
    });
  };
  items.forEach((it, i) => $('.svc__btn', it).addEventListener('click', () => openItem(i)));

  /* ───────── Colour palettes (built from the plates' data) ───────── */
  const inkFor = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#0D1A31' : '#FFFFFF';
  };
  const palettes = $('#palettes');
  plates.forEach((p) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette';
    btn.setAttribute('aria-label', `${p.dataset.title} palette — open this set`);
    const bar = document.createElement('span');
    bar.className = 'palette__bar';
    p.dataset.palette.split(',').forEach((hex) => {
      const i = document.createElement('i');
      i.style.background = hex;
      i.style.setProperty('--sw-ink', inkFor(hex));
      i.textContent = hex;
      bar.append(i);
    });
    const label = document.createElement('span');
    label.className = 'palette__label';
    const strong = document.createElement('strong');
    strong.textContent = p.dataset.title;
    const sub = document.createElement('span');
    sub.textContent = ` · ${p.dataset.kind}`;
    label.append(strong, sub);
    btn.append(bar, label);
    btn.addEventListener('click', () => openPlate(p));
    li.append(btn);
    palettes.append(li);
  });

  /* ───────── Films ───────── */
  const films = $$('.film');
  films.forEach((film) => {
    const video = $('video', film);
    const play = $('.film__play', film);
    play.addEventListener('click', () => {
      films.forEach((f) => { if (f !== film) $('video', f).pause(); });
      if (!video.dataset.started) { video.dataset.started = '1'; video.currentTime = 0; } // poster frame is taken mid-clip
      video.controls = true;
      film.classList.add('is-playing');
      video.play().catch(() => { film.classList.remove('is-playing'); video.controls = false; });
    });
    video.addEventListener('ended', () => { film.classList.remove('is-playing'); video.controls = false; video.currentTime = 0; });
  });

  /* ───────── Contact details + enquiry form ───────── */
  const contactList = $('#contact-list');
  const digits = CONFIG.whatsapp.replace(/\D/g, '');
  const rows = [];
  if (digits) rows.push(['WhatsApp', `https://wa.me/${digits}`, `+${digits}`]);
  if (CONFIG.email) rows.push(['Email', `mailto:${CONFIG.email}`, CONFIG.email]);
  if (CONFIG.instagram) rows.push(['Instagram', `https://instagram.com/${CONFIG.instagram}`, `@${CONFIG.instagram}`]);
  if (CONFIG.city) rows.push(['Based in', '', CONFIG.city]);
  const footerContact = $('#footer-contact');
  const makeLink = (href, text) => {
    const a = document.createElement(href ? 'a' : 'span');
    if (href) { a.href = href; if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; } }
    a.textContent = text;
    return a;
  };
  rows.forEach(([label, href, text]) => {
    const li = document.createElement('li');
    const k = document.createElement('span');
    k.textContent = label;
    const v = makeLink(href, text);
    if (!href) v.style.fontWeight = '600';
    li.append(k, v);
    contactList.append(li);
    const fl = document.createElement('li');
    fl.append(makeLink(href, text));
    footerContact.append(fl);
  });

  const form = $('#enquiry');
  const status = $('#f-status');
  $('#f-date').min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const setError = (input, msg) => {
    const field = input.closest('.field');
    field.classList.toggle('has-error', !!msg);
    $('.field__err', field).textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  const checks = [
    [$('#f-name'), 'Please tell us your name.'],
    [$('#f-occasion'), 'Please choose an occasion.'],
  ];
  checks.forEach(([input, msg]) => input.addEventListener('input', () => { if (input.value.trim()) setError(input, ''); else if (input.closest('.has-error')) setError(input, msg); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad = null;
    checks.forEach(([input, msg]) => {
      const bad = !input.value.trim();
      setError(input, bad ? msg : '');
      if (bad && !firstBad) firstBad = input;
    });
    if (firstBad) { firstBad.focus(); status.textContent = ''; return; }

    const v = (id) => $(id).value.trim();
    const text = [
      'Hello The Art Events,',
      `I’d like to plan: ${v('#f-occasion')}.`,
      `Name: ${v('#f-name')}`,
      v('#f-date') && `Date: ${v('#f-date')}`,
      v('#f-venue') && `Venue / city: ${v('#f-venue')}`,
      v('#f-notes') && `Ideas: ${v('#f-notes')}`,
    ].filter(Boolean).join('\n');

    if (digits) {
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      status.textContent = 'Opening WhatsApp with your details — just press send.';
    } else if (CONFIG.email) {
      location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Event enquiry — ' + v('#f-occasion'))}&body=${encodeURIComponent(text)}`;
      status.textContent = 'Opening your email app with your details.';
    } else {
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
        () => { status.textContent = 'Thank you! Your enquiry has been copied — please send it to us directly.'; },
        () => { status.textContent = 'Thank you! Please send us these details directly.'; }
      );
    }
  });

  $('#year').textContent = new Date().getFullYear();
})();
