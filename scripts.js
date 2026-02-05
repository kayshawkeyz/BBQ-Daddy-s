/* ===========================
   BBQ Daddy's - scripts.js
   - Fade-in on scroll
   - Lightbox for Gallery
   - Parallax backgrounds
   - Floating menu nav active state
   - Footer year
=========================== */

(() => {
  "use strict";

  // ---------------------------
  // Helpers
  // ---------------------------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------------------------
  // Footer year
  // ---------------------------
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------------------------
  // Fade-in on scroll
  // Add class "fade" to any section/card you want animated.
  // CSS should define .fade and .fade.in
  // ---------------------------
  const fadeEls = $$(".fade");

  if ("IntersectionObserver" in window && fadeEls.length) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    fadeEls.forEach((el) => io.observe(el));
  } else {
    // Fallback
    fadeEls.forEach((el) => el.classList.add("in"));
  }

  // ---------------------------
  // Gallery Lightbox
  // Requires:
  //  - .g-item img inside gallery
  //  - #lightbox, #lightboxImg, #lightboxCap, #lightboxClose
  // ---------------------------
  const lightbox     = $("#lightbox");
  const lightboxImg  = $("#lightboxImg");
  const lightboxCap  = $("#lightboxCap");
  const lightboxClose = $("#lightboxClose");

  const openLightbox = (src, alt, caption) => {
    if (!lightbox || !lightboxImg) return;

    lightboxImg.src = src;
    lightboxImg.alt = alt || caption || "Gallery image";
    if (lightboxCap) lightboxCap.textContent = caption || "";

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImg) return;

    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
    if (lightboxCap) lightboxCap.textContent = "";
    document.body.style.overflow = "";
  };

  // Click an image to open
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".g-item img");
    if (!img) return;

    const figure = img.closest("figure");
    const caption = figure?.querySelector("figcaption")?.textContent?.trim() || "";
    openLightbox(img.currentSrc || img.src, img.alt, caption);
  });

  // Close button
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);

  // Click outside image closes
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox?.classList.contains("open")) {
      closeLightbox();
    }
  });

  // ---------------------------
  // Parallax backgrounds
  // Add on any section:
  //   data-parallax="0.25"
  // Higher = moves more.
  // Works best when section uses background-image and background-attachment: fixed is NOT required.
  // ---------------------------
  const parallaxEls = $$("[data-parallax]");

  const updateParallax = () => {
    if (!parallaxEls.length) return;

    const scrollY = window.scrollY || window.pageYOffset;
    const vh = window.innerHeight || 800;

    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.getAttribute("data-parallax")) || 0.2;
      const rect = el.getBoundingClientRect();
      const elTop = rect.top + scrollY;

      // Only adjust when near viewport for performance
      const inRange = (elTop < scrollY + vh * 1.5) && (elTop + rect.height > scrollY - vh);
      if (!inRange) return;

      // Offset relative to scroll position
      const offset = (scrollY - elTop) * speed;
      el.style.backgroundPosition = `center calc(50% + ${offset}px)`;
    });
  };

  // Throttle with rAF
  let parallaxTicking = false;
  const onScrollParallax = () => {
    if (parallaxTicking) return;
    parallaxTicking = true;
    requestAnimationFrame(() => {
      updateParallax();
      parallaxTicking = false;
    });
  };

  if (parallaxEls.length) {
    window.addEventListener("scroll", onScrollParallax, { passive: true });
    window.addEventListener("resize", updateParallax);
    updateParallax();
  }

  // ---------------------------
  // Floating Menu Navigation active highlighting
  // Requires:
  //  - nav container element with class ".float-nav"
  //  - links inside: <a href="#menu-beef">Beef</a> etc.
  //  - sections with matching IDs
  // ---------------------------
  const floatNav = $(".float-nav");
  const floatLinks = floatNav ? $$('a[href^="#"]', floatNav) : [];

  const sectionTargets = floatLinks
    .map((a) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return null;
      const target = $(id);
      return target ? { a, target, id } : null;
    })
    .filter(Boolean);

  const setActiveLink = (id) => {
    floatLinks.forEach((a) => a.classList.remove("active"));
    const match = floatLinks.find((a) => a.getAttribute("href") === id);
    if (match) match.classList.add("active");
  };

  if ("IntersectionObserver" in window && sectionTargets.length) {
    const navIO = new IntersectionObserver(
      (entries) => {
        // Pick the entry most visible
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

        if (visible) setActiveLink(`#${visible.target.id}`);
      },
      {
        root: null,
        threshold: [0.15, 0.35, 0.55],
      }
    );

    sectionTargets.forEach(({ target }) => navIO.observe(target));
  }

  // Smooth scroll for floating nav links (keeps sticky header in mind)
  const getHeaderOffset = () => {
    const header = $(".site-header");
    return header ? header.getBoundingClientRect().height + 12 : 80;
  };

  if (floatLinks.length) {
    floatLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;

        const target = $(href);
        if (!target) return;

        e.preventDefault();

        const offset = getHeaderOffset();
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({ top, behavior: "smooth" });
        setActiveLink(href);
      });
    });
  }
})();
