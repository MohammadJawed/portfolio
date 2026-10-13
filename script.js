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
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => card.addEventListener('click', () => {
    if (fine) return;
    const open = !card.classList.contains('open');
    cards.forEach(c => c.classList.remove('open'));
    card.classList.toggle('open', open);
  }));

  /* scroll: hero fade + pinned horizontal projects */
  const heroIn = document.querySelector('.hero-in');
  const projects = document.querySelector('.projects');
  const track = document.querySelector('.track');

  const sizeProjects = () => {
    projects.style.height = `${track.scrollWidth - innerWidth + innerHeight}px`;
  };

  const onScroll = () => {
    const vh = innerHeight;
    if (!still) {
      const h = clamp(scrollY / vh);
      heroIn.style.transform = `scale(${1 - h * 0.12})`;
      heroIn.style.opacity = 1 - h * 1.2;
    }
    const p = projects.getBoundingClientRect();
    const prog = clamp(-p.top / (projects.offsetHeight - vh));
    const run = Math.max(0, parseFloat(projects.style.height) - vh);
    track.style.transform = `translateX(${-prog * run}px)`;
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
