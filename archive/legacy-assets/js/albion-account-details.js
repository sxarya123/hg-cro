(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header: hamburger menu plus dropdowns that act as accordions on mobile
  const nav = document.getElementById('nav');
  const menuBtn = document.getElementById('menuBtn');

  const closeSubmenus = () => {
    nav.querySelectorAll('.has-menu.open').forEach(item => {
      item.classList.remove('open');
      item.querySelector('.mega-toggle').setAttribute('aria-expanded', 'false');
    });
  };

  menuBtn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuBtn.textContent = isOpen ? '×' : '☰';
    if (!isOpen) closeSubmenus();
  });

  nav.querySelectorAll('.mega-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const item = toggle.closest('.has-menu');
      const wasOpen = item.classList.contains('open');
      closeSubmenus();
      if (!wasOpen) {
        item.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Reveal
  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(x => x.classList.add('in'));
  } else {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          ro.unobserve(e.target);
        }
      });
    }, {threshold:.12, rootMargin:'0px 0px -40px'});
    reveals.forEach(x => ro.observe(x));
  }

  // Hero parallax
  const heroImg = document.querySelector('.hero-image img');
  let ticking = false;
  function parallax(){
    if (!heroImg || reduce) return;
    const y = Math.min(scrollY, innerHeight);
    heroImg.style.transform = `translate3d(0,${y*.052}px,0) scale(1.065)`;
    ticking = false;
  }
  addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(parallax);
      ticking = true;
    }
  }, {passive:true});

  // Sticky account story
  const steps = [...document.querySelectorAll('.story-step')];
  const media = [...document.querySelectorAll('.story-media figure')];
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const i = Number(e.target.dataset.step);
        steps.forEach((x,j) => x.classList.toggle('active', j === i));
        media.forEach((x,j) => x.classList.toggle('active', j === i));
      });
    }, {threshold:.55});
    steps.forEach(x => so.observe(x));
  }

  /* Reviews — cinematic quote carousel (shared with homepage + listing) */
  document.querySelectorAll('.reviews-cinema').forEach(section => {
    const quotes = [...section.querySelectorAll('.rc-quote')];
    if (!quotes.length) return;
    const dots = [...section.querySelectorAll('.rc-dot')];
    const current = section.querySelector('[data-rc-current]');
    const total = section.querySelector('[data-rc-total]');
    const stage = section.querySelector('.rc-stage');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pad = n => String(n).padStart(2, '0');
    let i = 0, timer = 0;

    if (total) total.textContent = pad(quotes.length);

    const show = n => {
      i = (n + quotes.length) % quotes.length;
      quotes.forEach((q, j) => {
        const on = j === i;
        q.classList.toggle('is-active', on);
        q.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach((d, j) => {
        const on = j === i;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (current) current.textContent = pad(i + 1);
    };
    const stop = () => { clearInterval(timer); timer = 0; };
    const play = () => { stop(); if (!still) timer = setInterval(() => show(i + 1), 4500); };
    const go = n => { show(n); play(); };

    dots.forEach((d, j) => d.addEventListener('click', () => go(j)));
    section.addEventListener('mouseenter', stop);
    section.addEventListener('mouseleave', play);
    section.addEventListener('focusin', stop);
    section.addEventListener('focusout', play);

    // Swipe on touch devices
    if (stage) {
      let sx = null;
      stage.addEventListener('pointerdown', e => { sx = e.clientX; });
      stage.addEventListener('pointerup', e => {
        if (sx === null) return;
        const dx = e.clientX - sx;
        sx = null;
        if (Math.abs(dx) > 45) go(dx < 0 ? i + 1 : i - 1);
      });
      stage.addEventListener('pointercancel', () => { sx = null; });
    }

    show(0);
    play();
  });

  // FAQ
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
    });
  });
  addEventListener('resize', () => {
    document.querySelectorAll('.faq-item.open .faq-a').forEach(a => a.style.maxHeight = a.scrollHeight + 'px');
  });

  // Floating buy dock — show once the hero CTA has scrolled out of view
  const dock = document.getElementById('buyDock');
  const hero = document.getElementById('hero');

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => {
      dock.classList.toggle('show', !e[0].isIntersecting);
    }, {threshold:.08}).observe(hero);
  }

  // Demo CTA: replace with WooCommerce add-to-cart / checkout integration
  document.querySelectorAll('.js-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.animate(
        [{transform:'scale(1)'},{transform:'scale(.98)'},{transform:'scale(1)'}],
        {duration:230,easing:'ease-out'}
      );
      alert('Demo CTA: connect this to the live WooCommerce purchase / checkout action.');
    });
  });
})();
