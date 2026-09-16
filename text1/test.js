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
    .navbar nav a {
      position: relative;
      transition: color 0.25s ease;
    }
    .navbar nav a.active {
      color: var(--lacquer, #a6321e);
    }
    .navbar nav a.active::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -6px;
      height: 2px;
      background: var(--lacquer, #a6321e);
      border-radius: 2px;
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

  /* ----------------------------------------------------------------
     Minimal QR code generator (byte mode, error correction level L).
     Self-contained — no external library or network request.
     ---------------------------------------------------------------- */
  const QR = (function () {
    const EC_LEVEL_L = 1;
    const EC_CODEWORDS = {
      1: 7,
      2: 10,
      3: 15,
      4: 20,
      5: 26,
      6: 18,
      7: 20,
      8: 24,
      9: 30,
      10: 18,
    };
    const ALIGN = {
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30],
      6: [6, 34],
      7: [6, 22, 38],
      8: [6, 24, 42],
      9: [6, 26, 46],
      10: [6, 28, 50],
    };

    // GF(256) tables.
    const EXP = new Uint8Array(512);
    const LOG = new Uint8Array(256);
    (function () {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        EXP[i] = x;
        LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
      }
      for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
    })();

    function mul(a, b) {
      if (a === 0 || b === 0) return 0;
      return EXP[LOG[a] + LOG[b]];
    }

    function rsGeneratorPoly(degree) {
      let poly = [1];
      for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j++) {
          next[j] ^= poly[j];
          next[j + 1] ^= mul(poly[j], EXP[i]);
        }
        poly = next;
      }
      return poly;
    }

    function rsEncode(data, ecCount) {
      const gen = rsGeneratorPoly(ecCount);
      const res = new Array(ecCount).fill(0);
      for (const d of data) {
        const factor = d ^ res[0];
        res.shift();
        res.push(0);
        for (let i = 0; i < ecCount; i++) res[i] ^= mul(gen[i + 1], factor);
      }
      return res;
    }

    function countBits(version) {
      // byte-mode character count indicator length
      return version < 10 ? 8 : 16;
    }

    function bitsToBytes(bits) {
      const bytes = [];
      for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
        bytes.push(byte);
      }
      return bytes;
    }

    function dataCapacityBytes(version) {
      // total data codewords for level L
      const totalCodewords = {
        1: 26,
        2: 44,
        3: 70,
        4: 100,
        5: 134,
        6: 172,
        7: 196,
        8: 242,
        9: 292,
        10: 346,
      }[version];
      return totalCodewords - EC_CODEWORDS[version];
    }

    function chooseVersion(byteLen) {
      for (let v = 1; v <= 10; v++) {
        const cap = dataCapacityBytes(v) * 8;
        const needed = 4 + countBits(v) + byteLen * 8;
        if (needed <= cap) return v;
      }
      throw new Error("QR: data too long for supported versions");
    }

    function buildDataCodewords(bytes, version) {
      const bits = [];
      const push = (val, len) => {
        for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
      };
      push(0b0100, 4); // byte mode
      push(bytes.length, countBits(version));
      for (const b of bytes) push(b, 8);

      const capacityBits = dataCapacityBytes(version) * 8;
      // terminator
      for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0);
      // pad to byte boundary
      while (bits.length % 8 !== 0) bits.push(0);
      const codewords = bitsToBytes(bits);
      // pad codewords
      const padBytes = [0xec, 0x11];
      let pi = 0;
      while (codewords.length < dataCapacityBytes(version)) {
        codewords.push(padBytes[pi % 2]);
        pi++;
      }
      return codewords;
    }

    function makeMatrix(version) {
      const size = version * 4 + 17;
      const m = Array.from({ length: size }, () => new Array(size).fill(null));
      const reserved = Array.from({ length: size }, () =>
        new Array(size).fill(false),
      );

      function setModule(r, c, val) {
        m[r][c] = val;
        reserved[r][c] = true;
      }

      function placeFinder(row, col) {
        for (let r = -1; r <= 7; r++) {
          for (let c = -1; c <= 7; c++) {
            const rr = row + r;
            const cc = col + c;
            if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
            const inRing = r >= 0 && r <= 6 && c >= 0 && c <= 6;
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setModule(rr, cc, inRing && (isBorder || isCenter) ? 1 : 0);
          }
        }
      }

      placeFinder(0, 0);
      placeFinder(0, size - 7);
      placeFinder(size - 7, 0);

      // timing patterns
      for (let i = 8; i < size - 8; i++) {
        setModule(6, i, i % 2 === 0 ? 1 : 0);
        setModule(i, 6, i % 2 === 0 ? 1 : 0);
      }

      // alignment patterns
      const coords = ALIGN[version] || [];
      for (const r of coords) {
        for (const c of coords) {
          if (
            (r === 6 && c === 6) ||
            (r === 6 && c === size - 7) ||
            (r === size - 7 && c === 6)
          )
            continue;
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
              const isCenter = dr === 0 && dc === 0;
              setModule(r + dr, c + dc, isBorder || isCenter ? 1 : 0);
            }
          }
        }
      }

      // dark module
      setModule(size - 8, 8, 1);

      // reserve format info areas
      for (let i = 0; i < 9; i++) {
        if (m[8][i] === null) reserved[8][i] = true;
        if (m[i][8] === null) reserved[i][8] = true;
      }
      for (let i = 0; i < 8; i++) {
        if (m[8][size - 1 - i] === null) reserved[8][size - 1 - i] = true;
        if (m[size - 1 - i][8] === null) reserved[size - 1 - i][8] = true;
      }
      reserved[size - 8][8] = true;

      return { m, reserved, size, setModule };
    }

    function placeData(mat, codewords) {
      const { m, reserved, size } = mat;
      const bits = [];
      for (const cw of codewords) {
        for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
      }
      let bitIndex = 0;
      let upward = true;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--; // skip vertical timing column
        for (let i = 0; i < size; i++) {
          const row = upward ? size - 1 - i : i;
          for (let c = 0; c < 2; c++) {
            const cc = col - c;
            if (reserved[row][cc]) continue;
            const bit = bitIndex < bits.length ? bits[bitIndex] : 0;
            m[row][cc] = bit;
            bitIndex++;
          }
        }
        upward = !upward;
      }
    }

    function applyMask(mat, maskId) {
      const { m, reserved, size } = mat;
      const maskFn = [
        (r, c) => (r + c) % 2 === 0,
        (r) => r % 2 === 0,
        (r, c) => c % 3 === 0,
        (r, c) => (r + c) % 3 === 0,
        (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
        (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
        (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
        (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
      ][maskId];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!reserved[r][c] && maskFn(r, c)) m[r][c] ^= 1;
        }
      }
    }

    function placeFormatInfo(m, size, maskId) {
      // EC level L (01) + mask id, format bits
      const data = (EC_LEVEL_L << 3) | maskId;
      let rem = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
      const fmt = ((data << 10) | rem) ^ 0x5412;
      const bits = [];
      for (let i = 14; i >= 0; i--) bits.push((fmt >> i) & 1);

      const positions1 = [
        [8, 0],
        [8, 1],
        [8, 2],
        [8, 3],
        [8, 4],
        [8, 5],
        [8, 7],
        [8, 8],
        [7, 8],
        [5, 8],
        [4, 8],
        [3, 8],
        [2, 8],
        [1, 8],
        [0, 8],
      ];
      const positions2 = [
        [size - 1, 8],
        [size - 2, 8],
        [size - 3, 8],
        [size - 4, 8],
        [size - 5, 8],
        [size - 6, 8],
        [size - 7, 8],
        [8, size - 8],
        [8, size - 7],
        [8, size - 6],
        [8, size - 5],
        [8, size - 4],
        [8, size - 3],
        [8, size - 2],
        [8, size - 1],
      ];
      positions1.forEach(([r, c], i) => (m[r][c] = bits[i]));
      positions2.forEach(([r, c], i) => (m[r][c] = bits[i]));
    }

    function scoreMatrix(m, size) {
      // Penalty scoring to choose the best mask (simplified but effective).
      let score = 0;
      for (let r = 0; r < size; r++) {
        let run = 1;
        for (let c = 1; c < size; c++) {
          if (m[r][c] === m[r][c - 1]) run++;
          else {
            if (run >= 5) score += run - 2;
            run = 1;
          }
        }
        if (run >= 5) score += run - 2;
      }
      for (let c = 0; c < size; c++) {
        let run = 1;
        for (let r = 1; r < size; r++) {
          if (m[r][c] === m[r - 1][c]) run++;
          else {
            if (run >= 5) score += run - 2;
            run = 1;
          }
        }
        if (run >= 5) score += run - 2;
      }
      return score;
    }

    function encode(text) {
      const bytes = new TextEncoder().encode(text);
      const version = chooseVersion(bytes.length);
      const dataCodewords = buildDataCodewords(bytes, version);
      const ecCount = EC_CODEWORDS[version];
      const ec = rsEncode(dataCodewords, ecCount);
      const finalCodewords = dataCodewords.concat(ec);

      let best = null;
      let bestScore = Infinity;
      let bestMask = 0;
      for (let mask = 0; mask < 8; mask++) {
        const mat = makeMatrix(version);
        // record reserved mask before data placement (data cells are non-reserved)
        placeData(mat, finalCodewords);
        applyMask(mat, mask);
        placeFormatInfo(mat.m, mat.size, mask);
        const s = scoreMatrix(mat.m, mat.size);
        if (s < bestScore) {
          bestScore = s;
          best = mat.m;
          bestMask = mask;
        }
      }
      return { matrix: best, size: version * 4 + 17, version, mask: bestMask };
    }

    return { encode };
  })();

  function renderQR(text) {
    const canvas = document.getElementById("qr-canvas");
    const urlEl = document.getElementById("qr-url");
    if (!canvas) return;
    try {
      const { matrix, size } = QR.encode(text);
      const quiet = 4;
      const total = size + quiet * 2;
      const scale = Math.floor(canvas.width / total) || 1;
      const px = scale * total;
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f2e8d5";
      ctx.fillRect(0, 0, px, px);
      ctx.fillStyle = "#1b1410";
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (matrix[r][c]) {
            ctx.fillRect(
              (c + quiet) * scale,
              (r + quiet) * scale,
              scale,
              scale,
            );
          }
        }
      }
      if (urlEl) urlEl.textContent = text;
    } catch (err) {
      if (urlEl) urlEl.textContent = "Could not generate QR code.";
      console.error(err);
    }
  }

  function initShare() {
    if (!document.getElementById("qr-canvas")) return;
    renderQR(window.location.href);
  }

  function init() {
    tagRevealTargets();
    initRevealObserver();
    initActiveNav();
    initHeroParallax();
    initSmoothAnchorScroll();
    initShare();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
