(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* typewriter hero */
  const h1 = document.querySelector('.hero h1');
  const full = h1.textContent.trim();
  h1.innerHTML = `<span class="ghost" aria-hidden="true">${full}</span><span class="type" aria-hidden="true"><span class="t"></span><i class="caret"></i></span>`;
  const typed = h1.querySelector('.t');
  const done = () => document.body.classList.add('typed');

  if (still) {
    typed.textContent = full;
    h1.querySelector('.caret').remove();
    done();
  } else {
    let i = 0;
    const type = () => {
      typed.textContent = full.slice(0, ++i);
      if (i < full.length) setTimeout(type, 70 + Math.random() * 90);
      else setTimeout(done, 250);
    };
    setTimeout(type, 500);
  }

  /* staggered reveals */
  document.querySelectorAll('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${sibs.indexOf(el) * 0.08}s`);
  });

  /* count-up */
  const parse = el => {
    const raw = el.dataset.count;
    const to = parseFloat(raw);
    const dec = (raw.split('.')[1] || '').length;
    const isYear = Number.isInteger(to) && to > 1900 && to < 2100;
    return { to, dec, from: isYear ? to - 24 : 0, dur: isYear ? 1400 : 1800 };
  };

  const count = el => {
    const { to, dec, from, dur } = parse(el);
    const t0 = performance.now();
    const step = t => {
      const p = clamp((t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = (from + (to - from) * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      if (target.dataset.count !== undefined) count(target);
      else target.classList.add('in');
      io.unobserve(target);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  if (!still) {
    document.querySelectorAll('[data-count]').forEach(el => {
      const { from, dec } = parse(el);
      el.textContent = from.toFixed(dec);
      io.observe(el);
    });
  }

  /* project cards: tap to open on touch, hover/focus handles the rest */
  const cards = [...document.querySelectorAll('.card')];
  cards.forEach(card => card.addEventListener('click', () => {
    if (fine || !card.classList.contains('top')) return;
    const open = !card.classList.contains('open');
    cards.forEach(c => c.classList.remove('open'));
    card.classList.toggle('open', open);
  }));
  if (still) cards.forEach(c => c.classList.add('top'));

  /* scroll: hero fade + pinned project stack */
  const heroIn = document.querySelector('.hero-in');
  const projects = document.querySelector('.projects');
  const last = cards.length - 1;
  const HOLD = 0.35; // extra scroll, in cards, to rest on the final stack

  const sizeProjects = () => {
    if (still) return;
    projects.style.height = `${innerHeight * (1 + (last + HOLD) * 0.9)}px`;
  };

  const stackCards = () => {
    const vh = innerHeight;
    const r = projects.getBoundingClientRect();
    const pos = clamp(-r.top / (projects.offsetHeight - vh)) * (last + HOLD);
    const small = innerWidth < 640;
    const gap = small ? 10 : 24;                                 // offset between stacked cards
    const w = cards[0].firstElementChild.offsetWidth + (small ? 12 : 20); // card + gap in the row
    const step = w - gap;                                        // how far each card slides to land
    const shift = clamp(pos / last) * last * step;
    // the row slides left; each card stops once it reaches its place on the pile
    const xs = cards.map((_, i) => Math.max(i * gap, i * w - shift));
    const over = cards.map((_, i) => (i ? clamp((w - (xs[i] - xs[i - 1])) / step) : 0));

    cards.forEach((card, i) => {
      const depth = over.slice(i + 1).reduce((a, b) => a + b, 0);
      card.style.transform = `translateX(${xs[i]}px) scale(${Math.max(0.85, 1 - depth * 0.05)})`;
      card.style.setProperty('--dim', Math.min(0.5, depth * 0.18));
      // only uncovered cards can open
      const free = i === last || over[i + 1] < 0.5;
      card.classList.toggle('top', free);
      if (!free) card.classList.remove('open');
    });
  };

  const onScroll = () => {
    if (still) return;
    const h = clamp(scrollY / innerHeight);
    heroIn.style.transform = `scale(${1 - h * 0.12})`;
    heroIn.style.opacity = 1 - h * 1.2;
    stackCards();
  };

  /* custom cursor: grows over text and links, inverting what's beneath */
  if (fine) {
    const dot = document.querySelector('.cursor');
    const grow = 'a, h1, h2, h3, p, dd, dt, time, b, li, .card';
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    document.documentElement.classList.add('has-cursor');

    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      dot.classList.add('on');
      dot.classList.toggle('big', !!e.target.closest?.(grow));
    }, { passive: true });
    document.addEventListener('pointerleave', () => dot.classList.remove('on'));
    addEventListener('pointerdown', () => dot.classList.add('down'));
    addEventListener('pointerup', () => dot.classList.remove('down'));

    const follow = () => {
      cx += (x - cx) * (still ? 1 : 0.22);
      cy += (y - cy) * (still ? 1 : 0.22);
      dot.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  sizeProjects();
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { sizeProjects(); onScroll(); });
  document.fonts?.ready.then(() => { sizeProjects(); onScroll(); });
})();
