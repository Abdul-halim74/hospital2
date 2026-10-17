// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
}

// Doctor filter (doctors.html)
const search = document.getElementById('doc-search');
const deptSel = document.getElementById('doc-dept');
if (search && deptSel) {
  const cards = [...document.querySelectorAll('.doc')];
  const empty = document.getElementById('doc-empty');
  // Pre-select department from ?dept= in the URL
  const fromUrl = new URLSearchParams(location.search).get('dept');
  if (fromUrl) deptSel.value = fromUrl;
  function apply() {
    const q = search.value.toLowerCase();
    const d = deptSel.value;
    let shown = 0;
    cards.forEach(c => {
      const ok = (d === 'all' || c.dataset.dept === d) && c.textContent.toLowerCase().includes(q);
      c.hidden = !ok;
      if (ok) shown++;
    });
    empty.hidden = shown > 0;
  }
  search.addEventListener('input', apply);
  deptSel.addEventListener('change', apply);
  apply();
}

// Appointment form: pre-fill doctor from ?doctor=
const apptDoctor = document.getElementById('appt-doctor');
if (apptDoctor) {
  const doc = new URLSearchParams(location.search).get('doctor');
  if (doc) apptDoctor.value = doc;
}

// Demo forms
document.querySelectorAll('form[data-demo]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const note = form.querySelector('.note');
    note.textContent = form.dataset.demo;
    form.reset();
  });
});

/* ---------- Hero slider ---------- */
document.querySelectorAll('[data-slider]').forEach(slider => {
  const track = slider.querySelector('.slides');
  const slides = [...slider.querySelectorAll('.slide')];
  const dotsBox = slider.querySelector('.dots');
  const DUR = 6000;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  slider.style.setProperty('--dur', DUR + 'ms');
  let i = 0, timer = null;

  const dots = slides.map((s, n) => {
    const b = document.createElement('button');
    b.className = 'dot'; b.type = 'button';
    b.setAttribute('aria-label', `Slide ${n + 1} of ${slides.length}`);
    b.innerHTML = '<span></span>';
    b.onclick = () => { go(n); restart(); };
    dotsBox.appendChild(b);
    return b;
  });

  function go(n) {
    i = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${i * 100}%)`;
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === i);
      s.setAttribute('aria-hidden', k !== i);
      s.querySelectorAll('a,button').forEach(el => el.tabIndex = k === i ? 0 : -1);
    });
    dots.forEach((d, k) => {
      d.removeAttribute('aria-current');
      if (k === i) { void d.offsetWidth; d.setAttribute('aria-current', 'true'); }
    });
  }
  function restart() {
    clearInterval(timer);
    if (!reduce && !slider.classList.contains('paused')) timer = setInterval(() => go(i + 1), DUR);
  }
  slider.querySelector('.prev').onclick = () => { go(i - 1); restart(); };
  slider.querySelector('.next').onclick = () => { go(i + 1); restart(); };
  const pause = () => { slider.classList.add('paused'); clearInterval(timer); };
  const resume = () => { slider.classList.remove('paused'); restart(); };
  slider.addEventListener('mouseenter', pause);
  slider.addEventListener('mouseleave', resume);
  slider.addEventListener('focusin', pause);
  slider.addEventListener('focusout', resume);
  slider.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { go(i - 1); }
    if (e.key === 'ArrowRight') { go(i + 1); }
  });
  // Swipe on touch screens
  let x0 = null;
  slider.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; pause(); }, { passive: true });
  slider.addEventListener('touchend', e => {
    if (x0 !== null) { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); }
    x0 = null; resume();
  });
  slider.classList.add('slide-in');
  go(0); restart();
});

/* ---------- Header search ---------- */
(function () {
  const btn = document.querySelector('.search-btn');
  const panel = document.getElementById('search-panel');
  if (!btn || !panel || !window.SEARCH_INDEX) return;
  const input = panel.querySelector('input');
  const list = panel.querySelector('.results');
  const hint = panel.querySelector('.hint');
  let items = [], active = 0;

  function open() {
    panel.hidden = false; btn.setAttribute('aria-expanded', 'true');
    input.focus(); render();
  }
  function close() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', () => panel.hidden ? open() : close());

  function render() {
    const q = input.value.trim().toLowerCase();
    hint.hidden = q.length > 0;
    if (!q) { list.innerHTML = ''; items = []; return; }
    items = SEARCH_INDEX.filter(it => (it.title + ' ' + it.meta + ' ' + (it.keywords || '')).toLowerCase().includes(q)).slice(0, 8);
    active = 0;
    list.innerHTML = items.length
      ? items.map((it, k) => `<li><a href="${it.url}" class="${k === 0 ? 'on' : ''}"><span>${it.title}</span><small>${it.type}</small></a></li>`).join('')
      : `<li class="none">Nothing found for “${input.value}”. Try a department like “heart” or “child”.</li>`;
  }
  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    const links = list.querySelectorAll('a');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!links.length) return;
      links[active].classList.remove('on');
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links[active].classList.add('on'); links[active].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') { e.preventDefault(); if (links[active]) location.href = links[active].href; }
  });
  hint.querySelectorAll('button').forEach(b => b.onclick = () => { input.value = b.textContent; render(); input.focus(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); }
    if (e.key === '/' && panel.hidden && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
  });
  document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) close(); });
})();

// Doctors page: accept ?q= from search
const qParam = new URLSearchParams(location.search).get('q');
if (qParam && document.getElementById('doc-search')) {
  const s = document.getElementById('doc-search');
  s.value = qParam; s.dispatchEvent(new Event('input'));
}
