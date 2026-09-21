(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const style = document.createElement("style");
  style.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(24px);
      will-change: opacity, transform;
    }
    .reveal.in-view {
      opacity: 1;
      transform: translateY(0);
      animation: revealFadeIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    @keyframes revealFadeIn {
      0% {
        opacity: 0;
        transform: translateY(28px);
      }
      55% {
        opacity: 0.8;
        transform: translateY(6px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .reveal-stagger.in-view {
      animation-delay: calc(var(--stagger-index, 0) * 90ms);
    }
    @media (prefers-reduced-motion: reduce) {
      .reveal {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  function tagRevealTargets() {
    const selectors = [
      "#story h2",
      "#story h3",
      "#story p",
      "#story .pull-quote",
      "#video h2",
      "#video .video-frame",
      "#video .video-caption",
      "#gallery h2",
      "#gallery .gallery figure",
      "#legacy h2",
      "#legacy .timeline .row",
      "#legacy .essay p",
      ".legacy-heading",
    ];

    const seen = new Set();
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        el.classList.add("reveal");
      });
    });

    // Stagger figures and timeline rows so they don't all pop at once
    document
      .querySelectorAll("#gallery .gallery figure, #legacy .timeline .row")
      .forEach((el, i) => {
        el.classList.add("reveal-stagger");
        el.style.setProperty("--stagger-index", i % 6);
      });
  }

  function initRevealObserver() {
    if (prefersReducedMotion) {
      document.querySelectorAll(".reveal").forEach((el) => {
        el.classList.add("in-view");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;

          if (entry.isIntersecting) {
            target.classList.remove("in-view");
            void target.offsetWidth;
            target.classList.add("in-view");
          } else {
            target.classList.remove("in-view");
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12,
      },
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }
  function initActiveNav() {
    const navLinks = Array.from(
      document.querySelectorAll('.navbar nav a[href^="#"]'),
    );
    if (!navLinks.length) return;

    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const linkFor = (id) =>
      navLinks.find((l) => l.getAttribute("href") === `#${id}`);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = linkFor(entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      {
        root: null,
        rootMargin: "-45% 0px -50% 0px",
        threshold: 0,
      },
    );

    sections.forEach((sec) => observer.observe(sec));
  }

  function initHeroParallax() {
    const heroArt = document.querySelector(".hero-art");
    const hero = document.querySelector(".hero");
    if (!heroArt || !hero || prefersReducedMotion) return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    let ticking = false;

    function update() {
      const rect = hero.getBoundingClientRect();
      const heroHeight = rect.height || 1;

      const progress = Math.min(Math.max((0 - rect.top) / heroHeight, 0), 1);
      const translateY = progress * 60;
      const scale = 1 + progress * 0.06;
      const opacity = 1 - progress * 0.6;

      heroArt.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      heroArt.style.opacity = String(Math.max(opacity, 0.15));

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    heroArt.style.willChange = "transform, opacity";
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  function initSmoothAnchorScroll() {
    const navbar = document.querySelector(".navbar");
    const navHeight = navbar ? navbar.offsetHeight : 0;

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href").slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();

        const top =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          navHeight -
          8;

        window.scrollTo({
          top,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });

        history.pushState(null, "", `#${id}`);
      });
    });
  }

  function init() {
    tagRevealTargets();
    initRevealObserver();
    initActiveNav();
    initHeroParallax();
    initSmoothAnchorScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
