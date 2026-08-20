/* Shared header behaviour: mobile drawer, dropdown accordions, scroll state.
   Only for pages that do not already load a page bundle with this logic. */
(() => {
  const nav = document.getElementById("nav");
  const menuBtn = document.getElementById("menuBtn");
  const header = document.getElementById("siteHeader");
  if (!nav || !menuBtn) return;

  const closeSubmenus = () => {
    nav.querySelectorAll(".has-menu.open").forEach((item) => {
      item.classList.remove("open");
      item.querySelector(".mega-toggle").setAttribute("aria-expanded", "false");
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

  if (header) {
    window.addEventListener(
      "scroll",
      () => header.classList.toggle("scrolled", window.scrollY > 8),
      { passive: true },
    );
  }
})();
