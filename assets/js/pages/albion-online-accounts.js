(() => {
  const ALBION_LOGO = "../assets/images/games/artwork/albion-online-characters.png";
  const PDP_URL = "albion-online-account-detail.html";

  /* ---------- Header ---------- */
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

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ---------- Concave cinema-screen curve for the hero strip ---------- */
  const stage = document.querySelector(".strip-stage");
  const stripTrack = document.querySelector(".strip-track");
  if (stage && stripTrack) {
    const panels = [...stripTrack.children];
    // Panels sit on the inside of a cylinder: the further from centre,
    // the closer they lean towards the viewer.
    let maxAngle = 44;
    let depth = 145;
    let centers = [];
    let frame = 0;

    // Layout offsets and curve strength are cached; only the track's live
    // position is read each frame, so the loop costs one measurement.
    function measure() {
      centers = panels.map((p) => p.offsetLeft + p.offsetWidth / 2);
      const css = getComputedStyle(stage);
      maxAngle =
        parseFloat(css.getPropertyValue("--curve-angle")) || maxAngle;
      depth = parseFloat(css.getPropertyValue("--curve-depth")) || depth;
    }

    function curve() {
      const stageBox = stage.getBoundingClientRect();
      const trackBox = stripTrack.getBoundingClientRect();
      const half = stageBox.width / 2 || 1;
      const trackX = trackBox.left - stageBox.left;
      panels.forEach((panel, i) => {
        const t = Math.max(
          -1,
          Math.min(1, (trackX + centers[i] - half) / half),
        );
        const a = Math.abs(t);
        // translateZ before rotateY: the panel steps straight towards the
        // viewer and pivots in place, so its column keeps its gap. The
        // reverse order swings it sideways and closes the gap.
        panel.style.transform = `translateZ(${(a * depth).toFixed(1)}px) rotateY(${(-t * maxAngle).toFixed(2)}deg)`;
      });
    }

    function loop() {
      curve();
      frame = requestAnimationFrame(loop);
    }

    const start = () => {
      if (frame) return;
      measure();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    window.addEventListener("resize", () => {
      measure();
      curve();
    });

    if (reducedMotion) {
      measure();
      curve();
    } else if ("IntersectionObserver" in window) {
      // No point recalculating the curve once the hero is out of view.
      new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => (e.isIntersecting ? start() : stop())),
        { threshold: 0 },
      ).observe(stage);
    } else {
      start();
    }
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

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    q.addEventListener("click", () => {
      const open = !item.classList.contains("open");
      item.classList.toggle("open", open);
      q.setAttribute("aria-expanded", open ? "true" : "false");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
    });
  });
  addEventListener("resize", () => {
    document
      .querySelectorAll(".faq-item.open .faq-a")
      .forEach((a) => (a.style.maxHeight = a.scrollHeight + "px"));
  });

  /* ---------- Marketplace data ---------- */
  const desktopFilters = document.getElementById("desktopFilters");
  const mobileFilters = document.getElementById("mobileFilters");
  const productGrid = document.getElementById("productGrid");
  const resultCount = document.getElementById("resultCount");
  const activeFilters = document.getElementById("activeFilters");
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const sortSelect = document.getElementById("sortSelect");
  const filterBadge = document.getElementById("filterBadge");
  const openFilters = document.getElementById("openFilters");
  const closeFilters = document.getElementById("closeFilters");
  const applyFilters = document.getElementById("applyFilters");
  const filterDrawer = document.getElementById("filterDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const pagination = document.getElementById("pagination");
  // PROTOTYPE INVENTORY: replace with live listing data before publishing.
  const products = [
    {id:1,region:"Europe",fame:1800,silver:165,lp:2500,price:692,tags:["PvP Ready","High Fame"],spec:"Quarterstaffs · Daggers · Mystics",gather:"T8",newness:18},
    {id:2,region:"Europe",fame:1800,silver:106,lp:2500,price:1064,tags:["Gathering","Economy"],spec:"All Tools · All Armors",gather:"T8",newness:17},
    {id:3,region:"Europe",fame:1400,silver:865,lp:1900,price:665,tags:["High Silver","Crossbows"],spec:"Leather · Plate · Crossbows",gather:"T7",newness:16},
    {id:4,region:"Europe",fame:1900,silver:570,lp:1600,price:570,tags:["Balanced","Warrior Glory"],spec:"Clothes · Leather · Plate",gather:"T8",newness:15},
    {id:5,region:"Europe",fame:48,silver:532,lp:980,price:532,tags:["Skiller","Miner"],spec:"Miner · Skinner · Fiber",gather:"T8",newness:14},
    {id:6,region:"Asia",fame:1900,silver:603,lp:1200,price:603,tags:["Island","High Fame"],spec:"Island · Tools · Fame",gather:"T8",newness:13},
    {id:7,region:"Asia",fame:18,silver:382,lp:1300,price:382,tags:["Economy","Low Price"],spec:"Laborers · Islands · Tools",gather:"T8",newness:12},
    {id:8,region:"America",fame:2600,silver:1608,lp:900,price:1608,tags:["Ultra Fame","All Professions"],spec:"Almost all Weapons · Professions",gather:"T8",newness:11},
    {id:9,region:"America",fame:3000,silver:3013,lp:1500,price:3013,tags:["Collector","Endgame"],spec:"All Armors · All Weapons",gather:"T8",newness:10},
    {id:10,region:"Europe",fame:1858,silver:1234,lp:1100,price:1234,tags:["Druid","Frost"],spec:"Fire · Druid · Frost · Blood",gather:"T7",newness:9},
    {id:11,region:"Europe",fame:500,silver:604,lp:2100,price:604,tags:["Learning Points","All Gear"],spec:"Bows · Axes · Fire · Frost",gather:"T7",newness:8},
    {id:12,region:"America",fame:2458,silver:1992,lp:1300,price:1992,tags:["Tomes","Mixed Spec"],spec:"Tomes · Silver · Mixed Spec",gather:"T8",newness:7},
    {id:13,region:"Europe",fame:792,silver:554,lp:900,price:554,tags:["Druid","Armor"],spec:"Druid · Armor · All Tools",gather:"T8",newness:6},
    {id:14,region:"Europe",fame:250,silver:1291,lp:820,price:1291,tags:["Island","Silver"],spec:"Priest · Island · Armor",gather:"T7",newness:5},
    {id:15,region:"America",fame:18,silver:739,lp:740,price:739,tags:["Leather","Island"],spec:"Leather · Islands · Silver",gather:"T7",newness:4},
    {id:16,region:"Europe",fame:250,silver:702,lp:650,price:702,tags:["Gathering","Tools"],spec:"All T8 Tools · Armor",gather:"T8",newness:3},
    {id:17,region:"America",fame:260,silver:485,lp:500,price:485,tags:["Tomes","Learning Points"],spec:"Tomes · LP · Progression",gather:"T6",newness:2},
    {id:18,region:"America",fame:150,silver:402,lp:1000,price:402,tags:["Leather","Budget"],spec:"Leather · Progression",gather:"T7",newness:1},
  ];

  const state = {
    search: "",
    sort: "recommended",
    regions: new Set(),
    maxPrice: 3200,
    minFame: 0,
    tags: new Set(),
  };

  const filterMarkup = () => `
    <div class="filter-group">
      <div class="filter-title">Server</div>
      <div class="checks">
        ${["Europe", "America", "Asia"]
          .map(
            (r) =>
              `<label class="check"><span class="check-left"><input type="checkbox" data-filter="region" value="${r}" ${state.regions.has(r) ? "checked" : ""}><span>${r}</span></span><small>${products.filter((p) => p.region === r).length}</small></label>`,
          )
          .join("")}
      </div>
    </div>
    <div class="filter-group">
      <div class="filter-title">Maximum price</div>
      <input type="range" min="400" max="3200" step="100" value="${state.maxPrice}" data-filter="price">
      <div class="range-labels"><span>€400</span><b class="price-label">€${state.maxPrice.toLocaleString()}</b></div>
    </div>
    <div class="filter-group">
      <div class="filter-title">Minimum fame</div>
      <div class="filter-pill-grid">
        ${[[0, "Any"],[250, "250M+"],[500, "500M+"],[1000, "1B+"],[1800, "1.8B+"]]
          .map(
            ([v, l]) =>
              `<button class="filter-pill ${state.minFame === v ? "active" : ""}" data-filter="fame" data-value="${v}">${l}</button>`,
          )
          .join("")}
      </div>
    </div>
    <div class="filter-group">
      <div class="filter-title">Playstyle</div>
      <div class="filter-pill-grid">
        ${["PvP Ready", "Gathering", "Economy", "High Silver", "Learning Points"]
          .map(
            (t) =>
              `<button class="filter-pill ${state.tags.has(t) ? "active" : ""}" data-filter="tag" data-value="${t}">${t}</button>`,
          )
          .join("")}
      </div>
    </div>`;

  function syncFilters() {
    desktopFilters.innerHTML = filterMarkup();
    mobileFilters.innerHTML = filterMarkup();
    bindFilters();
  }

  function bindFilters() {
    document
      .querySelectorAll('[data-filter="region"]')
      .forEach((el) =>
        el.addEventListener("change", (e) => {
          e.target.checked
            ? state.regions.add(e.target.value)
            : state.regions.delete(e.target.value);
          syncFilters();
          render();
        }),
      );
    // Kept out of syncFilters() so dragging the slider never rebuilds the
    // markup underneath the user's thumb.
    document.querySelectorAll('[data-filter="price"]').forEach((el) =>
      el.addEventListener("input", (e) => {
        state.maxPrice = Number(e.target.value);
        document
          .querySelectorAll('[data-filter="price"]')
          .forEach((r) => (r.value = state.maxPrice));
        document
          .querySelectorAll(".price-label")
          .forEach(
            (b) => (b.textContent = `€${state.maxPrice.toLocaleString()}`),
          );
        render();
      }),
    );
    document.querySelectorAll('[data-filter="fame"]').forEach((el) =>
      el.addEventListener("click", () => {
        state.minFame = Number(el.dataset.value);
        syncFilters();
        render();
      }),
    );
    document.querySelectorAll('[data-filter="tag"]').forEach((el) =>
      el.addEventListener("click", () => {
        const t = el.dataset.value;
        state.tags.has(t) ? state.tags.delete(t) : state.tags.add(t);
        syncFilters();
        render();
      }),
    );
    document
      .querySelectorAll("[data-reset]")
      .forEach((btn) => (btn.onclick = resetFilters));
  }

  function resetFilters() {
    state.regions.clear();
    state.maxPrice = 3200;
    state.minFame = 0;
    state.tags.clear();
    state.search = "";
    searchInput.value = "";
    searchClear.style.display = "none";
    syncFilters();
    render();
  }

  function filteredProducts() {
    const list = products.filter((p) => {
      const hay =
        `${p.region} ${p.spec} ${p.tags.join(" ")} ${p.gather} gathering ${p.fame}m fame ${p.silver}m silver ${p.lp} learning points`.toLowerCase();
      const tokens = state.search.toLowerCase().split(/\s+/).filter(Boolean);
      return (
        (!tokens.length || tokens.every((token) => hay.includes(token))) &&
        (!state.regions.size || state.regions.has(p.region)) &&
        p.price <= state.maxPrice &&
        p.fame >= state.minFame &&
        (!state.tags.size ||
          [...state.tags].every((t) => p.tags.includes(t)))
      );
    });
    const sorters = {
      recommended: (a, b) =>
        b.fame / Math.max(b.price, 1) +
        b.newness * 0.01 -
        (a.fame / Math.max(a.price, 1) + a.newness * 0.01),
      newest: (a, b) => b.newness - a.newness,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "fame-desc": (a, b) => b.fame - a.fame,
    };
    return list.sort(sorters[state.sort]);
  }

  const formatFame = (v) =>
    v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}B` : `${v}M`;

  const statRow = (icon, value, label) =>
    `<div class="stat"><b><i class="stat-ico"><svg><use href="#ico-${icon}" /></svg></i>${value}</b><span>${label}</span></div>`;

  function card(p, index) {
    return `<article class="product-card" data-card-reveal style="transition-delay:${Math.min(index, 8) * 40}ms">
      <div class="product-media">
        <div class="badges"><span class="badge-soft badge-region">${p.region}</span><span class="badge-soft badge-verified">✓ Verified</span></div>
        <div class="avatar"><img src="${ALBION_LOGO}" alt="Albion Online" loading="lazy" /></div>
        <div class="media-meta"><b>${formatFame(p.fame)} Fame</b><span>${p.gather} progression · ${p.tags[0]}</span></div>
      </div>
      <div class="product-body">
        <h3 class="product-title">${p.spec}</h3>
        <div class="stats">
          ${statRow("fame", formatFame(p.fame), "Total Fame")}
          ${statRow("silver", `${p.silver}M`, "Silver")}
          ${statRow("lp", p.lp.toLocaleString(), "Learning Points")}
          ${statRow("gather", p.gather, "Gathering")}
        </div>
        <div class="tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        <div class="card-footer">
          <div class="price"><small>Account price</small><strong>€${p.price.toLocaleString()}</strong></div>
          <a class="view-btn" href="${PDP_URL}">View Account →</a>
        </div>
        <div class="warranty"><i>✓</i> Eligible recall protection · Terms apply</div>
      </div>
    </article>`;
  }

  function renderActiveFilters() {
    const chips = [];
    state.regions.forEach((r) =>
      chips.push({
        label: r,
        action: () => {
          state.regions.delete(r);
          syncFilters();
          render();
        },
      }),
    );
    if (state.maxPrice < 3200)
      chips.push({
        label: `≤ €${state.maxPrice.toLocaleString()}`,
        action: () => {
          state.maxPrice = 3200;
          syncFilters();
          render();
        },
      });
    if (state.minFame > 0)
      chips.push({
        label: `${formatFame(state.minFame)}+ Fame`,
        action: () => {
          state.minFame = 0;
          syncFilters();
          render();
        },
      });
    state.tags.forEach((t) =>
      chips.push({
        label: t,
        action: () => {
          state.tags.delete(t);
          syncFilters();
          render();
        },
      }),
    );
    activeFilters.innerHTML = "";
    if (chips.length) {
      activeFilters.style.display = "flex";
      chips.forEach((c) => {
        const el = document.createElement("span");
        el.className = "active-chip";
        el.innerHTML = `${c.label}<button aria-label="Remove ${c.label}">×</button>`;
        el.querySelector("button").onclick = c.action;
        activeFilters.appendChild(el);
      });
    } else {
      activeFilters.style.display = "none";
    }
    filterBadge.textContent = chips.length;
    filterBadge.style.display = chips.length ? "inline-block" : "none";
  }

  function render() {
    const list = filteredProducts();
    resultCount.textContent = `${list.length} account${list.length === 1 ? "" : "s"}`;
    renderActiveFilters();
    // Page controls only make sense when there is a result set to page through.
    if (pagination) pagination.hidden = !list.length;
    if (!list.length) {
      productGrid.innerHTML = `<div class="empty"><strong>No matching accounts</strong>Try widening your budget or removing one of the filters.</div>`;
      return;
    }
    productGrid.innerHTML = list.map(card).join("");
    revealCards();
  }

  function revealCards() {
    const els = [...document.querySelectorAll("[data-card-reveal]")];
    if (!("IntersectionObserver" in window) || reducedMotion) {
      els.forEach((el) => el.classList.add("reveal"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("reveal");
          io.unobserve(e.target);
        }),
      { threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
  }

  const openDrawer = () => {
    filterDrawer.classList.add("open");
    drawerBackdrop.classList.add("open");
    document.body.classList.add("is-locked");
  };
  const closeDrawer = () => {
    filterDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
    document.body.classList.remove("is-locked");
  };
  openFilters.addEventListener("click", openDrawer);
  closeFilters.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);
  applyFilters.addEventListener("click", closeDrawer);

  searchInput.addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    searchClear.style.display = state.search ? "block" : "none";
    render();
  });
  searchClear.addEventListener("click", () => {
    state.search = "";
    searchInput.value = "";
    searchClear.style.display = "none";
    render();
    searchInput.focus();
  });
  sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeQuickView();
      closeDrawer();
    }
  });

  /* ---------- Shared animations ---------- */
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
    const host = el.closest("[data-reveal]");
    const wait = host
      ? parseFloat(
          getComputedStyle(host).getPropertyValue("--reveal-delay"),
        ) * 1000
      : 0;
    if (wait > 0) window.setTimeout(play, wait);
    else play();
  }

  const animatedStats = [
    ...document.querySelectorAll("[data-count-to],[data-fill-to]"),
  ];
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
    requestAnimationFrame(() =>
      requestAnimationFrame(() => revealImmediate.forEach(reveal)),
    );
  } else {
    [...revealSingles, ...revealImmediate].forEach(reveal);
    revealGroups.forEach(revealGroup);
  }

  /* ---------- Advantage stack depth + progress indicator ----------
     The pinning is pure CSS; this only reads how far each panel has been
     covered and translates that into lift, scale and fade. */
  const advStack = document.getElementById("advStack");
  if (advStack) {
    const items = [...advStack.children];
    const panels = items.map((li) => li.querySelector(".adv-panel"));
    const nowEl = document.getElementById("advNow");
    const barEl = document.getElementById("advBar");
    const wide = window.matchMedia("(min-width: 981px)");
    const MAX_DEPTH = 3;
    // Phones get a shallower stack so the active panel stays full width
    const DEPTH = {
      wide: { lift: 12, shrink: 0.028, fade: 0.05 },
      narrow: { lift: 8, shrink: 0.014, fade: 0.03 },
    };
    let depthCue = DEPTH.wide;
    let gap = 20;
    let stickTop = 118;
    let lastActive = 0;
    let frame = 0;
    let inView = false;

    function measure() {
      const style = getComputedStyle(items[0]);
      gap = parseFloat(style.marginBottom) || gap;
      stickTop = parseFloat(style.top) || stickTop;
      depthCue = wide.matches ? DEPTH.wide : DEPTH.narrow;
    }

    function clearDepth() {
      panels.forEach((panel) => {
        panel.style.transform = "";
        panel.style.opacity = "";
      });
    }

    function paint() {
      const rects = items.map((li) => li.getBoundingClientRect());
      // How much each panel has been covered by the one after it (0–1).
      const covers = [];
      let total = 0;
      for (let i = 0; i < items.length - 1; i++) {
        const travel = rects[i].height + gap;
        const raw = 1 - (rects[i + 1].top - stickTop) / travel;
        const cover = raw < 0 ? 0 : raw > 1 ? 1 : raw;
        covers.push(cover);
        total += cover;
      }
      const { lift, shrink, fade } = depthCue;
      panels.forEach((panel, i) => {
        let depth = 0;
        for (let j = i; j < covers.length; j++) depth += covers[j];
        if (depth > MAX_DEPTH) depth = MAX_DEPTH;
        panel.style.transform = `translateY(${(-depth * lift).toFixed(1)}px) scale(${(1 - depth * shrink).toFixed(4)})`;
        panel.style.opacity = (1 - depth * fade).toFixed(3);
      });

      const active = Math.min(items.length, Math.floor(total) + 1);
      if (active !== lastActive) {
        lastActive = active;
        nowEl.textContent = String(active).padStart(2, "0");
      }
      const fill = Math.min(1, (total + 1) / items.length);
      barEl.style.transform = `scaleX(${fill.toFixed(4)})`;
    }

    function loop() {
      paint();
      frame = requestAnimationFrame(loop);
    }

    const start = () => {
      if (frame || !inView || reducedMotion) return;
      measure();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    if ("IntersectionObserver" in window && !reducedMotion) {
      new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            inView = entry.isIntersecting;
            inView ? start() : stop();
          }),
        { threshold: 0 },
      ).observe(advStack);
    }

    wide.addEventListener("change", () => {
      stop();
      clearDepth();
      start();
    });
    window.addEventListener("resize", measure);
  }

  const brushHeadings = [...document.querySelectorAll(".brush")];
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

  function track(event, data = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
    console.info("[CRO event]", event, data);
  }
  document.querySelectorAll(".track").forEach((el) => {
    el.addEventListener("click", () =>
      track(el.dataset.event || "cta_click", {
        href: el.getAttribute("href"),
      }),
    );
  });

  syncFilters();
  render();
})();
