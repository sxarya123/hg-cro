(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('motion-enabled');
  requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));


  /* ---------------- Asset fallbacks ---------------- */
  const brand = $('.brand');
  const brandImage = $('.brand img');
  if (brandImage) {
    const markLogoError = () => brand?.classList.add('logo-error');
    const markLogoLoaded = () => brand?.classList.remove('logo-error');
    brandImage.addEventListener('error', markLogoError, { once: true });
    brandImage.addEventListener('load', markLogoLoaded, { once: true });
    if (brandImage.complete) {
      if (brandImage.naturalWidth > 0) markLogoLoaded();
      else markLogoError();
    }
  }

  /* ---------------- Header ---------------- */
  const header = $('#siteHeader');
  if (header) {
    // Read scroll position inside rAF and only touch the DOM when the state flips,
    // so scrolling never triggers a style recalc per event.
    let scrolled = null;
    let headerFrame = 0;
    const applyHeader = () => {
      headerFrame = 0;
      const next = window.scrollY > 16;
      if (next === scrolled) return;
      scrolled = next;
      header.classList.toggle('scrolled', next);
    };
    applyHeader();
    window.addEventListener('scroll', () => {
      if (headerFrame) return;
      headerFrame = requestAnimationFrame(applyHeader);
    }, { passive: true });
  }

  /* ---------------- Cinematic reveal ---------------- */
  const heroEnter = [
    $('.eyebrow-row'),
    $('.hero-copy .kicker'),
    $('.hero-copy h1'),
    $('.hero-summary'),
    $('.hero-stats'),
    $('.purchase-cluster')
  ].filter(Boolean);
  heroEnter.forEach(el => el.classList.add('hero-enter'));
  $('.gallery-shell')?.classList.add('hero-gallery-enter');

  const revealTargets = [
    ...$$('.split-heading'),
    ...$$('.editorial-list article'),
    ...$$('.spec-list article'),
    ...$$('.value-rows article'),
    ...$$('.process-grid article'),
    ...$$('.rc-top'),
    ...$$('.rc-shell'),
    ...$$('.rc-nav'),
    ...$$('.faq-grid'),
    ...$$('.latest-item')
  ];

  revealTargets.forEach((el, index) => {
    el.classList.add('motion-reveal');
    el.dataset.delay = String(index % 4);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -28px' });
    revealTargets.forEach(el => revealObserver.observe(el));
  }

  /* ---------------- Gallery ---------------- */
  // Swap these entries for the real WooCommerce product gallery in production.
  const galleryItems = [
    { label: '01 / Overview', src: '../assets/images/albion/gallery/albion-online-royal-knight.jpg', alt: 'Albion Online account overview' },
    { label: '02 / Combat Progression', src: '../assets/images/albion/gallery/albion-online-red-warrior.jpg', alt: 'Albion Online account combat progression' },
    { label: '03 / Silver & Resources', src: '../assets/images/albion/gallery/albion-online-golden-warrior.jpg', alt: 'Albion Online account silver and resources' },
    { label: '04 / Islands', src: '../assets/images/albion/gallery/albion-online-frost-mage.jpg', alt: 'Albion Online account island infrastructure' }
  ];

  // Warm the remaining frames so switching never shows an empty stage.
  const preloadRest = () => galleryItems.slice(1).forEach(item => { new Image().src = item.src; });
  if ('requestIdleCallback' in window) requestIdleCallback(preloadRest, { timeout: 2200 });
  else setTimeout(preloadRest, 900);

  const galleryMain = $('#galleryMain');
  const galleryLabel = $('#galleryLabel');
  const galleryStage = $('.gallery-stage');
  const thumbs = $$('.thumb');
  let galleryIndex = 0;
  let galleryToken = 0;

  function commitGallery(item, index) {
    if (!galleryMain || !galleryLabel || !galleryStage) return;
    galleryMain.src = item.src;
    galleryMain.alt = item.alt;
    galleryLabel.textContent = item.label;
    thumbs.forEach((thumb, i) => {
      const active = i === index;
      thumb.classList.toggle('active', active);
      if (active) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
    });
    requestAnimationFrame(() => galleryStage.classList.remove('loading'));
  }

  function renderGallery(index) {
    if (!galleryItems.length) return;
    galleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[galleryIndex];
    const token = ++galleryToken;
    galleryStage?.classList.add('loading');

    const preload = new Image();
    preload.onload = () => { if (token === galleryToken) commitGallery(item, galleryIndex); };
    preload.onerror = () => {
      if (token !== galleryToken) return;
      // Fail gracefully: keep the current proof visible and remove loading state.
      galleryStage?.classList.remove('loading');
      console.warn('Gallery image could not be loaded:', item.src);
    };
    preload.src = item.src;
  }

  $('#galleryPrev')?.addEventListener('click', () => renderGallery(galleryIndex - 1));
  $('#galleryNext')?.addEventListener('click', () => renderGallery(galleryIndex + 1));
  thumbs.forEach(btn => btn.addEventListener('click', () => renderGallery(Number(btn.dataset.index))));

  galleryStage?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); renderGallery(galleryIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); renderGallery(galleryIndex + 1); }
    if (event.key === 'Enter') { event.preventDefault(); openLightbox(); }
  });

  let touchStartX = null;
  let touchStartY = null;
  galleryStage?.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });
  galleryStage?.addEventListener('touchend', event => {
    if (touchStartX == null || touchStartY == null) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      renderGallery(galleryIndex + (dx < 0 ? 1 : -1));
    }
    touchStartX = touchStartY = null;
  }, { passive: true });

  /* ---------------- Lightbox ---------------- */
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightboxImage');
  const lightboxCaption = $('#lightboxCaption');
  const lightboxClose = $('#lightboxClose');
  let lastFocused = null;

  function updateLightbox() {
    const item = galleryItems[galleryIndex];
    if (!item || !lightboxImage || !lightboxCaption) return;
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightboxCaption.textContent = item.label;
  }
  function openLightbox() {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    updateLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lightboxClose?.focus();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }
  $('#galleryExpand')?.addEventListener('click', openLightbox);
  lightboxClose?.addEventListener('click', closeLightbox);
  $('#lightboxPrev')?.addEventListener('click', () => { renderGallery(galleryIndex - 1); updateLightbox(); });
  $('#lightboxNext')?.addEventListener('click', () => { renderGallery(galleryIndex + 1); updateLightbox(); });
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });

  window.addEventListener('keydown', event => {
    if (!lightbox?.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') { renderGallery(galleryIndex - 1); updateLightbox(); }
    if (event.key === 'ArrowRight') { renderGallery(galleryIndex + 1); updateLightbox(); }
    if (event.key === 'Tab') {
      // Lightweight focus trap for the three lightbox controls.
      const focusable = [$('#lightboxClose'), $('#lightboxPrev'), $('#lightboxNext')].filter(Boolean);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  /* ---------------- Sticky story ---------------- */
  const storySection = $('.story-section');
  const storyMedia = $('.story-media');
  const storySteps = $$('.story-step');
  const storyImages = $$('.story-image');
  let storyIndex = -1;

  function activateStory(index) {
    if (index === storyIndex) return;
    storyIndex = index;
    storySteps.forEach((step, i) => step.classList.toggle('active', i === index));
    storyImages.forEach((image, i) => image.classList.toggle('active', i === index));
  }

  /* An IntersectionObserver only reports the steps whose visibility *changed*, so the
     step with the largest ratio overall is often absent from the callback and the
     image ends up paired with the wrong copy. Measuring every step against a fixed
     reference line keeps the pair exact at any scroll position or speed. */
  function storyReferenceLine() {
    if (!storyMedia) return window.innerHeight / 2;
    const box = storyMedia.getBoundingClientRect();
    // Stacked layout pins the image over the top of the viewport, so the copy being
    // read sits in the space underneath it; side-by-side layout reads at image centre.
    return window.matchMedia('(max-width:1050px)').matches
      ? (box.bottom + window.innerHeight) / 2
      : box.top + box.height / 2;
  }

  function syncStory() {
    if (!storySteps.length) return;
    const line = storyReferenceLine();
    let nearest = 0;
    let shortest = Infinity;
    storySteps.forEach((step, i) => {
      const box = step.getBoundingClientRect();
      const distance = Math.abs(box.top + box.height / 2 - line);
      if (distance < shortest) { shortest = distance; nearest = i; }
    });
    activateStory(nearest);
  }

  if (storySteps.length) {
    let storyFrame = 0;
    const queueSync = () => {
      if (storyFrame) return;
      storyFrame = requestAnimationFrame(() => { storyFrame = 0; syncStory(); });
    };
    activateStory(0);

    if ('IntersectionObserver' in window && storySection) {
      // Only listen while the section is on screen.
      let listening = false;
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting === listening) return;
        listening = entry.isIntersecting;
        if (listening) { window.addEventListener('scroll', queueSync, { passive: true }); queueSync(); }
        else window.removeEventListener('scroll', queueSync);
      }, { rootMargin: '120px 0px 120px 0px' }).observe(storySection);
    } else {
      window.addEventListener('scroll', queueSync, { passive: true });
    }

    window.addEventListener('resize', queueSync, { passive: true });
    window.addEventListener('load', queueSync);
  }

  /* ---------------- Product section nav ---------------- */
  const subnavLinks = $$('.subnav-track a');
  const subnavTrack = $('.subnav-track');
  const targetSections = subnavLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);

  // The active pill is centred by moving the rail itself. Using scrollIntoView here
  // would ask the browser to scroll an ancestor mid-gesture and stalls the page scroll.
  function centerActiveLink(activeLink) {
    if (!subnavTrack || !activeLink) return;
    const overflow = subnavTrack.scrollWidth - subnavTrack.clientWidth;
    if (overflow <= 1) return;
    const target = activeLink.offsetLeft - (subnavTrack.clientWidth - activeLink.offsetWidth) / 2;
    const next = Math.max(0, Math.min(overflow, target));
    if (Math.abs(next - subnavTrack.scrollLeft) < 6) return;
    subnavTrack.scrollLeft = next;
  }

  if ('IntersectionObserver' in window) {
    let navFrame = 0;
    const navObserver = new IntersectionObserver(entries => {
      const current = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      const hash = `#${current.target.id}`;
      let activeLink = null;
      subnavLinks.forEach(link => {
        const active = link.getAttribute('href') === hash;
        link.classList.toggle('active', active);
        if (active) activeLink = link;
      });
      cancelAnimationFrame(navFrame);
      navFrame = requestAnimationFrame(() => centerActiveLink(activeLink));
    }, { rootMargin: '-24% 0px -62% 0px', threshold: [0, 0.1] });
    targetSections.forEach(section => navObserver.observe(section));
  }

  /* ---------------- Anchor scrolling ----------------
     Eased only for in-page link clicks, and abandoned the moment the visitor
     scrolls themselves, so a gesture is never fighting an animation. */
  const stickyOffset = () => {
    const headerHeight = header ? header.offsetHeight : 0;
    const subnav = $('.product-subnav');
    return headerHeight + (subnav ? subnav.offsetHeight : 0) + 12;
  };

  let glideFrame = 0;
  function glideTo(top) {
    cancelAnimationFrame(glideFrame);
    const start = window.scrollY;
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    const end = Math.max(0, Math.min(limit, top));
    const distance = end - start;
    if (Math.abs(distance) < 2) return;
    const duration = Math.min(820, Math.max(360, Math.abs(distance) * 0.42));
    const startedAt = performance.now();
    let cancelled = false;
    const release = () => { cancelled = true; };
    // Any real input wins over the animation.
    window.addEventListener('wheel', release, { passive: true, once: true });
    window.addEventListener('touchstart', release, { passive: true, once: true });
    window.addEventListener('keydown', release, { once: true });

    const step = now => {
      if (cancelled) return;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, start + distance * eased);
      if (progress < 1) glideFrame = requestAnimationFrame(step);
      else { window.removeEventListener('wheel', release); window.removeEventListener('touchstart', release); window.removeEventListener('keydown', release); }
    };
    glideFrame = requestAnimationFrame(step);
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    const destination = document.getElementById(hash.slice(1));
    if (!destination) return;
    event.preventDefault();
    const top = destination.getBoundingClientRect().top + window.scrollY - stickyOffset();
    if (reduceMotion) window.scrollTo(0, Math.max(0, top));
    else glideTo(top);
    history.replaceState(null, '', hash);
  });

  /* ---------------- Reviews — cinematic quote carousel (shared with homepage) ---------------- */
  $$('.reviews-cinema').forEach(section => {
    const quotes = $$('.rc-quote', section);
    if (!quotes.length) return;
    const dots = $$('.rc-dot', section);
    const current = $('[data-rc-current]', section);
    const total = $('[data-rc-total]', section);
    const stage = $('.rc-stage', section);
    const pad = n => String(n).padStart(2, '0');
    let index = 0;
    let timer = 0;

    if (total) total.textContent = pad(quotes.length);

    const show = n => {
      index = (n + quotes.length) % quotes.length;
      quotes.forEach((quote, i) => {
        const on = i === index;
        quote.classList.toggle('is-active', on);
        quote.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach((dot, i) => {
        const on = i === index;
        dot.classList.toggle('is-active', on);
        dot.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (current) current.textContent = pad(index + 1);
    };
    const stop = () => { clearInterval(timer); timer = 0; };
    const play = () => { stop(); if (!reduceMotion) timer = setInterval(() => show(index + 1), 4500); };
    const go = n => { show(n); play(); };

    dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
    section.addEventListener('mouseenter', stop);
    section.addEventListener('mouseleave', play);
    section.addEventListener('focusin', stop);
    section.addEventListener('focusout', play);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));

    if (stage) {
      let startX = null;
      stage.addEventListener('pointerdown', event => { startX = event.clientX; });
      stage.addEventListener('pointerup', event => {
        if (startX === null) return;
        const delta = event.clientX - startX;
        startX = null;
        if (Math.abs(delta) > 45) go(delta < 0 ? index + 1 : index - 1);
      });
      stage.addEventListener('pointercancel', () => { startX = null; });
    }

    show(0);
    play();
  });

  /* ---------------- FAQ ---------------- */
  $$('.faq-item').forEach(item => {
    const button = $('button', item);
    const answer = $('.faq-answer', item);
    if (!button || !answer) return;
    button.addEventListener('click', () => {
      const open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      answer.style.maxHeight = open ? `${answer.scrollHeight}px` : '0px';
    });
  });
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      $$('.faq-item.open .faq-answer').forEach(answer => { answer.style.maxHeight = `${answer.scrollHeight}px`; });
      updateMobileBuy();
    }, 120);
  }, { passive: true });

  /* ---------------- Mobile sticky buy ---------------- */
  const mobileBuy = $('#mobileBuy');
  const mainPurchase = $('.purchase-cluster');
  const finalCta = $('#finalCta');
  let mainPurchaseVisible = true;
  let finalVisible = false;
  function updateMobileBuy() {
    if (!mobileBuy) return;
    const show = window.innerWidth <= 760 && !mainPurchaseVisible && !finalVisible && !lightbox?.classList.contains('open');
    mobileBuy.classList.toggle('show', show);
  }
  if ('IntersectionObserver' in window && mainPurchase) {
    new IntersectionObserver(entries => {
      mainPurchaseVisible = entries[0]?.isIntersecting ?? true;
      updateMobileBuy();
    }, { threshold: 0.18 }).observe(mainPurchase);
  }
  if ('IntersectionObserver' in window && finalCta) {
    new IntersectionObserver(entries => {
      finalVisible = entries[0]?.isIntersecting ?? false;
      updateMobileBuy();
    }, { threshold: 0.08 }).observe(finalCta);
  }

  /* ---------------- Checkout hook ---------------- */
  const toast = $('#croToast');
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  // Production integration point:
  // set window.HG_CHECKOUT_URL from WooCommerce or replace this handler with add-to-cart logic.
  $$('.js-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!reduceMotion && typeof btn.animate === 'function') {
        btn.animate(
          [
            { transform: 'translateY(0) scale(1)' },
            { transform: 'translateY(1px) scale(.985)' },
            { transform: 'translateY(0) scale(1)' }
          ],
          { duration: 220, easing: 'ease-out' }
        );
      }
      const checkoutUrl = window.HG_CHECKOUT_URL || '';
      if (checkoutUrl) window.location.assign(checkoutUrl);
      else showToast('Prototype ready: connect this CTA to the real WooCommerce checkout URL.');
    });
  });

  updateMobileBuy();
})();
