(function () {
  const data = window.SITE_DATA;
  const PITCH_EMAIL = "hello@beulahventures.com";
  let lang = "ko";

  try {
    const saved = localStorage.getItem("lang");
    if (saved === "ko" || saved === "en") lang = saved;
    else if (!navigator.language.toLowerCase().startsWith("ko")) lang = "en";
  } catch (_) { /* storage unavailable */ }

  const t = (key) => data.i18n[lang][key] ?? data.i18n.ko[key] ?? key;
  const pick = (obj) => (obj && typeof obj === "object" ? obj[lang] ?? obj.ko : obj);

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    });
    (children || []).forEach((c) => node.appendChild(c));
    return node;
  }

  function renderPortfolio() {
    const grid = document.getElementById("portfolio-grid");
    grid.replaceChildren();
    data.portfolio.forEach((co) => {
      const name = el(co.url ? "a" : "h3", co.url ? { class: "name", href: co.url, target: "_blank", rel: "noopener", text: co.name } : { text: co.name });
      grid.appendChild(el("article", { class: "portfolio-item" }, [
        el("span", { class: "tag", text: pick(co.sector) }),
        el("div", {}, [name, el("p", { class: "muted", text: pick(co.desc) })])
      ]));
    });
    grid.appendChild(el("article", { class: "portfolio-item open" }, [
      el("span", { class: "tag", text: t("portfolio.open") }),
      el("a", { href: "#pitch", text: t("portfolio.openCta") })
    ]));
    document.querySelector('[data-i18n="portfolio.note"]').hidden = data.portfolio.length > 0;
  }

  function renderTeam() {
    const grid = document.getElementById("team-grid");
    grid.replaceChildren();
    data.team.forEach((m) => {
      const name = pick(m.name);
      grid.appendChild(el("article", { class: "member" }, [
        el("div", { class: "avatar", text: name.trim().charAt(0) }),
        el("h3", { text: name }),
        el("p", { class: "role", text: pick(m.role) }),
        el("p", { text: pick(m.bio) })
      ]));
    });
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    // Trusted, site-authored strings that carry <em>/<br> emphasis
    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      node.innerHTML = t(node.dataset.i18nHtml);
    });
    document.querySelector(".lang-toggle").textContent = lang === "ko" ? "EN" : "한국어";
    renderPortfolio();
    renderTeam();
    renderYears();
    renderFlywheel();
    const status = document.getElementById("form-status");
    status.textContent = "";
    status.className = "form-status full";
  }

  // Seven years of plenty and famine: harvest per year and storehouse level, drawn to one scale.
  function renderYears() {
    const svg = document.getElementById("years-chart");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const W = 980, H = 300, left = 40, right = 20, top = 34, base = 230;
    const cols = 14, colW = (W - left - right) / cols;
    // Plenty: harvest 10, store 4 each year. Famine: harvest 2, draw 4 from store.
    const harvest = [], store = [];
    let level = 0;
    for (let y = 0; y < cols; y++) {
      const plenty = y < 7;
      harvest.push(plenty ? 10 : 2);
      level += plenty ? 4 : -3.6;
      store.push(Math.max(level, 0));
    }
    const maxStore = 28, maxH = 10;
    const sy = (v) => base - (v / maxStore) * (base - top - 20);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const add = (tag, attrs, text) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text != null) n.textContent = text;
      svg.appendChild(n);
      return n;
    };
    // Era bands
    add("rect", { x: left, y: top - 24, width: colW * 7, height: base - top + 24, class: "yc-plenty" });
    add("rect", { x: left + colW * 7, y: top - 24, width: colW * 7, height: base - top + 24, class: "yc-famine" });
    add("text", { x: left + 8, y: top - 8, class: "yc-era" }, t("joseph.plenty"));
    add("text", { x: left + colW * 7 + 8, y: top - 8, class: "yc-era" }, t("joseph.famine"));
    // Storehouse area
    let d = `M ${left} ${base}`;
    store.forEach((v, i) => { d += ` L ${left + colW * i} ${sy(v)} L ${left + colW * (i + 1)} ${sy(v)}`; });
    d += ` L ${left + colW * cols} ${base} Z`;
    add("path", { d, class: "yc-store" });
    // Sheaves: stalk count and height follow the harvest
    harvest.forEach((h, i) => {
      const cx = left + colW * (i + 0.5);
      const stalks = h >= 10 ? 5 : 2;
      const len = (h / maxH) * 70 + 18;
      for (let s = 0; s < stalks; s++) {
        const off = (s - (stalks - 1) / 2) * 7;
        const tipX = cx + off * 1.6, tipY = base - len - (h >= 10 ? 40 : 0);
        add("line", { x1: cx + off * 0.3, y1: base, x2: tipX, y2: tipY, class: h >= 10 ? "yc-stalk" : "yc-stalk-thin" });
        if (h >= 10) add("ellipse", { cx: tipX, cy: tipY - 7, rx: 3.2, ry: 9, transform: `rotate(${off * 2.2} ${tipX} ${tipY - 7})`, class: "yc-ear" });
      }
    });
    add("line", { x1: left, y1: base, x2: W - right, y2: base, class: "yc-axis" });
    for (let i = 0; i < cols; i++) {
      add("text", { x: left + colW * (i + 0.5), y: base + 20, class: "yc-tick", "text-anchor": "middle" }, String(i + 1));
    }
    add("text", { x: left, y: base + 44, class: "yc-axis-label" }, t("joseph.year"));
    // Legend
    add("rect", { x: W - right - 250, y: H - 22, width: 14, height: 10, class: "yc-store" });
    add("text", { x: W - right - 230, y: H - 13, class: "yc-legend" }, t("joseph.store"));
    add("ellipse", { cx: W - right - 110, cy: H - 17, rx: 3, ry: 7, class: "yc-ear" });
    add("text", { x: W - right - 100, y: H - 13, class: "yc-legend" }, t("joseph.harvest"));
  }

  // Flywheel: gospel at the center, seven steps turning clockwise
  function renderFlywheel() {
    const svg = document.getElementById("flywheel");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const C = 280, R = 205, NR = 50, N = 7;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    svg.replaceChildren();
    const add = (parent, tag, attrs, text) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text != null) n.textContent = text;
      parent.appendChild(n);
      return n;
    };
    const defs = add(svg, "defs", {});
    const marker = add(defs, "marker", { id: "fw-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
    add(marker, "path", { d: "M0 0 L10 5 L0 10 z", class: "fw-arrowhead" });
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const pt = (a, r = R) => [C + r * Math.cos(a), C + r * Math.sin(a)];
    // Ring guide
    add(svg, "circle", { cx: C, cy: C, r: R, class: "fw-ring" });
    // Arrows between nodes, along the ring
    const gap = (NR + 10) / R;
    for (let i = 0; i < N; i++) {
      const [x1, y1] = pt(ang(i) + gap), [x2, y2] = pt(ang(i + 1) - gap);
      add(svg, "path", { d: `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`, class: "fw-arc", "marker-end": "url(#fw-arrow)" });
    }
    // Spokes to the center: everything rests on the gospel
    for (let i = 0; i < N; i++) {
      const [x1, y1] = pt(ang(i), 92), [x2, y2] = pt(ang(i), R - NR - 4);
      add(svg, "line", { x1, y1, x2, y2, class: "fw-spoke" });
    }
    // Moving seed travelling the ring
    if (!reduce) {
      const dot = add(svg, "circle", { r: 7, class: "fw-seed" });
      const motion = add(dot, "animateMotion", { dur: "14s", repeatCount: "indefinite", path: `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R}` });
      motion.setAttribute("rotate", "auto");
    }
    // Center
    add(svg, "circle", { cx: C, cy: C, r: 84, class: "fw-center" });
    add(svg, "text", { x: C, y: C + 4, class: "fw-center-text", "text-anchor": "middle" }, t("fw.center"));
    add(svg, "text", { x: C, y: C + 30, class: "fw-center-sub", "text-anchor": "middle" }, t("fw.centerSub"));
    // Nodes
    for (let i = 0; i < N; i++) {
      const [x, y] = pt(ang(i));
      const g = add(svg, "g", { class: "fw-node", style: `--i:${i}` });
      add(g, "circle", { cx: x, cy: y, r: NR });
      add(g, "text", { x, y: y - 14, class: "fw-num", "text-anchor": "middle" }, "0" + (i + 1));
      const words = t("fw.n" + (i + 1)).split(" ");
      const lines = words.length > 2 ? [words.slice(0, -1).join(" "), words.at(-1)] : (words.length === 2 && words.join(" ").length > 8 ? words : [words.join(" ")]);
      lines.forEach((line, k) => add(g, "text", { x, y: y + 8 + k * 17 - (lines.length - 1) * 6, class: "fw-label", "text-anchor": "middle" }, line));
    }
  }

  // Wheat field band
  function initField() {
    const canvas = document.getElementById("field-canvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stalks = [], w = 0, h = 0, raf = 0;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--ink").trim() || "#0f1a2e";
    const grain = css.getPropertyValue("--grain").trim() || "#a87b2f";
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    function setup() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed = 7;
      const n = Math.round(w / 9);
      stalks = Array.from({ length: n }, (_, i) => ({
        x: (i + rand()) * (w / n),
        len: h * (0.45 + rand() * 0.5),
        lean: (rand() - 0.5) * 0.25,
        phase: rand() * Math.PI * 2,
        gold: rand() < 0.22,
        alpha: 0.35 + rand() * 0.65
      }));
    }
    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      stalks.forEach((s) => {
        const sway = reduce ? 0 : Math.sin(time / 1800 + s.phase) * 0.04;
        const bend = s.lean + sway;
        const tipX = s.x + bend * s.len, tipY = h - s.len;
        ctx.globalAlpha = s.gold && !reduce ? Math.min(1, s.alpha * (0.75 + 0.35 * Math.sin(time / 600 + s.phase * 3))) : s.alpha;
        ctx.strokeStyle = s.gold ? grain : ink;
        ctx.fillStyle = s.gold ? grain : ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, h);
        ctx.quadraticCurveTo(s.x + bend * s.len * 0.2, h - s.len * 0.6, tipX, tipY);
        ctx.stroke();
        // Ear: kernels along the top of the stalk
        const angle = Math.atan2(tipY - (h - s.len * 0.6), tipX - (s.x + bend * s.len * 0.2));
        for (let k = 0; k < 7; k++) {
          const tt = k * 4.2;
          const kx = tipX - Math.cos(angle) * tt, ky = tipY - Math.sin(angle) * tt;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(kx + side * 2.2, ky, 1.6, 3.6, angle + Math.PI / 2 + side * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX + Math.cos(angle) * 14, tipY + Math.sin(angle) * 14);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    }
    setup(); draw(0);
    window.addEventListener("resize", () => { cancelAnimationFrame(raf); setup(); draw(performance.now()); });
  }
  initField();

  // Hero sparkles: gold motes drifting up like grain dust in light
  function initSparkles() {
    const canvas = document.getElementById("sparkle-canvas");
    if (!canvas || !canvas.getContext) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    const gold = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#5f7d6b";
    let w = 0, h = 0, motes = [];
    function setup() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 14000);
      motes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.6 + Math.random() * 1.8, v: 0.08 + Math.random() * 0.25,
        p: Math.random() * Math.PI * 2, star: false
      }));
    }
    function star(x, y, r, a) {
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 4); ctx.lineTo(x + r * 0.7, y - r * 0.7); ctx.lineTo(x + r * 4, y);
      ctx.lineTo(x + r * 0.7, y + r * 0.7); ctx.lineTo(x, y + r * 4); ctx.lineTo(x - r * 0.7, y + r * 0.7);
      ctx.lineTo(x - r * 4, y); ctx.lineTo(x - r * 0.7, y - r * 0.7); ctx.closePath(); ctx.fill();
    }
    function frame(time) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = gold;
      motes.forEach((m) => {
        if (!reduce) { m.y -= m.v; m.x += Math.sin(time / 2000 + m.p) * 0.15; if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; } }
        const a = 0.25 + 0.6 * Math.abs(Math.sin(time / 900 + m.p));
        if (m.star) star(m.x, m.y, m.r, a);
        else { ctx.globalAlpha = a * 0.8; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill(); }
      });
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(frame);
    }
    setup(); frame(0);
    window.addEventListener("resize", setup);
  }
  initSparkles();

  // Reveal on scroll. Content is visible by default; the animation only plays as it enters view.
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const targets = document.querySelectorAll(".reveal, .values > li, .stages > li, .tracks > li, .fw-list > li, .modules > li, .facts > div, .years, .equation-line");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.animationDelay = `${Math.min(idx, 7) * 70}ms`;
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12 });
    targets.forEach((el) => io.observe(el));
  }

  document.querySelector(".lang-toggle").addEventListener("click", () => {
    lang = lang === "ko" ? "en" : "ko";
    try { localStorage.setItem("lang", lang); } catch (_) { /* ignore */ }
    applyLang();
  });

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Pitch form: static site, so it composes an email. Swap for Formspree/Netlify Forms/etc. to collect submissions server-side.
  document.getElementById("pitch-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const f = Object.fromEntries(new FormData(form).entries());
    const status = document.getElementById("form-status");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email || "");
    if (!f.name?.trim() || !emailOk || !f.company?.trim() || !f.desc?.trim()) {
      status.textContent = t("form.error");
      status.className = "form-status full error";
      return;
    }
    if (!f.cohort?.trim() || !f.completed) {
      status.textContent = t("form.errorV101");
      status.className = "form-status full error";
      return;
    }
    const subject = `[Pitch] ${f.company} (${f.stage})`;
    const body = [
      `Name: ${f.name}`,
      `Email: ${f.email}`,
      `Company: ${f.company}`,
      `Track: ${f.track}`,
      `Stage: ${f.stage}`,
      `Deck: ${f.deck || "-"}`,
      `Venture 101 cohort: ${f.cohort}`,
      "",
      f.desc
    ].join("\n");
    const full = `Subject: ${subject}\n\n${body}`;
    const mailLink = el("a", { class: "btn btn-light", href: `mailto:${PITCH_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, text: t("form.openMail") });
    const copyBtn = el("button", { type: "button", class: "btn btn-outline-light", text: t("form.copy") });
    copyBtn.addEventListener("click", () => {
      const done = () => { copyBtn.textContent = t("form.copied"); };
      navigator.clipboard?.writeText(full).then(done, () => { pre.focus(); window.getSelection().selectAllChildren(pre); });
    });
    const pre = el("pre", { class: "pitch-preview", tabindex: "0", text: full });
    status.replaceChildren(
      el("span", { text: t("form.ok") + " " }),
      el("strong", { class: "pitch-email", text: PITCH_EMAIL }),
      pre,
      el("span", { class: "pitch-actions" }, [mailLink, copyBtn])
    );
    status.className = "form-status full ok";
  });

  document.getElementById("year").textContent = new Date().getFullYear();
  applyLang();
})();
