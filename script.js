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

  // Seven years of plenty and famine, drawn with grains. Same scale for every year.
  function renderYears() {
    const svg = document.getElementById("years-chart");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const W = 980, H = 300, left = 40, right = 20, top = 34, base = 230;
    const cols = 14, colW = (W - left - right) / cols;
    // Plenty: store 4 units a year. Famine: draw 3.6 a year. Never reaches zero.
    const store = [];
    let level = 0;
    for (let y = 0; y < cols; y++) { level += y < 7 ? 4 : -3.6; store.push(Math.max(level, 0)); }
    const maxStore = 28;
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
    add("text", { x: left, y: top - 10, class: "yc-era" }, t("joseph.plenty"));
    add("text", { x: left + colW * 7, y: top - 10, class: "yc-era" }, t("joseph.famine"));
    add("line", { x1: left + colW * 7, y1: top - 4, x2: left + colW * 7, y2: base, class: "yc-divider" });
    let d = `M ${left} ${base}`;
    store.forEach((v, i) => { d += ` L ${left + colW * i} ${sy(v)} L ${left + colW * (i + 1)} ${sy(v)}`; });
    d += ` L ${left + colW * cols} ${base} Z`;
    add("path", { d, class: "yc-store" });
    for (let i = 0; i < cols; i++) {
      const cx = left + colW * (i + 0.5);
      const plenty = i < 7;
      const n = plenty ? 5 : 2;
      for (let k = 0; k < n; k++) {
        const ang = (k - (n - 1) / 2) * (plenty ? 16 : 22);
        const r = plenty ? 26 : 12;
        const gx = cx + Math.sin(ang * Math.PI / 180) * r;
        const gy = base - 16 - Math.cos(ang * Math.PI / 180) * r - (plenty ? 24 : 0);
        add("ellipse", { cx: gx, cy: gy, rx: plenty ? 4.6 : 3.4, ry: plenty ? 12 : 8, transform: `rotate(${ang} ${gx} ${gy})`, class: plenty ? "yc-grain" : "yc-grain-thin" });
      }
      add("text", { x: cx, y: base + 22, class: "yc-tick", "text-anchor": "middle" }, String(i + 1));
    }
    add("line", { x1: left, y1: base, x2: W - right, y2: base, class: "yc-axis" });
    add("text", { x: left, y: base + 46, class: "yc-axis-label" }, t("joseph.year"));
    add("rect", { x: W - right - 230, y: H - 23, width: 14, height: 10, class: "yc-store" });
    add("text", { x: W - right - 210, y: H - 14, class: "yc-legend" }, t("joseph.store"));
    add("ellipse", { cx: W - right - 100, cy: H - 18, rx: 3.2, ry: 7, class: "yc-grain" });
    add("text", { x: W - right - 90, y: H - 14, class: "yc-legend" }, t("joseph.harvest"));
  }

  // Flywheel = the brand mark, enlarged: seven grains around the gospel
  function renderFlywheel() {
    const svg = document.getElementById("flywheel");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const C = 280, R = 150, N = 7;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    svg.setAttribute("viewBox", "-80 -10 720 580");
    svg.replaceChildren();
    const add = (parent, tag, attrs, text) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text != null) n.textContent = text;
      parent.appendChild(n);
      return n;
    };
    const deg = (i) => -90 + (i * 360) / N;
    const pt = (a, r) => [C + r * Math.cos(a * Math.PI / 180), C + r * Math.sin(a * Math.PI / 180)];
    add(svg, "circle", { cx: C, cy: C, r: R, class: "fw-ring" });
    if (!reduce) {
      const dot = add(svg, "circle", { r: 5, class: "fw-seed" });
      add(dot, "animateMotion", { dur: "14s", repeatCount: "indefinite", path: `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R}` });
    }
    for (let i = 0; i < N; i++) {
      const a = deg(i);
      const [x, y] = pt(a, R);
      const g = add(svg, "g", { class: "fw-node", style: `--i:${i}` });
      add(g, "ellipse", { cx: x, cy: y, rx: 22, ry: 48, transform: `rotate(${a + 90} ${x} ${y})` });
      const [lx, ly] = pt(a, R + 86);
      const anchor = Math.abs(lx - C) < 30 ? "middle" : lx > C ? "start" : "end";
      add(g, "text", { x: lx, y: ly - 6, class: "fw-num", "text-anchor": anchor }, "0" + (i + 1));
      add(g, "text", { x: lx, y: ly + 16, class: "fw-label", "text-anchor": anchor }, t("fw.n" + (i + 1)));
    }
    add(svg, "circle", { cx: C, cy: C, r: 62, class: "fw-center" });
    add(svg, "text", { x: C, y: C + 6, class: "fw-center-text", "text-anchor": "middle" }, t("fw.center"));
    add(svg, "text", { x: C, y: C + 28, class: "fw-center-sub", "text-anchor": "middle" }, t("fw.centerSub"));
  }

  // Storehouse band: rows of grains that fill, one by one, as the band enters view
  function initField() {
    const canvas = document.getElementById("field-canvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#111";
    let w = 0, h = 0, grains = [], progress = reduce ? 1 : 0, started = reduce, startTime = 0;
    function setup() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gx = 26, gy = 38;
      const cols = Math.floor(w / gx), rows = Math.floor(h / gy);
      const ox = (w - (cols - 1) * gx) / 2, oy = (h - (rows - 1) * gy) / 2;
      grains = [];
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        grains.push({ x: ox + c * gx, y: oy + r * gy, tilt: ((c * 7 + r * 3) % 5 - 2) * 6, order: c + r * 0.6 + ((c * 13 + r * 7) % 9) * 0.35 });
      }
      const max = Math.max(...grains.map((g) => g.order));
      grains.forEach((g) => (g.order /= max));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      grains.forEach((g) => {
        const filled = g.order <= progress;
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate((g.tilt * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.2, 8, 0, 0, Math.PI * 2);
        if (filled) { ctx.fillStyle = ink; ctx.globalAlpha = 1; ctx.fill(); }
        else { ctx.strokeStyle = ink; ctx.globalAlpha = 0.18; ctx.lineWidth = 1; ctx.stroke(); }
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      if (!startTime) startTime = now;
      progress = Math.min(1, (now - startTime) / 4200);
      draw();
      if (progress < 1) requestAnimationFrame(frame);
    }
    setup(); draw();
    if (!reduce && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting) && !started) { started = true; requestAnimationFrame(frame); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(canvas);
    } else { progress = 1; draw(); }
    window.addEventListener("resize", () => { setup(); draw(); });
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
