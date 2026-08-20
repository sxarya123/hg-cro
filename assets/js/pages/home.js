(() => {
  const nav = document.getElementById("nav");
  const menuBtn = document.getElementById("menuBtn");
  const header = document.getElementById("siteHeader");
  const closeSubmenus = () => {
    nav.querySelectorAll(".has-menu.open").forEach((item) => {
      item.classList.remove("open");
      item
        .querySelector(".mega-toggle")
        .setAttribute("aria-expanded", "false");
    });
  };

  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    menuBtn.textContent = isOpen ? "×" : "☰";
    if (!isOpen) closeSubmenus();
  });

  // Desktop opens the dropdowns on hover; this chevron drives the mobile
  // accordion while leaving the parent link tappable.
  nav.querySelectorAll(".mega-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const item = toggle.closest(".has-menu");
      const wasOpen = item.classList.contains("open");
      closeSubmenus();
      if (!wasOpen) {
        item.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });
  });

  window.addEventListener(
    "scroll",
    () => header.classList.toggle("scrolled", window.scrollY > 8),
    { passive: true },
  );

  const routes = {
    wos: "https://heaven-guardian.com/whiteout-survival-accounts/",
    rok: "https://heaven-guardian.com/rok-accounts-for-sale/",
    kingshot: "https://heaven-guardian.com/kingshot-account-for-sale/",
    lastwar: "https://heaven-guardian.com/last-war-account-for-sale/",
    albion: "pages/albion-online-accounts.html",
    cod: "https://heaven-guardian.com/call-of-dragons-account-for-sale/",
    mlbb: "https://heaven-guardian.com/buy-mobile-legends-account/",
  };

  document.getElementById("finder").addEventListener("submit", (e) => {
    e.preventDefault();
    const game = document.getElementById("gameSelect").value;
    const note = document.getElementById("finderNote");
    if (!game || !routes[game]) {
      note.textContent =
        "Choose a game first so we can open the right account marketplace.";
      note.classList.add("show");
      return;
    }
    note.textContent = "Opening the selected game marketplace...";
    note.classList.add("show");
    track("account_finder_submit", { game });
    setTimeout(() => (window.location.href = routes[game]), 250);
  });

  // Ethical urgency: use real order/view/seller data in production.
  // Demo mode can be previewed by opening this file with ?demo=1.
  const demoMode =
    new URLSearchParams(window.location.search).get("demo") === "1";
  if (demoMode) {
    document
      .querySelectorAll(".interest-line")
      .forEach((el) => el.classList.add("show"));
  }

  const activityToast = document.getElementById("activityToast");
  const activityTitle = document.getElementById("activityTitle");
  const activityMeta = document.getElementById("activityMeta");
  const activityClose = document.getElementById("activityClose");
  let activityTimer = null;
  let activityIndex = 0;

  const realActivity = Array.isArray(window.HG_ACTIVITY_EVENTS)
    ? window.HG_ACTIVITY_EVENTS
    : [];
  const demoActivity = [
    {
      title:
        "Demo: buyer in Germany purchased a Rise of Kingdoms account",
      meta: "Example only - connect this component to verified order data",
    },
    {
      title: "Demo: a Whiteout Survival account was reserved",
      meta: "Example only - never fabricate scarcity on the live site",
    },
    {
      title: "Demo: seller is online and ready to transfer",
      meta: "Example only - online state must come from real seller presence",
    },
  ];
  const activityEvents = realActivity.length
    ? realActivity
    : demoMode
      ? demoActivity
      : [];

  function showActivityEvent(evt) {
    if (!evt || !activityToast) return;
    activityTitle.textContent = evt.title || "Marketplace activity";
    activityMeta.textContent = evt.meta || "Verified marketplace event";
    activityToast.classList.add("show");
    clearTimeout(activityTimer);
    activityTimer = setTimeout(
      () => activityToast.classList.remove("show"),
      5600,
    );
  }

  function cycleActivity() {
    if (!activityEvents.length) return;
    showActivityEvent(
      activityEvents[activityIndex % activityEvents.length],
    );
    activityIndex += 1;
    setTimeout(cycleActivity, 13000);
  }

  activityClose?.addEventListener("click", () =>
    activityToast.classList.remove("show"),
  );
  if (activityEvents.length) setTimeout(cycleActivity, 3500);

  const pills = [...document.querySelectorAll(".pill")];
  const cards = [...document.querySelectorAll(".product-card")];
  pills.forEach((pill) =>
    pill.addEventListener("click", () => {
      const filter = pill.dataset.filter;
      pills.forEach((p) => p.classList.toggle("active", p === pill));
      cards.forEach(
        (card) =>
          (card.hidden =
            filter !== "all" && card.dataset.game !== filter),
      );
      track("featured_filter", { filter });
      syncSliderNav();
    }),
  );

  const sliderBtns = [...document.querySelectorAll("[data-slide]")];

  function syncSliderNav() {
    sliderBtns.forEach((btn) => {
      const track = document.getElementById(btn.dataset.target);
      if (!track) return;
      const max = track.scrollWidth - track.clientWidth - 2;
      const x = track.scrollLeft;
      btn.disabled =
        max <= 0 || (btn.dataset.slide === "prev" ? x <= 0 : x >= max);
    });
  }

  if (sliderBtns.length) {
    sliderBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        const track = document.getElementById(btn.dataset.target);
        if (!track) return;
        const slide = [...track.children].find((el) => !el.hidden);
        const gap = parseFloat(getComputedStyle(track).columnGap) || 18;
        const step = slide
          ? slide.getBoundingClientRect().width + gap
          : track.clientWidth * 0.85;
        track.scrollBy({
          left: btn.dataset.slide === "next" ? step : -step,
          behavior: "smooth",
        });
      }),
    );
    [
      ...new Set(
        sliderBtns
          .map((btn) => document.getElementById(btn.dataset.target))
          .filter(Boolean),
      ),
    ].forEach((track) =>
      track.addEventListener("scroll", syncSliderNav, { passive: true }),
    );
    window.addEventListener("resize", syncSliderNav);
    syncSliderNav();
  }

  const animatedStats = [
    ...document.querySelectorAll("[data-count-to],[data-fill-to]"),
  ];
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function formatCount(value, decimals) {
    return decimals
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("en-US");
  }

  function runCounter(el) {
    const target = parseFloat(el.dataset.countTo);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (!isFinite(target) || reducedMotion) {
      el.textContent = formatCount(target || 0, decimals);
      return;
    }
    const duration = 1500;
    const started = performance.now();
    const step = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCount(target * eased, decimals);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function playStat(el) {
    const play = () => {
      if (el.dataset.fillTo) {
        el.style.width = el.dataset.fillTo + "%";
        return;
      }
      runCounter(el);
    };
    // Wait out the reveal of whatever wrapper this stat sits in, so the
    // number starts climbing only once it is actually on screen.
    const host = el.closest("[data-reveal]");
    const wait = host
      ? parseFloat(
          getComputedStyle(host).getPropertyValue("--reveal-delay"),
        ) * 1000
      : 0;
    if (wait > 0) window.setTimeout(play, wait);
    else play();
  }

  if (animatedStats.length) {
    if ("IntersectionObserver" in window) {
      const statObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            playStat(entry.target);
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.4 },
      );
      animatedStats.forEach((el) => statObserver.observe(el));
    } else {
      animatedStats.forEach(playStat);
    }
  }

  // Card grids stagger their children. Groups are observed as a whole so
  // cards parked off-screen inside the sliders still get revealed.
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    const variant = group.dataset.revealGroup || "up";
    const step = parseFloat(group.dataset.revealStep || "0.09");
    const cap = parseFloat(group.dataset.revealMax || "0.6");
    [...group.children].forEach((child, index) => {
      if (child.hasAttribute("data-reveal")) return;
      child.setAttribute("data-reveal", variant);
      child.dataset.revealGrouped = "1";
      child.style.setProperty(
        "--reveal-delay",
        Math.min(index * step, cap) + "s",
      );
    });
  });

  function reveal(el) {
    el.classList.add("is-visible");
    // Drop the hook once played so hover transforms and transitions on
    // cards behave exactly as they would without the reveal system.
    window.setTimeout(() => el.removeAttribute("data-reveal"), 1800);
  }

  function revealGroup(group) {
    [...group.children].forEach((child) => {
      if (child.dataset.revealGrouped) reveal(child);
    });
  }

  const revealSingles = [
    ...document.querySelectorAll("[data-reveal]"),
  ].filter(
    (el) => !el.dataset.revealGrouped && !el.closest("[data-reveal-now]"),
  );
  const revealGroups = [
    ...document.querySelectorAll("[data-reveal-group]"),
  ];
  const revealImmediate = [
    ...document.querySelectorAll("[data-reveal-now] [data-reveal]"),
  ];

  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target.hasAttribute("data-reveal-group")) {
            revealGroup(entry.target);
          } else {
            reveal(entry.target);
          }
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    revealSingles.forEach((el) => revealObserver.observe(el));
    revealGroups.forEach((el) => revealObserver.observe(el));
    // Above-the-fold content plays right away instead of waiting for
    // scroll. Two frames so the starting state is painted first.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => revealImmediate.forEach(reveal)),
    );
  } else {
    [...revealSingles, ...revealImmediate].forEach(reveal);
    revealGroups.forEach(revealGroup);
  }

  const timeline = document.getElementById("protectionTimeline");
  if (timeline) {
    if ("IntersectionObserver" in window) {
      const tlObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("tl-run");
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.3 },
      );
      tlObserver.observe(timeline);
    } else {
      timeline.classList.add("tl-run");
    }
  }

  const brushHeadings = [...document.querySelectorAll(".brush")];
  if (brushHeadings.length) {
    if ("IntersectionObserver" in window) {
      const brushObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("inked");
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.6 },
      );
      brushHeadings.forEach((el) => brushObserver.observe(el));
    } else {
      brushHeadings.forEach((el) => el.classList.add("inked"));
    }
  }

  function track(event, data = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
    console.info("[CRO event]", event, data);
  }
  window.track = track;

  document.querySelectorAll(".track").forEach((el) => {
    el.addEventListener("click", () =>
      track(el.dataset.event || "cta_click", {
        href: el.getAttribute("href"),
      }),
    );
  });

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

  // iOS Safari ignores user-scalable=no, so block pinch gestures directly.
  ["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
    document.addEventListener(type, (e) => e.preventDefault(), {
      passive: false,
    });
  });
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false },
  );
})();
